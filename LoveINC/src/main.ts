import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { 
  LucideAngularModule,
  Heart,
  Star,
  Home,
  User,
  Settings,
  Bell,
  Mail,
  Phone,
  Map,
  Calendar,
  FileText,
  Image,
  Video,
  Music,
  Search,
  Filter,
  Download,
  Upload,
  Share,
  Check,
  HandHelping,
  HeartHandshake,
  Church
} from 'lucide-angular';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

window.addEventListener('error', (e) => {
  console.error('[App] Uncaught error:', e.error ?? e.message, e.filename, e.lineno);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[App] Unhandled rejection:', e.reason);
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({ mode: 'ios' }),
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(
      LucideAngularModule.pick({
        Heart,
        Star,
        Home,
        User,
        Settings,
        Bell,
        Mail,
        Phone,
        Map,
        Calendar,
        FileText,
        Image,
        Video,
        Music,
        Search,
        Filter,
        Download,
        Upload,
        Share,
        Check,
        HandHelping,
        HeartHandshake,
        Church
      })
    ),
  ],
});
