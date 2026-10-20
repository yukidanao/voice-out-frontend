import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private counter = 0;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(kind: ToastKind, title: string, message?: string, duration = 4200): number {
    const id = ++this.counter;
    this._toasts.update((list) => [...list.slice(-2), { id, kind, title, message }]);

    if (typeof window !== 'undefined') {
      window.setTimeout(() => this.dismiss(id), duration);
    }

    return id;
  }

  success(title: string, message?: string): number {
    return this.show('success', title, message);
  }

  error(title: string, message?: string): number {
    return this.show('error', title, message);
  }

  info(title: string, message?: string): number {
    return this.show('info', title, message);
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((toast) => toast.id !== id));
  }
}
