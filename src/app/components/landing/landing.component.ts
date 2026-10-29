import { isPlatformBrowser } from '@angular/common';
import { Component, NgZone, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DialogService } from '../../services/dialog.service';
import { IconComponent, IconName } from '../ui/icon/icon.component';
import { VideoPlayerComponent } from '../ui/video-player/video-player.component';

interface Feature {
  icon: IconName;
  title: string;
  text: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, IconComponent, VideoPlayerComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly dialog = inject(DialogService);
  private readonly ngZone = inject(NgZone);

  readonly emotions = ['Alone', 'Embarrassed', 'Sad', 'Happy', 'Excited', 'Hopeful'];

  readonly features: Feature[] = [
    {
      icon: 'shield',
      title: 'Truly anonymous',
      text: 'No names, no accounts, no history. Just a space to be honest without being seen.',
    },
    {
      icon: 'zap',
      title: 'Instantly live',
      text: 'Your note lands on the wall in real time, the moment you post it.',
    },
    {
      icon: 'waveform',
      title: 'Beyond words',
      text: 'Attach a photo, a video, or a voice note when text is not enough.',
    },
  ];

  currentEmotionIndex = 0;
  displayedText = 'Alone?';
  isDeleting = false;
  private timer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.typeEffect();
    }
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }

  openWrite(): void {
    this.dialog.openWrite();
  }

  private typeEffect(): void {
    const fullText = `${this.emotions[this.currentEmotionIndex]}?`;
    let speed = this.isDeleting ? 45 : 95;

    this.displayedText = this.isDeleting
      ? fullText.slice(0, Math.max(0, this.displayedText.length - 1))
      : fullText.slice(0, this.displayedText.length + 1);

    if (!this.isDeleting && this.displayedText === fullText) {
      speed = 1700;
      this.isDeleting = true;
    } else if (this.isDeleting && this.displayedText.length === 0) {
      this.isDeleting = false;
      this.currentEmotionIndex = (this.currentEmotionIndex + 1) % this.emotions.length;
      speed = 420;
    }

    this.timer = this.ngZone.runOutsideAngular(() =>
      setTimeout(() => this.ngZone.run(() => this.typeEffect()), speed),
    );
  }
}
