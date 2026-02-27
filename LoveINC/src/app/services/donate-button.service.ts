import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DonateButtonService {
  shouldShowDonateButton(): boolean {
    return true;
  }
}
