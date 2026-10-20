import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { claimPlayback, releasePlayback } from '../../../services/media-session';
import { IconComponent } from '../icon/icon.component';

const RATES = [1, 1.25, 1.5, 2];
const IDLE_DELAY = 2400;

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.css'],
})
export class VideoPlayerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) src!: string;
  @Input() label = 'Video note';

  @ViewChild('frame') private frameRef?: ElementRef<HTMLDivElement>;
  @ViewChild('video') private videoRef?: ElementRef<HTMLVideoElement>;

  private readonly platformId = inject(PLATFORM_ID);
  private listeners: Array<[string, EventListener]> = [];
  private idleTimer?: ReturnType<typeof setTimeout>;
  private isSeeking = false;
  private viewReady = false;

  readonly playing = signal(false);
  readonly buffering = signal(false);
  readonly duration = signal(0);
  readonly currentTime = signal(0);
  readonly buffered = signal(0);
  readonly muted = signal(false);
  readonly volume = signal(1);
  readonly rate = signal(1);
  readonly fullscreen = signal(false);
  readonly controlsVisible = signal(true);
  readonly ratio = signal('16 / 9');

  get progress(): number {
    const total = this.duration();
    return total > 0 ? Math.min(100, (this.currentTime() / total) * 100) : 0;
  }

  get bufferedPercent(): number {
    const total = this.duration();
    return total > 0 ? Math.min(100, (this.buffered() / total) * 100) : 0;
  }

  get ended(): boolean {
    const total = this.duration();
    return total > 0 && this.currentTime() >= total - 0.05 && !this.playing();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (isPlatformBrowser(this.platformId)) this.setup();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] && this.viewReady && isPlatformBrowser(this.platformId)) {
      this.setup();
    }
  }

  toggle(): void {
    const video = this.video;
    if (!video) return;

    if (video.paused) {
      claimPlayback(video);
      this.buffering.set(true);
      void video.play().catch(() => this.buffering.set(false));
    } else {
      video.pause();
    }
  }

  toggleMute(): void {
    const video = this.video;
    if (!video) return;
    video.muted = !video.muted;
    this.muted.set(video.muted);
  }

  onVolumeInput(event: Event): void {
    const video = this.video;
    if (!video) return;
    const value = Number((event.target as HTMLInputElement).value);
    video.volume = value;
    video.muted = value === 0;
    this.volume.set(video.volume);
    this.muted.set(video.muted);
  }

  cycleRate(): void {
    const index = RATES.indexOf(this.rate());
    const next = RATES[(index + 1) % RATES.length];
    this.rate.set(next);
    if (this.video) this.video.playbackRate = next;
  }

  async toggleFullscreen(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const frame = this.frameRef?.nativeElement;
    if (!frame) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (frame.requestFullscreen) {
        await frame.requestFullscreen();
      } else {
        (this.video as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null)
          ?.webkitEnterFullscreen?.();
      }
    } catch {
      // Fullscreen can be blocked by the browser; ignore silently.
    }
  }

  showControls(): void {
    this.controlsVisible.set(true);
    this.scheduleHide();
  }

  scheduleHide(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (!this.playing()) return;

    this.idleTimer = setTimeout(() => {
      if (this.playing() && !this.isSeeking) this.controlsVisible.set(false);
    }, IDLE_DELAY);
  }

  hideControls(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.playing() && !this.isSeeking) this.controlsVisible.set(false);
  }

  holdControls(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.controlsVisible.set(true);
  }

  startSeek(event: PointerEvent): void {
    this.isSeeking = true;
    this.controlsVisible.set(true);
    const element = event.currentTarget as HTMLElement;
    element.setPointerCapture?.(event.pointerId);
    this.applySeek(event);
  }

  moveSeek(event: PointerEvent): void {
    if (this.isSeeking) this.applySeek(event);
  }

  endSeek(event: PointerEvent): void {
    this.isSeeking = false;
    const element = event.currentTarget as HTMLElement;
    try {
      element.releasePointerCapture?.(event.pointerId);
    } catch {
      // pointer capture may already be released
    }
    this.scheduleHide();
  }

  onKeydown(event: KeyboardEvent): void {
    const video = this.video;
    if (!video) return;

    const total = this.duration();
    let next: number | null = null;

    switch (event.key.toLowerCase()) {
      case 'arrowright':
        next = Math.min(total, video.currentTime + 5);
        break;
      case 'arrowleft':
        next = Math.max(0, video.currentTime - 5);
        break;
      case 'home':
        next = 0;
        break;
      case 'end':
        next = total;
        break;
      case 'm':
        event.preventDefault();
        this.toggleMute();
        return;
      case 'f':
        event.preventDefault();
        void this.toggleFullscreen();
        return;
      case ' ':
      case 'enter':
        event.preventDefault();
        this.toggle();
        return;
      default:
        return;
    }

    event.preventDefault();
    video.currentTime = next;
    this.currentTime.set(next);
    this.showControls();
  }

  format(seconds: number): string {
    const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
    const minutes = Math.floor(safe / 60);
    const secs = Math.floor(safe % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  ngOnDestroy(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.teardown();
  }

  private get video(): HTMLVideoElement | null {
    return this.videoRef?.nativeElement ?? null;
  }

  private applySeek(event: PointerEvent): void {
    const video = this.video;
    const track = event.currentTarget as HTMLElement | null;
    const total = this.duration();
    if (!video || !track || total <= 0) return;

    const rect = track.getBoundingClientRect();
    if (rect.width === 0) return;

    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const time = ratio * total;
    video.currentTime = time;
    this.currentTime.set(time);
  }

  /**
   * Match the frame to the clip's real shape (within sensible bounds) so
   * portrait phone videos aren't buried in black bars.
   */
  private applyRatio(width: number, height: number): void {
    if (!width || !height) return;

    const ratio = Math.min(16 / 9, Math.max(0.62, width / height));
    this.ratio.set(String(Number(ratio.toFixed(3))));
  }

  private updateBuffered(): void {
    const video = this.video;
    if (!video || video.buffered.length === 0) return;

    const total = Number.isFinite(video.duration) ? video.duration : this.duration();
    if (total <= 0) return;

    let end = 0;
    for (let i = 0; i < video.buffered.length; i++) {
      if (video.buffered.start(i) <= video.currentTime + 0.5) {
        end = Math.max(end, video.buffered.end(i));
      }
    }
    this.buffered.set(Math.min(total, end));
  }

  private setup(): void {
    this.teardown();
    const video = this.video;
    if (!video || !this.src) return;

    video.src = this.src;

    const add = (name: string, handler: () => void) => {
      const listener = handler as EventListener;
      video.addEventListener(name, listener);
      this.listeners.push([name, listener]);
    };

    add('loadedmetadata', () => {
      this.duration.set(Number.isFinite(video.duration) ? video.duration : 0);
      this.buffering.set(false);
      this.applyRatio(video.videoWidth, video.videoHeight);
      this.updateBuffered();
    });
    add('durationchange', () => {
      this.duration.set(Number.isFinite(video.duration) ? video.duration : 0);
    });
    add('timeupdate', () => {
      if (!this.isSeeking) this.currentTime.set(video.currentTime);
      this.updateBuffered();
    });
    add('progress', () => this.updateBuffered());
    add('play', () => {
      claimPlayback(video);
      this.playing.set(true);
      this.buffering.set(false);
      this.scheduleHide();
    });
    add('playing', () => this.buffering.set(false));
    add('pause', () => {
      this.playing.set(false);
      this.buffering.set(false);
      this.controlsVisible.set(true);
      if (this.idleTimer) clearTimeout(this.idleTimer);
    });
    add('waiting', () => this.buffering.set(true));
    add('canplay', () => this.buffering.set(false));
    add('ended', () => {
      this.playing.set(false);
      this.controlsVisible.set(true);
    });
    add('volumechange', () => {
      this.volume.set(video.volume);
      this.muted.set(video.muted);
    });
    add('error', () => {
      this.playing.set(false);
      this.buffering.set(false);
    });

    if (document.addEventListener) {
      document.addEventListener('fullscreenchange', this.onFullscreenChange);
      document.addEventListener('webkitfullscreenchange', this.onFullscreenChange);
    }
  }

  private teardown(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const video = this.video;
    this.listeners.forEach(([name, handler]) => video?.removeEventListener(name, handler));
    this.listeners = [];

    if (typeof document !== 'undefined' && document.removeEventListener) {
      document.removeEventListener('fullscreenchange', this.onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', this.onFullscreenChange);
    }

    if (video) {
      video.pause();
      releasePlayback(video);
      video.removeAttribute('src');
      video.load();
    }

    this.playing.set(false);
    this.buffering.set(false);
    this.currentTime.set(0);
    this.duration.set(0);
    this.buffered.set(0);
    this.rate.set(1);
    this.fullscreen.set(false);
    this.controlsVisible.set(true);
    this.ratio.set('16 / 9');
  }

  private readonly onFullscreenChange = (): void => {
    const frame = this.frameRef?.nativeElement;
    if (!frame) return;
    this.fullscreen.set(document.fullscreenElement === frame);
  };
}
