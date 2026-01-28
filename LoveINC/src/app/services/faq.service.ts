import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FAQ {
  question: string;
  answer: string;
}

@Injectable({
  providedIn: 'root',
})
export class FaqService {
  private readonly faqsUrl = 'assets/data/faqs.json';

  constructor(private http: HttpClient) {}

  getFAQs(): Observable<FAQ[]> {
    return this.http.get<FAQ[]>(this.faqsUrl);
  }
}
