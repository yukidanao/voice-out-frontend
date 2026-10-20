import { Component, Input } from '@angular/core';

export type IconName =
  | 'home'
  | 'waveform'
  | 'pen'
  | 'mail'
  | 'info'
  | 'play'
  | 'pause'
  | 'volume'
  | 'volume-off'
  | 'clock'
  | 'image'
  | 'video'
  | 'music'
  | 'send'
  | 'check'
  | 'alert'
  | 'loader'
  | 'arrow-right'
  | 'sparkles'
  | 'shield'
  | 'zap'
  | 'upload'
  | 'x'
  | 'plus'
  | 'lock'
  | 'eye'
  | 'eye-off'
  | 'chevron-right'
  | 'heart'
  | 'expand'
  | 'compress';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.width]="size"
      [attr.height]="size"
      [attr.stroke-width]="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class="shrink-0"
    >
      @switch (name) {
        @case ('home') {
          <path d="M3 10.7 12 3l9 7.7" />
          <path d="M5.5 9.4V20a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9.4" />
        }
        @case ('waveform') {
          <path d="M4 10v4" />
          <path d="M8 7v10" />
          <path d="M12 4v16" />
          <path d="M16 8v8" />
          <path d="M20 10.5v3" />
        }
        @case ('pen') {
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        }
        @case ('mail') {
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="m3.5 7 8.5 5.6L20.5 7" />
        }
        @case ('info') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 16v-4.5" />
          <path d="M12 8h.01" />
        }
        @case ('play') {
          <path
            d="M8 5.2v13.6a1 1 0 0 0 1.53.85l10.5-6.8a1 1 0 0 0 0-1.7L9.53 4.35A1 1 0 0 0 8 5.2Z"
            fill="currentColor"
            stroke="none"
          />
        }
        @case ('pause') {
          <rect x="7" y="5" width="3.6" height="14" rx="1.2" fill="currentColor" stroke="none" />
          <rect x="13.4" y="5" width="3.6" height="14" rx="1.2" fill="currentColor" stroke="none" />
        }
        @case ('volume') {
          <path d="M11 5 6.5 8.8H3v6.4h3.5L11 19Z" />
          <path d="M15.2 8.6a4.6 4.6 0 0 1 0 6.8" />
          <path d="M18 5.8a8.4 8.4 0 0 1 0 12.4" />
        }
        @case ('volume-off') {
          <path d="M11 5 6.5 8.8H3v6.4h3.5L11 19Z" />
          <path d="m16 9.5 5 5" />
          <path d="m21 9.5-5 5" />
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5.3l3.2 1.9" />
        }
        @case ('image') {
          <rect x="3" y="4" width="18" height="16" rx="2.5" />
          <circle cx="8.5" cy="9.5" r="1.6" />
          <path d="m4 17 4.7-4.4a2 2 0 0 1 2.7 0L20 20" />
        }
        @case ('video') {
          <rect x="2.5" y="6" width="13.5" height="12" rx="2.5" />
          <path d="m16 10.5 5-2.8v8.6l-5-2.8" />
        }
        @case ('music') {
          <path d="M9 17.5V5.6l11-2v11.6" />
          <circle cx="6.4" cy="17.7" r="2.6" />
          <circle cx="17.4" cy="15.4" r="2.6" />
        }
        @case ('send') {
          <path d="m21.5 2.5-7 19-4.2-8.3L2 9Z" />
          <path d="M21.5 2.5 10.3 13.2" />
        }
        @case ('check') {
          <path d="m20 6.5-11 11-5-5" />
        }
        @case ('alert') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5" />
          <path d="M12 16.2h.01" />
        }
        @case ('loader') {
          <path d="M21 12a9 9 0 1 1-6.2-8.56" />
        }
        @case ('arrow-right') {
          <path d="M4 12h16" />
          <path d="m14 6 6 6-6 6" />
        }
        @case ('sparkles') {
          <path d="m12 3 1.8 4.9 4.9 1.8-4.9 1.8L12 16.4l-1.8-4.9L5.3 9.7l4.9-1.8Z" />
          <path d="m18.5 14.5.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9Z" />
        }
        @case ('shield') {
          <path d="M12 3 5 6v6c0 4.6 3 7.7 7 9 4-1.3 7-4.4 7-9V6Z" />
          <path d="m9 12 2.1 2.1L15.5 10" />
        }
        @case ('zap') {
          <path d="M13 2 4.5 13.6H10l-1 8.4 8.5-11.6H12Z" />
        }
        @case ('upload') {
          <path d="M12 16V4" />
          <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
          <path d="M4.5 20h15" />
        }
        @case ('x') {
          <path d="m18 6-12 12" />
          <path d="m6 6 12 12" />
        }
        @case ('plus') {
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        }
        @case ('lock') {
          <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
          <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
          <path d="M12 14.5v2.5" />
        }
        @case ('eye') {
          <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
          <circle cx="12" cy="12" r="3" />
        }
        @case ('eye-off') {
          <path d="M10.7 6.1A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-2.4 3.1" />
          <path d="M6.3 8.2A17.7 17.7 0 0 0 2.5 12s3.5 6 9.5 6a9.6 9.6 0 0 0 3.8-.8" />
          <path d="m3 3 18 18" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        }
        @case ('chevron-right') {
          <path d="m9 5 7 7-7 7" />
        }
        @case ('heart') {
          <path
            d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.2 7.1L12 21l8.9-8.3a5 5 0 0 0-.1-7.1Z"
          />
        }
        @case ('expand') {
          <path d="M8 3H3v5" />
          <path d="M16 3h5v5" />
          <path d="M21 16v5h-5" />
          <path d="M3 16v5h5" />
        }
        @case ('compress') {
          <path d="M9 3v6H3" />
          <path d="M15 3v6h6" />
          <path d="M21 15h-6v6" />
          <path d="M3 15h6v6" />
        }
      }
    </svg>
  `,
})
export class IconComponent {
  @Input({ required: true }) name!: IconName;
  @Input() size: number | string = 20;
  @Input() strokeWidth: number | string = 1.8;
}
