import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PdfService } from '../../../services/pdf.service';

@Component({
  selector: 'app-pdf-preview-modal',
  templateUrl: './pdf-preview-modal.component.html',
  styleUrls: ['./pdf-preview-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
  ],
})
export class PdfPreviewModalComponent {
  @Input() pdfDataUrl = '';
  @Input() filename = '';
  @Input() weekLabel = '';
  @Input() shareFilename = '';

  safeUrl: SafeResourceUrl | null = null;
  sharing = false;

  constructor(
    private modalCtrl: ModalController,
    private pdfService: PdfService,
    private sanitizer: DomSanitizer
  ) {}

  ionViewWillEnter() {
    if (this.pdfDataUrl) {
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfDataUrl);
    }
  }

  close() {
    this.modalCtrl.dismiss();
  }

  async share() {
    if (!this.pdfDataUrl || !this.shareFilename) return;
    this.sharing = true;
    try {
      const base64 = this.pdfDataUrl.split(',')[1];
      if (!base64) return;
      const savedPath = await this.pdfService.savePdfFromBase64(base64, this.shareFilename);
      this.pdfService.setShareMetadata(this.weekLabel, this.weekLabel);
      await this.pdfService.sharePdf(savedPath, `${this.shareFilename}.pdf`);
      this.modalCtrl.dismiss();
    } catch (err) {
      console.warn('PDF share error:', err);
    } finally {
      this.sharing = false;
    }
  }
}
