import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconComponent, IconName } from '../ui/icon/icon.component';
import { DialogService } from '../../services/dialog.service';

interface NavItem {
  label: string;
  icon: IconName;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, IconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  private readonly dialog = inject(DialogService);

  readonly year = new Date().getFullYear();

  readonly nav: NavItem[] = [
    { label: 'Home', icon: 'home', route: '/home' },
    { label: 'Voices', icon: 'waveform', route: '/voices' },
    { label: 'Feedback', icon: 'mail', route: '/feedback' },
    { label: 'About', icon: 'info', route: '/about' },
  ];

  openWrite(): void {
    this.dialog.openWrite();
  }
}
