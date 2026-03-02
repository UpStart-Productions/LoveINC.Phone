import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { ServiceUnlockService } from './services/service-unlock.service';
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
    IonBackButton,
    IonButton,
    IonIcon,
    IonSpinner,
  ],
})
export class ServiceUnlockScanPage implements OnInit {
  scanning = false;
  error: string | null = null;
  success = false;
  supported = false;

  constructor(
    private service: ServiceUnlockService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.service.ensureInitialized();
    if (this.service.isUnlocked) {
      this.success = true;
      return;
    }
    const { supported } = await BarcodeScanner.isSupported();
    this.supported = supported;
  }

  async startScan(): Promise<void> {
    this.error = null;
    this.scanning = true;

    try {
      if (!Capacitor.isNativePlatform()) {
        this.error = 'QR scanning is only available on iOS or Android.';
        this.scanning = false;
        return;
      }

      const { supported } = await BarcodeScanner.isSupported();
      if (!supported) {
        this.error = 'Barcode scanning is not supported on this device.';
        this.scanning = false;
        return;
      }

      const { camera } = await BarcodeScanner.checkPermissions();
      if (camera !== 'granted' && camera !== 'limited') {
        const status = await BarcodeScanner.requestPermissions();
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

      const barcode = barcodes[0];
      const decoded = barcode?.rawValue ?? barcode?.displayValue ?? '';

      if (!decoded.trim()) {
        this.error = 'No QR code detected. Please try again.';
        this.scanning = false;
        return;
      }

      const result = await this.service.unlockWithPhrase(decoded);
      if (result.success) {
        this.success = true;
      } else {
        this.error = result.message ?? 'Invalid QR code.';
      }
    } catch (e) {
      this.error = (e as Error)?.message ?? 'Scan failed. Please try again.';
    } finally {
      this.scanning = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/tabs/profile']);
  }
}
