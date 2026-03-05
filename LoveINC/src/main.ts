import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { INTAKE_VALIDATE_PROVIDER } from '@upstart-productions/service-unlock';
import { PlatformApiService } from './app/services/platform/platform-api.service';
import { UserProfileService } from './app/services/user-profile.service';
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
    {
      provide: INTAKE_VALIDATE_PROVIDER,
      useFactory: (platformApi: PlatformApiService, userProfile: UserProfileService) => ({
        validate: async (phrase: string) => {
          const profile = userProfile.getProfile();
          if (!profile.email?.trim()) {
            return { success: false, message: 'Please add your email in Profile to complete intake validation.' };
          }
          try {
            const result = await platformApi.validateIntakePhrase({
              phrase,
              email: profile.email,
              firstName: profile.firstName,
              lastName: profile.lastName,
            });
            return { success: result.success };
          } catch (err) {
            return { success: false, message: (err as Error)?.message };
          }
        },
      }),
      deps: [PlatformApiService, UserProfileService],
    },
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
