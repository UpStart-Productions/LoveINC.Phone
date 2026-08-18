import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonSpinner,
  NavController,
} from '@ionic/angular/standalone';
import { ServiceUnlockService } from './services/service-unlock.service';
import { navigateAppBack } from '@app/shared/utils/navigation-back.util';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-service-unlock-scan',
  templateUrl: './service-unlock-scan.page.html',
  styleUrls: ['./service-unlock-scan.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonSpinner,
  ],
})
export class ServiceUnlockScanPage implements OnInit, OnDestroy {
  scanning = false;
  error: string | null = null;
  success = false;
  supported = false;

  private destroyed = false;

  constructor(
    private service: ServiceUnlockService,
    private route: ActivatedRoute,
    private navController: NavController
  ) {}

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  async ngOnInit(): Promise<void> {
    await this.service.ensureInitialized();
    if (this.destroyed) return;
    if (this.service.isUnlocked) {
      this.success = true;
      return;
    }
    const { supported } = await BarcodeScanner.isSupported();
    if (this.destroyed) return;
    this.supported = supported;
  }

  async startScan(): Promise<void> {
    this.error = null;
    this.scanning = true;

    try {
      if (!Capacitor.isNativePlatform()) {
        if (!this.destroyed) {
          this.error = 'QR scanning is only available on iOS or Android.';
        }
        this.scanning = false;
        return;
      }

      const { supported } = await BarcodeScanner.isSupported();
      if (this.destroyed) return;
      if (!supported) {
        this.error = 'Barcode scanning is not supported on this device.';
        this.scanning = false;
        return;
      }

      const { camera } = await BarcodeScanner.checkPermissions();
      if (this.destroyed) return;
      if (camera !== 'granted' && camera !== 'limited') {
        const status = await BarcodeScanner.requestPermissions();
        if (this.destroyed) return;
        if (status.camera !== 'granted' && status.camera !== 'limited') {
          this.error = 'Camera permission is required to scan the QR code.';
          this.scanning = false;
          return;
        }
      }

      const { barcodes } = await BarcodeScanner.scan({
        formats: [BarcodeFormat.QrCode],
        autoZoom: true,
      });

      if (this.destroyed) return;

      const barcode = barcodes[0];
      const decoded = barcode?.rawValue ?? barcode?.displayValue ?? '';

      if (!decoded.trim()) {
        this.error = 'No QR code detected. Please try again.';
        this.scanning = false;
        return;
      }

      const result = await this.service.unlockWithPhrase(decoded);
      if (this.destroyed) return;
      if (result.success) {
        this.success = true;
      } else {
        this.error = result.message ?? 'Invalid QR code.';
      }
    } catch (e) {
      if (!this.destroyed) {
        this.error = (e as Error)?.message ?? 'Scan failed. Please try again.';
      }
    } finally {
      if (!this.destroyed) {
        this.scanning = false;
      }
    }
  }

  goBack(): void {
    void navigateAppBack(this.navController, this.route.snapshot, '/tabs/more');
  }
}
