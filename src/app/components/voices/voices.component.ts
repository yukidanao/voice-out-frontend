import { DatePipe, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { Subscription, fromEvent, interval, of } from 'rxjs';
import { catchError, debounceTime, switchMap, take, takeWhile } from 'rxjs/operators';
import { DataService, Song } from '../../services/data.service';
import { DialogService } from '../../services/dialog.service';
import { tintFor } from '../../utils/tint';
import { AudioPlayerComponent } from '../ui/audio-player/audio-player.component';
import { VideoPlayerComponent } from '../ui/video-player/video-player.component';
import { IconComponent, IconName } from '../ui/icon/icon.component';

interface Voices {
  voice_out: string;
  file?: string;
  date?: Date;
  _id?: string;
  fileType?: string;
  song?: Song;
}

type FilterValue = 'all' | 'text' | 'image' | 'audio' | 'video';

interface VoiceFilter {
  value: FilterValue;
  label: string;
  icon: IconName;
}

@Component({
  selector: 'app-voices',
  standalone: true,
  imports: [DatePipe, IconComponent, AudioPlayerComponent, VideoPlayerComponent],
  templateUrl: './voices.component.html',
  styleUrls: ['./voices.component.css'],
})
export class VoicesComponent implements OnInit, OnDestroy {
  private readonly dataService = inject(DataService);
  private readonly dialog = inject(DialogService);
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly subscriptions = new Subscription();

  voices: Voices[] = [];
  loading = true;
  lazyLoading = false;
  loadError = false;
  currentPage = 1;
  pageSize = 20;
  totalPages = 0;
  reachedEnd = false;
  activeFilter: FilterValue = 'all';

  readonly filters: VoiceFilter[] = [
    { value: 'all', label: 'All', icon: 'sparkles' },
    { value: 'text', label: 'Text', icon: 'pen' },
    { value: 'image', label: 'Photos', icon: 'image' },
    { value: 'audio', label: 'Audio', icon: 'waveform' },
    { value: 'video', label: 'Video', icon: 'video' },
  ];

  get filteredVoices(): Voices[] {
    if (this.activeFilter === 'all') return this.voices;
    if (this.activeFilter === 'text') {
      return this.voices.filter((voice) => !voice.file || voice.fileType === 'unknown');
    }
    return this.voices.filter((voice) => voice.fileType === this.activeFilter);
  }

  ngOnInit(): void {
    this.getVoices();

    this.subscriptions.add(
      this.dataService.newVoiceOut$.subscribe((newVoice: Voices) => {
        if (!this.voices.find((voice) => voice._id === newVoice._id)) {
          const voice: Voices = {
            ...newVoice,
            fileType: this.getFileType(newVoice.file || ''),
          };
          this.voices.unshift(voice);
          this.waitForFileToBeAvailable(voice);
        }
      }),
    );

    if (isPlatformBrowser(this.platformId)) {
      this.subscriptions.add(
        fromEvent(window, 'scroll')
          .pipe(debounceTime(200))
          .subscribe(() => this.onScroll()),
      );
    }
  }

  getVoices(): void {
    if (this.reachedEnd || this.lazyLoading) return;

    this.lazyLoading = true;
    this.loadError = false;

    this.dataService.getVoiceOuts(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        const voiceOuts: Voices[] = response.voice_outs ?? [];

        voiceOuts.forEach((voiceout) => {
          this.voices.push({
            ...voiceout,
            fileType: this.getFileType(voiceout.file || ''),
          });
        });

        this.totalPages = response.totalPages ?? 0;
        this.reachedEnd = this.currentPage >= this.totalPages;
        this.currentPage += 1;
        this.lazyLoading = false;
        this.loading = false;
      },
      error: () => {
        this.lazyLoading = false;
        this.loading = false;
        this.loadError = true;
      },
    });
  }

  setFilter(filter: FilterValue): void {
    this.activeFilter = filter;
  }

  countFor(filter: FilterValue): number {
    if (filter === 'all') return this.voices.length;
    if (filter === 'text') {
      return this.voices.filter((voice) => !voice.file || voice.fileType === 'unknown').length;
    }
    return this.voices.filter((voice) => voice.fileType === filter).length;
  }

  retry(): void {
    if (this.lazyLoading) return;
    this.loading = true;
    this.reachedEnd = false;
    this.currentPage = 1;
    this.voices = [];
    this.getVoices();
  }

  openWrite(): void {
    this.dialog.openWrite();
  }

  stagger(index: number): number {
    return Math.min(index, 8) * 60;
  }

  /** Stable per-note tint, so a card keeps its color as the feed reorders. */
  tint(voice: Voices): number {
    return tintFor(voice._id || `${voice.voice_out}|${voice.date ?? ''}|${voice.file ?? ''}`);
  }

  mediaIcon(type: string): IconName {
    switch (type) {
      case 'image':
        return 'image';
      case 'audio':
        return 'waveform';
      case 'video':
        return 'video';
      default:
        return 'sparkles';
    }
  }

  mediaLabel(type: string): string {
    switch (type) {
      case 'image':
        return 'Photo';
      case 'audio':
        return 'Audio';
      case 'video':
        return 'Video';
      default:
        return 'Note';
    }
  }

  getFileType(url: string): 'image' | 'audio' | 'video' | 'unknown' {
    const ext = url.split('.').pop()?.toLowerCase();
    if (!ext) return 'unknown';
    if (['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['mp3', 'wav', 'm4a', 'ogg'].includes(ext)) return 'audio';
    if (['mp4', 'avi', 'mkv', 'mov', 'webm'].includes(ext)) return 'video';
    return 'unknown';
  }

  onScroll(): void {
    if (this.lazyLoading || this.reachedEnd || this.loading) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 240;
    if (scrollPosition >= threshold) {
      this.getVoices();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private checkFileAvailability(url: string) {
    return this.http.head(url, { observe: 'response' }).pipe(
      switchMap((response) => of(response.status === 200)),
      catchError(() => of(false)),
    );
  }

  private waitForFileToBeAvailable(voice: Voices): void {
    if (!voice.file) return;

    this.subscriptions.add(
      interval(1000)
        .pipe(
          switchMap(() => this.checkFileAvailability(voice.file || '')),
          takeWhile((isAvailable) => !isAvailable, true),
          take(45),
        )
        .subscribe((isAvailable) => {
          if (isAvailable) {
            voice.fileType = this.getFileType(voice.file || '');
          }
        }),
    );
  }
}
