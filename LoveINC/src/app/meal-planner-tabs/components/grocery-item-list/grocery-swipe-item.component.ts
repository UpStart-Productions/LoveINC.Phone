import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { GestureController, IonIcon } from '@ionic/angular/standalone';
import type { Gesture, GestureDetail } from '@ionic/angular/standalone';
import type { GroceryItem } from '@upstart-productions/meal-planner';

@Component({
  selector: 'app-grocery-swipe-item',
  templateUrl: './grocery-swipe-item.component.html',
  styleUrls: ['./grocery-swipe-item.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon],
})
export class GrocerySwipeItemComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) item!: GroceryItem;
  @Input() showBorder = true;

  @Output() delete = new EventEmitter<GroceryItem>();

  @ViewChild('wrap') wrapRef?: ElementRef<HTMLElement>;
  @ViewChild('surface') surfaceRef?: ElementRef<HTMLElement>;

  swipeX = 0;
  deleteIconScale = 0.38;
  surfaceAnimating = false;
  collapsing = false;
  checked = false;

  private gesture?: Gesture;
  private rowWidth = 0;
  private gestureStartX = 0;
  private thresholdHapticFired = false;
  private removing = false;
  private deleteEmitted = false;
  private swipeLocked = false;

  private readonly deleteProgressThreshold = 0.42;
  private readonly deleteVelocityThreshold = -0.55;

  constructor(
    private gestureCtrl: GestureController,
    private cdRef: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    const surface = this.surfaceRef?.nativeElement;
    if (!surface) {
      return;
    }

    this.measureRowWidth();

    this.gesture = this.gestureCtrl.create(
      {
        el: surface,
        gestureName: 'grocery-swipe-delete',
        direction: 'x',
        threshold: 0,
        canStart: (detail) => this.canStartSwipe(detail),
        onStart: () => this.onGestureStart(),
        onMove: (detail) => this.onGestureMove(detail),
        onEnd: (detail) => this.onGestureEnd(detail),
      },
      true
    );
    this.gesture.enable(true);
  }

  ngOnDestroy() {
    this.gesture?.destroy();
  }

  onCheckTap(event: Event) {
    event.stopPropagation();
    if (this.removing || this.checked) {
      return;
    }
    this.checked = true;
    this.cdRef.detectChanges();
    window.setTimeout(() => this.commitRemove(), 80);
  }

  private canStartSwipe(detail: GestureDetail): boolean {
    const target = detail.event?.target;
    if (!(target instanceof Element)) {
      return true;
    }
    return !target.closest('.grocery-swipe-item__check');
  }

  private onGestureStart() {
    if (this.removing) {
      return;
    }
    this.measureRowWidth();
    this.gestureStartX = this.swipeX;
    this.thresholdHapticFired = false;
    this.surfaceAnimating = false;
    this.swipeLocked = false;
  }

  private onGestureMove(detail: GestureDetail) {
    if (this.removing) {
      return;
    }

    if (!this.swipeLocked) {
      const absX = Math.abs(detail.deltaX);
      const absY = Math.abs(detail.deltaY);
      if (absY > absX && absY > 6) {
        return;
      }
      if (absX <= 8) {
        return;
      }
      this.swipeLocked = true;
    }

    const nextX = this.clamp(this.gestureStartX + detail.deltaX, -this.rowWidth, 0);
    this.swipeX = nextX;
    this.deleteIconScale = this.iconScaleForSwipe(Math.abs(nextX));

    const progress = this.deleteProgress(Math.abs(nextX));
    if (progress >= this.deleteProgressThreshold && !this.thresholdHapticFired) {
      this.thresholdHapticFired = true;
      void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
    } else if (progress < this.deleteProgressThreshold * 0.75) {
      this.thresholdHapticFired = false;
    }

    this.cdRef.detectChanges();
  }

  private onGestureEnd(detail: GestureDetail) {
    if (this.removing) {
      return;
    }

    if (!this.swipeLocked) {
      return;
    }

    const distance = Math.abs(this.swipeX);
    const progress = this.deleteProgress(distance);
    const shouldDelete =
      progress >= this.deleteProgressThreshold || detail.velocityX <= this.deleteVelocityThreshold;

    if (shouldDelete) {
      this.commitRemove();
      return;
    }

    this.surfaceAnimating = true;
    this.swipeX = 0;
    this.deleteIconScale = this.iconScaleForSwipe(0);
    this.cdRef.detectChanges();
    window.setTimeout(() => {
      this.surfaceAnimating = false;
      this.cdRef.detectChanges();
    }, 280);
  }

  private commitRemove() {
    if (this.removing) {
      return;
    }
    this.removing = true;
    this.gesture?.enable(false);

    void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => undefined);

    const wrap = this.wrapRef?.nativeElement;
    if (!wrap) {
      this.delete.emit(this.item);
      return;
    }

    const height = wrap.getBoundingClientRect().height;
    wrap.style.maxHeight = `${height}px`;

    this.surfaceAnimating = true;
    this.swipeX = -this.rowWidth;
    this.collapsing = true;
    this.cdRef.detectChanges();

    requestAnimationFrame(() => {
      wrap.style.maxHeight = '0px';
    });

    wrap.addEventListener(
      'transitionend',
      (event) => {
        if (event.propertyName === 'max-height') {
          this.emitDeleteOnce();
        }
      },
      { once: true }
    );

    window.setTimeout(() => this.emitDeleteOnce(), 420);
  }

  private emitDeleteOnce() {
    if (this.deleteEmitted) {
      return;
    }
    this.deleteEmitted = true;
    this.delete.emit(this.item);
  }

  private measureRowWidth() {
    const wrap = this.wrapRef?.nativeElement;
    this.rowWidth = wrap?.clientWidth ?? 0;
  }

  private deleteProgress(distance: number): number {
    if (this.rowWidth <= 0) {
      return 0;
    }
    return this.clamp(0, distance / (this.rowWidth * 0.72), 1);
  }

  private iconScaleForSwipe(distance: number): number {
    const progress = this.clamp(0, distance / 88, 1);
    return 0.38 + progress * 0.92;
  }

  private clamp(min: number, value: number, max: number): number {
    return Math.max(min, Math.min(value, max));
  }
}
