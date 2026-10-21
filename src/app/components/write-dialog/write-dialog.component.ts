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
import { DataService, Song } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { DialogService } from '../../services/dialog.service';
import { AudioPlayerComponent } from '../ui/audio-player/audio-player.component';
import { IconComponent } from '../ui/icon/icon.component';
import { of, Subscription, timer } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

type FileKind = 'image' | 'audio' | 'video' | 'file';

@Component({
  selector: 'app-write-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, IconComponent, AudioPlayerComponent],
  templateUrl: './write-dialog.component.html',
  styleUrls: ['./write-dialog.component.css'],
})
export class WriteDialogComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dataService = inject(DataService);
  private readonly toast = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly dialog = inject(DialogService);

  @ViewChild('textarea') private textarea?: ElementRef<HTMLTextAreaElement>;
  private readonly searchSubscription: Subscription;

  readonly form = this.fb.group({
    thoughtText: [''],
    file: [null as File | null],
  });
  readonly songQuery = new FormControl('', { nonNullable: true });

  readonly isLoading = signal(false);
  readonly dragActive = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly selectedSong = signal<Song | null>(null);
  readonly songSuggestions = signal<Song[]>([]);
  readonly songResults = signal<Song[]>([]);
  readonly isSearchingSongs = signal(false);
  readonly isLoadingSuggestions = signal(false);
  readonly songSearchError = signal(false);

  constructor() {
    this.searchSubscription = this.songQuery.valueChanges
      .pipe(
        tap((query) => {
          this.songResults.set([]);
          this.songSearchError.set(false);
          this.isSearchingSongs.set(query.trim().length >= 2);
        }),
        switchMap((query) => {
          const term = query.trim();
          if (term.length < 2) return of([]);
          return timer(300).pipe(
            switchMap(() =>
              this.dataService.searchSongs(term).pipe(
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
        this.songResults.set(songs);
        this.isSearchingSongs.set(false);
      });

    effect(
      () => {
        const open = this.dialog.writeOpen();
        if (!isPlatformBrowser(this.platformId)) return;

        document.body.style.overflow = open ? 'hidden' : '';

        if (open) {
          window.setTimeout(() => this.textarea?.nativeElement.focus(), 120);
          this.loadSongSuggestions();
        } else {
          this.resetForm();
        }
      },
      { allowSignalWrites: true },
    );
  }

  get canSubmit(): boolean {
    const text = (this.form.controls.thoughtText.value ?? '').trim();
    return text.length > 0 || this.form.controls.file.value !== null || this.selectedSong() !== null;
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

  private loadSongSuggestions(): void {
    if (this.songSuggestions().length > 0 || this.isLoadingSuggestions()) return;

    this.isLoadingSuggestions.set(true);
    this.dataService.getSongSuggestions().subscribe({
      next: (songs) => {
        this.songSuggestions.set(songs.slice(0, 6));
        this.isLoadingSuggestions.set(false);
      },
      error: () => {
        this.isLoadingSuggestions.set(false);
      },
    });
  }

  removeSong(): void {
    this.selectedSong.set(null);
  }

  onSubmit(): void {
    if (this.isLoading() || !this.canSubmit) return;

    const text = (this.form.controls.thoughtText.value ?? '').trim();
    const file = this.form.controls.file.value;
    const song = this.selectedSong() ?? undefined;

    this.isLoading.set(true);
    this.dataService.postVoiceOut(text, file ?? undefined, song).subscribe({
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
    this.songQuery.setValue('');
    this.songResults.set([]);
    this.isSearchingSongs.set(false);
    this.songSearchError.set(false);
    this.revokePreview();
  }
}
