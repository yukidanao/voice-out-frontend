import { isPlatformBrowser, NgClass } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { DataService, GiphyGif, Song } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { DialogService } from '../../services/dialog.service';
import { AudioPlayerComponent } from '../ui/audio-player/audio-player.component';
import { IconComponent } from '../ui/icon/icon.component';
import { of, Subscription, timer } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

type FileKind = 'image' | 'audio' | 'video' | 'file';
const SONG_SEARCH_PAGE_SIZE = 8;
const SUGGESTION_PAGE_SIZE = 6;
const GIF_PAGE_SIZE = 6;
const ITUNES_MAX_RESULTS = 200;

@Component({
  selector: 'app-write-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, IconComponent, AudioPlayerComponent],
  templateUrl: './write-dialog.component.html',
  styleUrls: ['./write-dialog.component.css'],
})
export class WriteDialogComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  readonly dataService = inject(DataService);
  private readonly toast = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly dialog = inject(DialogService);

  @ViewChild('textarea') private textarea?: ElementRef<HTMLTextAreaElement>;
  private readonly searchSubscription: Subscription;
  private readonly gifSearchSubscription: Subscription;
  private gifMoreSubscription?: Subscription;
  private songSearchCatalog: Song[] = [];
  private songSuggestionCatalog: Song[] = [];

  readonly form = this.fb.group({
    thoughtText: [''],
    file: [null as File | null],
  });
  readonly songQuery = new FormControl('', { nonNullable: true });
  readonly gifQuery = new FormControl('', { nonNullable: true });

  readonly isLoading = signal(false);
  readonly dragActive = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly selectedSong = signal<Song | null>(null);
  readonly songSuggestions = signal<Song[]>([]);
  readonly songResults = signal<Song[]>([]);
  readonly isSearchingSongs = signal(false);
  readonly isLoadingSuggestions = signal(false);
  readonly hasMoreSongResults = signal(true);
  readonly hasMoreSongSuggestions = signal(true);
  readonly songSearchError = signal(false);
  readonly songSuggestionsError = signal(false);
  readonly selectedGif = signal<GiphyGif | null>(null);
  readonly gifSuggestions = signal<GiphyGif[]>([]);
  readonly gifResults = signal<GiphyGif[]>([]);
  readonly isSearchingGifs = signal(false);
  readonly isLoadingGifSuggestions = signal(false);
  readonly isLoadingMoreGifs = signal(false);
  readonly hasMoreGifResults = signal(true);
  readonly hasMoreGifSuggestions = signal(true);
  readonly gifSearchError = signal(false);
  readonly gifSuggestionsError = signal(false);

  constructor() {
    this.searchSubscription = this.songQuery.valueChanges
      .pipe(
        tap((query) => {
          this.songSearchCatalog = [];
          this.songResults.set([]);
          this.hasMoreSongResults.set(true);
          this.songSearchError.set(false);
          this.isSearchingSongs.set(query.trim().length >= 2);
        }),
        switchMap((query) => {
          const term = query.trim();
          if (term.length < 2) return of([]);
          return timer(300).pipe(
            switchMap(() =>
              this.dataService.searchSongs(term, ITUNES_MAX_RESULTS).pipe(
                catchError(() => {
                  this.songSearchError.set(true);
                  return of([]);
                }),
              ),
            ),
          );
        }),
      )
      .subscribe((songs) => {
        this.songSearchCatalog = songs;
        this.songResults.set(songs.slice(0, SONG_SEARCH_PAGE_SIZE));
        this.hasMoreSongResults.set(songs.length > SONG_SEARCH_PAGE_SIZE);
        this.isSearchingSongs.set(false);
      });

    this.gifSearchSubscription = this.gifQuery.valueChanges
      .pipe(
        tap((query) => {
          this.gifMoreSubscription?.unsubscribe();
          this.isLoadingMoreGifs.set(false);
          this.gifResults.set([]);
          this.hasMoreGifResults.set(true);
          this.gifSearchError.set(false);
          this.isSearchingGifs.set(query.trim().length >= 2);
        }),
        switchMap((query) => {
          const term = query.trim();
          if (term.length < 2) return of([]);
          return timer(300).pipe(
            switchMap(() =>
              this.dataService.loadGiphyConfig().pipe(
                switchMap((isConfigured) => {
                  if (!isConfigured) {
                    this.gifSearchError.set(true);
                    return of([]);
                  }
                  return this.dataService.searchGifs(term, 0, GIF_PAGE_SIZE).pipe(
                    catchError(() => {
                      this.gifSearchError.set(true);
                      return of([]);
                    }),
                  );
                }),
                catchError(() => {
                  this.gifSearchError.set(true);
                  return of([]);
                }),
              ),
            ),
          );
        }),
      )
      .subscribe((gifs) => {
        this.gifResults.set(gifs);
        this.hasMoreGifResults.set(gifs.length === GIF_PAGE_SIZE);
        this.isSearchingGifs.set(false);
      });

    effect(
      () => {
        const open = this.dialog.writeOpen();
        if (!isPlatformBrowser(this.platformId)) return;

        document.body.style.overflow = open ? 'hidden' : '';

        if (open) {
          window.setTimeout(() => this.textarea?.nativeElement.focus(), 120);
          this.loadSongSuggestions();
          this.loadGifSuggestions();
        } else {
          this.resetForm();
        }
      },
      { allowSignalWrites: true },
    );
  }

  get canSubmit(): boolean {
    const text = (this.form.controls.thoughtText.value ?? '').trim();
    return (
      text.length > 0 ||
      this.form.controls.file.value !== null ||
      this.selectedSong() !== null ||
      this.selectedGif() !== null
    );
  }

  get characterCount(): number {
    return this.form.controls.thoughtText.value?.length ?? 0;
  }

  fileKind(): FileKind | null {
    const file = this.selectedFile();
    if (!file) return null;
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    return 'file';
  }

  close(): void {
    if (this.isLoading()) return;
    this.dialog.closeWrite();
  }

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.setFile(file);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.setFile(file);
  }

  removeFile(): void {
    this.revokePreview();
    this.selectedFile.set(null);
    this.form.controls.file.setValue(null);
  }

  selectSong(song: Song): void {
    this.selectedSong.set(song);
    this.songQuery.setValue('');
    this.songResults.set([]);
  }

  onSongListScroll(event: Event): void {
    if (!this.isNearScrollEnd(event)) return;
    const term = this.songQuery.value.trim();
    if (term.length >= 2) {
      this.loadMoreSongResults();
    } else {
      this.loadMoreSongSuggestions();
    }
  }

  onGifListScroll(event: Event): void {
    if (!this.isNearScrollEnd(event)) return;
    const term = this.gifQuery.value.trim();
    if (term.length >= 2) {
      this.loadMoreGifResults(term);
    } else {
      this.loadMoreGifSuggestions();
    }
  }

  private loadSongSuggestions(): void {
    if (this.songSuggestions().length > 0 || this.isLoadingSuggestions()) return;

    this.isLoadingSuggestions.set(true);
    this.songSuggestionsError.set(false);
    this.dataService.getSongSuggestions(ITUNES_MAX_RESULTS).subscribe({
      next: (songs) => {
        this.songSuggestionCatalog = songs;
        this.songSuggestions.set(songs.slice(0, SUGGESTION_PAGE_SIZE));
        this.hasMoreSongSuggestions.set(songs.length > SUGGESTION_PAGE_SIZE);
        this.isLoadingSuggestions.set(false);
      },
      error: () => {
        this.isLoadingSuggestions.set(false);
        this.songSuggestionsError.set(true);
      },
    });
  }

  private loadMoreSongResults(): void {
    if (!this.hasMoreSongResults()) return;
    const count = this.songResults().length + SONG_SEARCH_PAGE_SIZE;
    this.songResults.set(this.songSearchCatalog.slice(0, count));
    this.hasMoreSongResults.set(this.songSearchCatalog.length > count);
  }

  private loadMoreSongSuggestions(): void {
    if (!this.hasMoreSongSuggestions()) return;
    const count = this.songSuggestions().length + SUGGESTION_PAGE_SIZE;
    this.songSuggestions.set(this.songSuggestionCatalog.slice(0, count));
    this.hasMoreSongSuggestions.set(this.songSuggestionCatalog.length > count);
  }

  removeSong(): void {
    this.selectedSong.set(null);
  }

  selectGif(gif: GiphyGif): void {
    this.selectedGif.set(gif);
    this.gifQuery.setValue('');
    this.gifResults.set([]);
  }

  removeGif(): void {
    this.selectedGif.set(null);
  }

  private loadGifSuggestions(): void {
    if (this.gifSuggestions().length > 0 || this.isLoadingGifSuggestions()) return;

    this.isLoadingGifSuggestions.set(true);
    this.gifSuggestionsError.set(false);
    this.dataService.loadGiphyConfig().pipe(
      switchMap((isConfigured) => {
        if (!isConfigured) {
          this.gifSuggestionsError.set(true);
          return of([]);
        }
        return this.dataService.getGifSuggestions(0, GIF_PAGE_SIZE);
      }),
      catchError(() => {
        this.gifSuggestionsError.set(true);
        return of([]);
      }),
    ).subscribe({
      next: (gifs) => {
        this.gifSuggestions.set(gifs);
        this.hasMoreGifSuggestions.set(gifs.length === GIF_PAGE_SIZE);
        this.isLoadingGifSuggestions.set(false);
      },
      error: () => {
        this.gifSuggestionsError.set(true);
        this.isLoadingGifSuggestions.set(false);
      },
    });
  }

  private loadMoreGifResults(term: string): void {
    if (this.isLoadingMoreGifs() || !this.hasMoreGifResults()) return;
    const offset = this.gifResults().length;
    this.isLoadingMoreGifs.set(true);
    this.gifMoreSubscription = this.dataService.loadGiphyConfig().pipe(
      switchMap((isConfigured) => {
        if (!isConfigured) throw new Error('GIPHY API key is not configured');
        return this.dataService.searchGifs(term, offset, GIF_PAGE_SIZE);
      }),
    ).subscribe({
      next: (gifs) => {
        if (this.gifQuery.value.trim() === term) {
          this.gifResults.update((results) => [...results, ...gifs]);
          this.hasMoreGifResults.set(gifs.length === GIF_PAGE_SIZE);
        }
        this.isLoadingMoreGifs.set(false);
      },
      error: () => {
        if (this.gifQuery.value.trim() === term) this.gifSearchError.set(true);
        this.isLoadingMoreGifs.set(false);
      },
    });
  }

  private loadMoreGifSuggestions(): void {
    if (this.isLoadingMoreGifs() || !this.hasMoreGifSuggestions()) return;
    const offset = this.gifSuggestions().length;
    this.isLoadingMoreGifs.set(true);
    this.dataService.getGifSuggestions(offset, GIF_PAGE_SIZE).subscribe({
      next: (gifs) => {
        this.gifSuggestions.update((results) => [...results, ...gifs]);
        this.hasMoreGifSuggestions.set(gifs.length === GIF_PAGE_SIZE);
        this.isLoadingMoreGifs.set(false);
      },
      error: () => {
        this.gifSuggestionsError.set(true);
        this.isLoadingMoreGifs.set(false);
      },
    });
  }

  private isNearScrollEnd(event: Event): boolean {
    const element = event.currentTarget as HTMLElement;
    return element.scrollHeight - element.scrollTop - element.clientHeight < 80;
  }

  onSubmit(): void {
    if (this.isLoading() || !this.canSubmit) return;

    const text = (this.form.controls.thoughtText.value ?? '').trim();
    const file = this.form.controls.file.value;
    const song = this.selectedSong() ?? undefined;
    const gifUrl = this.selectedGif()?.gifUrl;

    this.isLoading.set(true);
    this.dataService.postVoiceOut(text, file ?? undefined, song, gifUrl).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toast.success('Note posted', 'Your voice is now live on the wall.');
        this.dialog.closeWrite();
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('Could not post your note', 'Something went wrong. Please try again.');
      },
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.dialog.writeOpen()) this.close();
  }

  ngOnDestroy(): void {
    this.searchSubscription.unsubscribe();
    this.gifSearchSubscription.unsubscribe();
    this.gifMoreSubscription?.unsubscribe();
    this.revokePreview();
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  private setFile(file: File): void {
    this.revokePreview();
    this.selectedFile.set(file);
    this.form.controls.file.setValue(file);

    if (isPlatformBrowser(this.platformId) && file.type.startsWith('image/')) {
      this.previewUrl.set(URL.createObjectURL(file));
    }
  }

  private revokePreview(): void {
    const url = this.previewUrl();
    if (url && isPlatformBrowser(this.platformId)) {
      URL.revokeObjectURL(url);
    }
    this.previewUrl.set(null);
  }

  private resetForm(): void {
    this.form.reset({ thoughtText: '', file: null });
    this.isLoading.set(false);
    this.dragActive.set(false);
    this.selectedFile.set(null);
    this.selectedSong.set(null);
    this.selectedGif.set(null);
    this.songQuery.setValue('');
    this.gifQuery.setValue('');
    this.songResults.set([]);
    this.gifResults.set([]);
    this.isSearchingSongs.set(false);
    this.isSearchingGifs.set(false);
    this.songSearchError.set(false);
    this.gifSearchError.set(false);
    this.gifSuggestionsError.set(false);
    this.revokePreview();
  }
}
