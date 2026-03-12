import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonButton,
} from '@ionic/angular/standalone';
import { ServiceUnlockService } from '../services/service-unlock.service';

@Component({
  selector: 'app-service-access-section',
  templateUrl: './service-access-section.component.html',
  styleUrls: ['./service-access-section.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonButton,
  ],
})
export class ServiceAccessSectionComponent implements OnInit, OnDestroy {
  isUnlocked = false;

  private subs: Subscription[] = [];

  /** If provided, called when Scan QR Code is clicked instead of navigating. Use to show profile form first. */
  @Input() scanClickHandler?: () => void | Promise<void>;

  /** When true, treat intake as completed (from API). Combined with local unlock for display. */
  @Input() apiIntakeCompleted?: boolean;

  /** When false, org does not require intake—user has full access without scanning. */
  @Input() intakeRequired = true;

  /** Customer/organization name for intake-completed message (e.g. "Love INC"). */
  @Input() customerName = 'Love INC';

  constructor(
    private service: ServiceUnlockService,
    private router: Router
  ) {}

  /** User has completed intake (scanned QR). */
  get intakeCompleted(): boolean {
    return this.isUnlocked || !!this.apiIntakeCompleted;
  }

  /** Display state: 'full_access' | 'required' | 'completed' */
  get accessStatus(): 'full_access' | 'required' | 'completed' {
    if (!this.intakeRequired) return 'full_access';
    return this.intakeCompleted ? 'completed' : 'required';
  }

  async ngOnInit(): Promise<void> {
    await this.service.ensureInitialized();
    this.subs.push(this.service.isUnlocked$.subscribe((u) => (this.isUnlocked = u)));
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.subs = [];
  }

  async goToScan(): Promise<void> {
    if (this.scanClickHandler) {
      await this.scanClickHandler();
    } else {
      this.router.navigate(['/tabs/service-unlock/scan']);
    }
  }

}
