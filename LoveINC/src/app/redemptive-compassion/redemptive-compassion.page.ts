import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { IonButtons, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';

@Component({
  selector: 'app-redemptive-compassion',
  standalone: true,
  imports: [IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, AppBackButtonComponent],
  templateUrl: './redemptive-compassion.page.html',
  styleUrls: ['./redemptive-compassion.page.scss'],
})
export class RedemptiveCompassionPage implements OnDestroy {
  @ViewChild('content', { static: true }) private content!: IonContent;
  @ViewChild('journey', { static: true }) private journey!: ElementRef<HTMLElement>;
  private revealObserver?: IntersectionObserver;
  private resizeObserver?: ResizeObserver;
  private active = false;

  async ionViewDidEnter(): Promise<void> {
    this.active = true;
    const scroll = await this.content.getScrollElement();
    if (!this.active) return;
    this.disconnect();
    const sections = Array.from(this.journey.nativeElement.querySelectorAll<HTMLElement>('.principle'));
    // Replay on each visit, including when Ionic reuses this page from its navigation stack.
    scroll.scrollTop = 0;
    sections.forEach(section => section.classList.remove('waiting', 'arrive'));
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sections.forEach(section => section.classList.add('waiting'));
      this.revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.remove('waiting');
          entry.target.classList.add('arrive');
          this.revealObserver?.unobserve(entry.target);
        });
      }, { root: scroll, threshold: 0.22, rootMargin: '0px 0px -24px 0px' });
      sections.forEach(section => this.revealObserver!.observe(section));
    }
    this.resizeObserver = new ResizeObserver(() => this.drawRoad(sections));
    this.resizeObserver.observe(this.journey.nativeElement);
    this.drawRoad(sections);
  }

  ionViewWillLeave(): void {
    this.active = false;
    this.disconnect();
  }

  ngOnDestroy(): void {
    this.active = false;
    this.disconnect();
  }

  private disconnect(): void {
    this.revealObserver?.disconnect();
    this.resizeObserver?.disconnect();
  }

  private drawRoad(sections: HTMLElement[]): void {
    const journey = this.journey.nativeElement;
    const points = sections.map(section => {
      const number = section.querySelector<HTMLElement>('.number')!;
      return {
        x: section.offsetLeft + number.offsetLeft + number.offsetWidth / 2,
        y: section.offsetTop + number.offsetTop + number.offsetHeight / 2,
      };
    });
    if (!points.length) return;
    let path = `M ${points[0].x} -100`;
    let previousY = -100;
    points.forEach((point, index) => {
      const side = index % 2 === 0 ? 4 : point.x * 2 - 4;
      const distance = point.y - previousY;
      path += ` C ${side} ${previousY + distance * 0.35}, ${side} ${previousY + distance * 0.65}, ${point.x} ${point.y}`;
      previousY = point.y;
    });
    // Continue the curve behind both opaque panels; no endpoint or join sits on an edge.
    path += ` C 4 ${previousY + 40}, 4 ${journey.offsetHeight + 40}, ${points[0].x} ${journey.offsetHeight + 100}`;
    journey.querySelectorAll('.road path').forEach(element => element.setAttribute('d', path));
  }
}
