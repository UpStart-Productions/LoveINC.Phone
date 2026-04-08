import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonSpinner,
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { ClassRegistrationFormComponent } from '../components/class-registration-form/class-registration-form.component';
import { PlatformApiService } from '../services/platform/platform-api.service';
import { CardFormattingService } from '../services/card-formatting.service';

@Component({
  selector: 'app-class-registration',
  templateUrl: './class-registration.page.html',
  styleUrls: ['./class-registration.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonSpinner,
    ClassRegistrationFormComponent,
  ],
})
export class ClassRegistrationPage implements OnInit {
  classId = '';
  classTitle = '';
  /** Same pattern as class details: session line above title (may include newlines). */
  classScheduleLabel = '';
  classPhotoUrl = '';
  backHref = '/tabs/transformation-classes';
  loadingClass = true;
  classNotFound = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastController: ToastController,
    private platformApi: PlatformApiService,
    private cardFormatting: CardFormattingService,
  ) {
    const nav = this.router.getCurrentNavigation();
    const st = nav?.extras?.state as {
      classTitle?: string;
      classPhotoUrl?: string;
      classScheduleLabel?: string;
    } | undefined;
    if (st?.classTitle) this.classTitle = st.classTitle;
    if (st?.classPhotoUrl) this.classPhotoUrl = st.classPhotoUrl;
    if (st?.classScheduleLabel) this.classScheduleLabel = st.classScheduleLabel;
  }

  ngOnInit(): void {
    this.classId = this.route.snapshot.paramMap.get('classId') ?? '';
    this.mergeHistoryState();
    if (this.classId) {
      this.backHref = `/tabs/content-detail/class/${this.classId}`;
    }
    if (!this.classId) {
      void this.router.navigate(['/tabs/transformation-classes']);
      return;
    }

    this.loadingClass = true;
    this.classNotFound = false;
    this.platformApi.getClasses().subscribe({
      next: (classes) => {
        const c = classes?.find((cls) => cls.id === this.classId);
        if (c) {
          const card = this.cardFormatting.formatForCard(c, 'class');
          this.classTitle = card.title;
          this.classScheduleLabel = card.subtitle?.trim() ?? '';
          this.classPhotoUrl = card.photoUrl?.trim() ?? '';
        } else if (!this.classTitle) {
          this.classNotFound = true;
        }
        this.loadingClass = false;
      },
      error: () => {
        this.loadingClass = false;
        if (!this.classTitle) {
          this.classNotFound = true;
        }
      },
    });
  }

  private mergeHistoryState(): void {
    const hist = history.state as {
      classTitle?: string;
      classPhotoUrl?: string;
      classScheduleLabel?: string;
    } | undefined;
    if (typeof hist?.classTitle === 'string' && hist.classTitle.trim() && !this.classTitle) {
      this.classTitle = hist.classTitle;
    }
    if (typeof hist?.classPhotoUrl === 'string' && hist.classPhotoUrl.trim() && !this.classPhotoUrl) {
      this.classPhotoUrl = hist.classPhotoUrl;
    }
    if (
      typeof hist?.classScheduleLabel === 'string' &&
      hist.classScheduleLabel.trim() &&
      !this.classScheduleLabel
    ) {
      this.classScheduleLabel = hist.classScheduleLabel;
    }
  }

  async onFormSubmitted(): Promise<void> {
    const toast = await this.toastController.create({
      message: 'Registration submitted. Thank you!',
      duration: 3500,
      position: 'bottom',
      color: 'success',
      icon: 'checkmark-circle',
    });
    await toast.present();
    void this.router.navigateByUrl(this.backHref);
  }
}
