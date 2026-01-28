import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Alert {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: string;
}

@Injectable({
  providedIn: 'root',
})
export class AlertsService {
  private readonly alertsUrl = 'assets/data/alerts.json';

  constructor(private http: HttpClient) {}

  getAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(this.alertsUrl);
  }
}
