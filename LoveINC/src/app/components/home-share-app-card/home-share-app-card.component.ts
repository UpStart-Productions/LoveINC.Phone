import { Component, EventEmitter, Output, inject } from '@angular/core';
import { LOVE_INC_PUBLIC_NAME, SHARE_APP_BLURB } from '../../shared/love-inc-contact.constants';
import { ShareAppService } from '../../services/share-app.service';

@Component({
  selector: 'app-home-share-app-card',
  standalone: true,
  templateUrl: './home-share-app-card.component.html',
  styleUrl: './home-share-app-card.component.scss',
})
export class HomeShareAppCardComponent {
  private readonly shareAppService = inject(ShareAppService);

  @Output() dismiss = new EventEmitter<void>();

  readonly photoUrl = 'assets/photos/share-app-header.png';
  readonly title = `Share the ${LOVE_INC_PUBLIC_NAME} App`;
  readonly blurb = SHARE_APP_BLURB;

  async onShareNow(): Promise<void> {
    try {
      await this.shareAppService.shareApp();
    } catch (e) {
      console.error('Home share app card: share failed', e);
    }
  }

  onDismiss(): void {
    this.dismiss.emit();
  }
}
