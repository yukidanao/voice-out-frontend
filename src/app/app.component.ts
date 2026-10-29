import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { WriteDialogComponent } from './components/write-dialog/write-dialog.component';
import { ToastComponent } from './components/ui/toast/toast.component';
import { DialogService } from './services/dialog.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, WriteDialogComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly dialog = inject(DialogService);
  title = 'voice_out';
}
