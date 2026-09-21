import { Component, EventEmitter, Output, inject } from '@angular/core';
import { SHARE_APP_BLURB } from '../../shared/love-inc-contact.constants';
import { ShareAppService } from '../../services/share-app.service';
import { OrganizationContextService } from '../../services/organization-context.service';

@Component({
  selector: 'app-home-share-app-card',
  standalone: true,
  templateUrl: './home-share-app-card.component.html',
  styleUrl: './home-share-app-card.component.scss',
})
export class HomeShareAppCardComponent {
  private readonly shareAppService = inject(ShareAppService);
  private readonly organizationContext = inject(OrganizationContextService);

  @Output() dismiss = new EventEmitter<void>();

  readonly photoUrl = 'assets/photos/share-app-header.png';
  readonly blurb = SHARE_APP_BLURB;

  get title(): string {
    return `Share the ${this.organizationContext.publicName} App`;
  }

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
