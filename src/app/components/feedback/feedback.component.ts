import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { IconComponent } from '../ui/icon/icon.component';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.css',
})
export class FeedbackComponent {
  private readonly dataService = inject(DataService);
  private readonly toast = inject(ToastService);

  readonly isLoading = signal(false);
  readonly submitted = signal(false);

  onSubmit(form: NgForm): void {
    if (!form.valid || this.isLoading()) return;

    const { email, subject, feedback } = form.value;
    this.isLoading.set(true);

    this.dataService.postInquiries({ email, subject, feedback }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.submitted.set(true);
        form.reset();
        this.toast.success('Message sent', 'Thanks — I read every single one.');
        setTimeout(() => this.submitted.set(false), 7000);
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('Could not send', 'Please try again in a moment.');
      },
    });
  }
}
