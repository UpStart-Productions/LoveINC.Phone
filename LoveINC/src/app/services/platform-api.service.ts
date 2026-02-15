import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

/** Class shape returned by GET /public/{customerSlug}/{tenantSlug}/classes */
export interface PlatformClass {
  id: string;
  title: string;
  shortDescription?: string;
  longDescription?: string;
  instructor?: string;
  address?: { locationName: string; address: string; city: string; state: string; zip: string };
  capacity?: number;
  durationMinutes?: number;
  cost?: string;
  photoUrl?: string;
}

export interface ClassesResponse {
  classes: PlatformClass[];
}

@Injectable({ providedIn: 'root' })
export class PlatformApiService {
  private readonly basePath: string;
  private readonly headers: HttpHeaders;

  constructor(private readonly http: HttpClient) {
    const { apiBaseUrl, apiKey, customerSlug, tenantSlug } = environment;
    this.basePath = `${apiBaseUrl.replace(/\/$/, '')}/public/${customerSlug}/${tenantSlug}`;
    this.headers = new HttpHeaders({
      'x-api-key': apiKey || '',
      'Content-Type': 'application/json',
    });
  }

  /** Resolve upload path (e.g. /api/uploads/...) to full URL for images */
  resolveUploadUrl(path: string | undefined): string {
    if (!path?.trim()) return '';
    if (path.startsWith('http')) return path;
    const base = environment.apiBaseUrl.replace(/\/api\/?$/, '');
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  /** GET /public/{customerSlug}/{tenantSlug}/classes */
  getClasses(): Observable<PlatformClass[]> {
    if (!environment.apiKey) {
      console.warn('PlatformApiService: apiKey not configured. Set it in environment.ts');
      return of([]);
    }
    return this.http
      .get<ClassesResponse>(`${this.basePath}/classes`, { headers: this.headers })
      .pipe(
        map((res) => res.classes ?? []),
        catchError((err) => {
          console.error('PlatformApiService: failed to load classes', err);
          return of([]);
        })
      );
  }
}
