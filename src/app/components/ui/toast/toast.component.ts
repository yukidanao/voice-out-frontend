import { Component, inject } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon.component';
import { ToastKind, ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div
      class="pointer-events-none fixed bottom-28 right-4 z-[80] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2.5 sm:bottom-6 sm:right-6"
      aria-live="polite"
      aria-atomic="false"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex animate-scale-in items-start gap-3 rounded-2xl border border-white/10 bg-ink-850/95 p-4 shadow-2xl backdrop-blur-xl"
          role="status"
        >
          <span [class]="toneClass(toast.kind)">
            <app-icon [name]="iconFor(toast.kind)" [size]="18" />
          </span>

          <div class="min-w-0 flex-1 pt-0.5">
            <p class="text-sm font-semibold leading-tight text-white">{{ toast.title }}</p>
            @if (toast.message) {
              <p class="mt-1 text-xs leading-relaxed text-slate-400">{{ toast.message }}</p>
            }
          </div>

          <button
            type="button"
            class="-mr-1 -mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-slate-200"
            (click)="toastService.dismiss(toast.id)"
            aria-label="Dismiss notification"
          >
            <app-icon name="x" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  iconFor(kind: ToastKind): IconName {
    switch (kind) {
      case 'success':
        return 'check';
      case 'error':
        return 'alert';
      default:
        return 'info';
    }
  }

  toneClass(kind: ToastKind): string {
    const base = 'grid h-9 w-9 shrink-0 place-items-center rounded-xl';
    switch (kind) {
      case 'success':
        return `${base} bg-emerald-500/15 text-emerald-300`;
      case 'error':
        return `${base} bg-rose-500/15 text-rose-300`;
      default:
        return `${base} bg-accent-500/15 text-accent-300`;
    }
  }
}
