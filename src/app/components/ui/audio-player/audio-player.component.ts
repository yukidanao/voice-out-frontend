import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { claimPlayback, releasePlayback } from '../../../services/media-session';

const RATES = [1, 1.25, 1.5, 2];
const BAR_COUNT = 38;

@Component({
  selector: 'app-audio-player',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './audio-player.component.html',
  styleUrls: ['./audio-player.component.css'],
})
export class AudioPlayerComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) src!: string;
  @Input() title = 'Voice note';
  @Input() compact = false;

  private readonly platformId = inject(PLATFORM_ID);
  private audio: HTMLAudioElement | null = null;
  private listeners: Array<[string, EventListener]> = [];
  private isSeeking = false;

  readonly playing = signal(false);
  readonly buffering = signal(false);
  readonly duration = signal(0);
  readonly currentTime = signal(0);
  readonly muted = signal(false);
  readonly rate = signal(1);
  readonly bars = signal<number[]>([]);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] && isPlatformBrowser(this.platformId)) {
      this.setup();
    }
  }

  get progress(): number {
    const total = this.duration();
    return total > 0 ? Math.min(1, this.currentTime() / total) : 0;
  }

  toggle(): void {
    const audio = this.audio;
    if (!audio) return;

    if (audio.paused) {
      claimPlayback(audio);
      this.buffering.set(true);
      void audio.play().catch(() => this.buffering.set(false));
    } else {
      audio.pause();
    }
  }

  startSeek(event: PointerEvent): void {
    this.isSeeking = true;
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
  }

  onKeydown(event: KeyboardEvent): void {
    const audio = this.audio;
    if (!audio) return;

    const total = this.duration();
    let next: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
        next = Math.min(total, audio.currentTime + 5);
        break;
      case 'ArrowLeft':
        next = Math.max(0, audio.currentTime - 5);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = total;
        break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        this.toggle();
        return;
      default:
        return;
    }

    event.preventDefault();
    audio.currentTime = next;
    this.currentTime.set(next);
  }

  cycleRate(): void {
    const index = RATES.indexOf(this.rate());
    const next = RATES[(index + 1) % RATES.length];
    this.rate.set(next);
    if (this.audio) this.audio.playbackRate = next;
  }

  toggleMute(): void {
    if (!this.audio) return;
    this.audio.muted = !this.audio.muted;
    this.muted.set(this.audio.muted);
  }

  format(seconds: number): string {
    const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
    const minutes = Math.floor(safe / 60);
    const secs = Math.floor(safe % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  ngOnDestroy(): void {
    this.teardown();
  }

  private applySeek(event: PointerEvent): void {
    const audio = this.audio;
    const track = event.currentTarget as HTMLElement | null;
    const total = this.duration();
    if (!audio || !track || total <= 0) return;

    const rect = track.getBoundingClientRect();
    if (rect.width === 0) return;

    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const time = ratio * total;
    audio.currentTime = time;
    this.currentTime.set(time);
  }

  private setup(): void {
    this.teardown();
    if (!this.src) return;

    this.bars.set(buildBars(this.src));

    const audio = new Audio();
    audio.preload = 'metadata';
    audio.src = this.src;
    this.audio = audio;

    const add = (name: string, handler: () => void) => {
      const listener = handler as EventListener;
      audio.addEventListener(name, listener);
      this.listeners.push([name, listener]);
    };

    add('loadedmetadata', () => {
      this.duration.set(Number.isFinite(audio.duration) ? audio.duration : 0);
      this.buffering.set(false);
    });
    add('durationchange', () => {
      this.duration.set(Number.isFinite(audio.duration) ? audio.duration : 0);
    });
    add('timeupdate', () => {
      if (!this.isSeeking) this.currentTime.set(audio.currentTime);
    });
    add('play', () => {
      claimPlayback(audio);
      this.playing.set(true);
      this.buffering.set(false);
    });
    add('playing', () => this.buffering.set(false));
    add('pause', () => {
      this.playing.set(false);
      this.buffering.set(false);
    });
    add('waiting', () => this.buffering.set(true));
    add('canplay', () => this.buffering.set(false));
    add('ended', () => {
      this.playing.set(false);
      this.currentTime.set(0);
    });
    add('error', () => {
      this.playing.set(false);
      this.buffering.set(false);
    });
  }

  private teardown(): void {
    const audio = this.audio;
    if (!audio) return;

    audio.pause();
    this.listeners.forEach(([name, handler]) => audio.removeEventListener(name, handler));
    this.listeners = [];
    audio.removeAttribute('src');
    audio.load();

    releasePlayback(audio);
    this.audio = null;
    this.playing.set(false);
    this.buffering.set(false);
    this.currentTime.set(0);
    this.duration.set(0);
  }
}

/**
 * Deterministic pseudo-random waveform so a given voice note always
 * renders the same shape.
 */
function buildBars(seed: string, count = BAR_COUNT): number[] {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const bars: number[] = [];
  let value = Math.abs(hash) || 1;

  for (let i = 0; i < count; i++) {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    const taper = Math.sin((i / (count - 1)) * Math.PI);
    const jitter = (value % 100) / 100;
    bars.push(Math.round(22 + taper * 32 + jitter * 40));
  }

  return bars;
}
