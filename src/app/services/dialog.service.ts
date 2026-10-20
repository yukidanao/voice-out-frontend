import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private readonly _writeOpen = signal(false);
  readonly writeOpen = this._writeOpen.asReadonly();

  openWrite(): void {
    this._writeOpen.set(true);
  }

  closeWrite(): void {
    this._writeOpen.set(false);
  }
}
