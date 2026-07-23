import { Routes } from '@angular/router';
import { VoicesComponent } from './components/voices/voices.component';
import { FeedbackComponent } from './components/feedback/feedback.component';
import { AboutComponent } from './components/about/about.component';
import { LandingComponent } from './components/landing/landing.component';
import { passcodeGuard } from './guards/passcode.guard';
import { AuthorizeComponent } from './components/authorize/authorize.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'home', component: LandingComponent },
  { path: 'voices', component: VoicesComponent, canActivate: [passcodeGuard] },
  { path: 'feedback', component: FeedbackComponent, canActivate: [passcodeGuard] },
  // { path: 'about', component: AboutComponent, canActivate: [passcodeGuard] },
  { path: 'authorize', component: AuthorizeComponent },
  { path: '**', redirectTo: '' }
];