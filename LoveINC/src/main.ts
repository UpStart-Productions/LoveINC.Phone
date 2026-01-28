import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
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
  Church
} from 'lucide-angular';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
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
        Church
      })
    ),
  ],
});
