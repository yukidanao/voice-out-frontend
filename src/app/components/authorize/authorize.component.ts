import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../ui/icon/icon.component';

@Component({
  selector: 'app-authorize',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  templateUrl: './authorize.component.html',
  styleUrl: './authorize.component.css',
})
export class AuthorizeComponent {
  private readonly router = inject(Router);
  private readonly correctPasscode = '13262201';

  passcode = '';
  readonly reveal = signal(false);
  readonly error = signal(false);
  readonly shake = signal(false);

  authorize(): void {
    if (this.passcode.trim() === this.correctPasscode) {
      localStorage.setItem('authorized', 'true');
      this.router.navigate(['/voices']);
      return;
    }

    this.error.set(true);
    this.shake.set(true);
    window.setTimeout(() => this.shake.set(false), 550);
  }

  onInput(): void {
    this.error.set(false);
  }

  toggleReveal(): void {
    this.reveal.update((value) => !value);
  }
}
