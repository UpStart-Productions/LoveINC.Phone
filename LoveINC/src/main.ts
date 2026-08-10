import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { provideQuillConfig } from 'ngx-quill/config';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { INTAKE_VALIDATE_PROVIDER } from '@upstart-productions/service-unlock';
import { JOURNAL_ENTRY_SHARE, type JournalEntryShareOptions } from '@upstart-productions/journal';
import {
  VERSE_OF_THE_DAY_CACHE,
  VERSE_OF_THE_DAY_YOUTUBE_EMBED_BASE_URL,
  VERSE_OF_THE_DAY_SHARE,
  VERSE_OF_THE_DAY_BACK_DEFAULT_HREF,
  APP_NAVIGATION_RETURN,
} from '@upstart-productions/verse-of-the-day';
import { JOURNAL_NAVIGATION_RETURN } from '@upstart-productions/journal';
import { VerseOfTheDayCacheService } from './app/services/verse-of-the-day-cache.service';
import { NavigationReturnService } from './app/services/navigation-return.service';
import { SharingService } from './app/services/sharing/sharing.service';
import { environment } from './environments/environment';
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
  Church,
  Minus,
  Quote
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
    provideQuillConfig({ theme: 'snow' }),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({ mode: 'ios', backButtonText: '' }),
    provideRouter(routes),
    provideHttpClient(),
    { provide: VERSE_OF_THE_DAY_CACHE, useClass: VerseOfTheDayCacheService },
    { provide: VERSE_OF_THE_DAY_YOUTUBE_EMBED_BASE_URL, useValue: environment.youtubeEmbedBaseUrl },
    {
      provide: VERSE_OF_THE_DAY_SHARE,
      useFactory: (sharingService: SharingService) => {
        return async (verse: import('@upstart-productions/verse-of-the-day').VerseOfTheDay) => {
          const v = verse;
          const htmlContent = `
      <h2>${v.reference}</h2>
      <p>${v.content}</p>
      ${v.verseUrl ? `<p><a href="${v.verseUrl}">Read on Bible Gateway</a></p>` : ''}
      ${v.commentaryUrl && v.commentaryTitle ? `<p><strong>Commentary:</strong> <a href="${v.commentaryUrl}">${v.commentaryTitle}</a>${v.commentaryAuthor || v.commentaryPublisher ? ` — ${[v.commentaryAuthor, v.commentaryPublisher].filter(Boolean).join(', ')}` : ''}</p>` : ''}
      ${v.sermonUrl && v.sermonTitle ? `<p><strong>Sermon:</strong> <a href="${v.sermonUrl}">${v.sermonTitle}</a>${v.sermonAuthor || v.sermonPublisher ? ` — ${[v.sermonAuthor, v.sermonPublisher].filter(Boolean).join(', ')}` : ''}</p>` : ''}
    `;
          await sharingService.shareContent({
            title: `Verse of the Day: ${v.reference}`,
            subject: `Verse of the Day: ${v.reference}`,
            htmlContent: htmlContent.trim(),
          });
        };
      },
      deps: [SharingService],
    },
    { provide: VERSE_OF_THE_DAY_BACK_DEFAULT_HREF, useValue: '/tabs/more' },
    { provide: APP_NAVIGATION_RETURN, useExisting: NavigationReturnService },
    { provide: JOURNAL_NAVIGATION_RETURN, useExisting: NavigationReturnService },
    {
      provide: JOURNAL_ENTRY_SHARE,
      useFactory: (sharing: SharingService) => {
        return (options: JournalEntryShareOptions) =>
          sharing.shareContent({
            title: options.title,
            subject: options.subject ?? options.title,
            htmlContent: options.htmlContent,
          });
      },
      deps: [SharingService],
    },
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
        Church,
        Minus,
        Quote
      })
    ),
  ],
});
