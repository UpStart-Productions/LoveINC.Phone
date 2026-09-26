import {
  AfterViewInit,
  booleanAttribute,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  numberAttribute,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { GestureController } from '@ionic/angular/standalone';
import type { Gesture, GestureDetail } from '@ionic/angular/standalone';

/**
 * Swipe up on the host to dismiss. The host follows the finger, snaps closed on
 * release, and emits `swipeUpToClose` when the close gesture completes.
 */
@Directive({
  selector: '[appSwipeUpToClose]',
  standalone: true,
  exportAs: 'swipeUpToClose',
})
export class SwipeUpToCloseDirective implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ transform: booleanAttribute }) appSwipeUpToClose = true;
  @Input({ transform: numberAttribute }) snapDurationMs = 280;
  @Input({ transform: numberAttribute }) dragStartThresholdPx = 8;
  @Input({ transform: numberAttribute }) closeDistancePx = 48;
  @Input({ transform: numberAttribute }) closeVelocity = -0.35;
  @Input({ transform: numberAttribute }) closeProgressRatio = 0.22;
  @Input({ transform: numberAttribute }) opacityFadeRatio = 0.35;

  @Output() swipeUpToClose = new EventEmitter<void>();
  @Output() draggingChange = new EventEmitter<boolean>();
  @Output() snappingChange = new EventEmitter<boolean>();

  dragging = false;
  snapping = false;

  private gesture?: Gesture;
  private touchMove?: (event: TouchEvent) => void;
  private panelHeight = 0;
  private dragY = 0;
  private snapTimer?: ReturnType<typeof setTimeout>;
  private enterTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private el: ElementRef<HTMLElement>,
    private gestureCtrl: GestureController
  ) {}

  ngAfterViewInit() {
    const host = this.el.nativeElement;

    this.touchMove = (event: TouchEvent) => {
      if (this.dragging) {
        event.preventDefault();
      }
    };
    host.addEventListener('touchmove', this.touchMove, { passive: false });

    this.gesture = this.gestureCtrl.create(
      {
        el: host,
        gestureName: 'swipe-up-to-close',
        direction: 'y',
        threshold: 10,
        canStart: () => this.appSwipeUpToClose,
        onStart: () => this.onDragStart(),
        onMove: (detail) => this.onDragMove(detail),
        onEnd: (detail) => this.onDragEnd(detail),
      },
      true
    );
    this.gesture.enable(true);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['appSwipeUpToClose'] && !this.appSwipeUpToClose) {
      this.reset();
    }
  }

  ngOnDestroy() {
    const host = this.el.nativeElement;
    if (this.touchMove) {
      host.removeEventListener('touchmove', this.touchMove);
    }
    this.clearTimers();
    this.gesture?.destroy();
  }

  /** Clears inline drag styles and gesture state. */
  reset() {
    this.clearTimers();
    this.setDragging(false);
    this.setSnapping(false);
    this.dragY = 0;
    this.panelHeight = 0;
    this.clearInlineStyles();
  }

  /** Slide the host down into place (e.g. when a sheet opens). */
  playEnterAnimation(fromOffset = '-1rem', fromOpacity = 0.7) {
    const host = this.el.nativeElement;
    this.clearTimers();
    this.clearInlineStyles();

    host.style.transition = 'none';
    host.style.transform = `translateY(${fromOffset})`;
    host.style.opacity = String(fromOpacity);
    void host.offsetHeight;

    requestAnimationFrame(() => {
      host.style.transition = `transform ${this.snapDurationMs}ms ease, opacity ${this.snapDurationMs}ms ease`;
      host.style.transform = 'translateY(0)';
      host.style.opacity = '1';

      this.enterTimer = setTimeout(() => {
        this.enterTimer = undefined;
        this.clearInlineStyles();
      }, this.snapDurationMs);
    });
  }

  private onDragStart() {
    if (!this.appSwipeUpToClose) {
      return;
    }

    this.dragY = 0;
    this.panelHeight = this.el.nativeElement.offsetHeight;
  }

  private onDragMove(detail: GestureDetail) {
    if (!this.appSwipeUpToClose || !this.panelHeight) {
      return;
    }

    if (!this.dragging) {
      if (detail.deltaY >= 0 || Math.abs(detail.deltaY) < this.dragStartThresholdPx) {
        return;
      }

      this.setDragging(true);
    }

    this.dragY = Math.max(-this.panelHeight, Math.min(0, detail.deltaY));
    this.applyDragStyles();
  }

  private onDragEnd(detail: GestureDetail) {
    if (!this.dragging) {
      return;
    }

    const draggedFarEnough =
      this.dragY < -this.closeDistancePx ||
      detail.velocityY < this.closeVelocity ||
      Math.abs(this.dragY) > this.panelHeight * this.closeProgressRatio;

    if (draggedFarEnough) {
      this.finishDrag(-this.panelHeight, () => this.swipeUpToClose.emit());
      return;
    }

    this.finishDrag(0);
  }

  private finishDrag(targetY: number, onComplete?: () => void) {
    const host = this.el.nativeElement;

    this.setDragging(false);
    this.setSnapping(targetY < 0);
    this.dragY = targetY;

    host.style.transition = `transform ${this.snapDurationMs}ms ease, opacity ${this.snapDurationMs}ms ease`;
    host.style.transform = `translateY(${targetY}px)`;
    host.style.opacity = targetY === 0 ? '1' : '0';

    this.snapTimer = setTimeout(() => {
      this.snapTimer = undefined;
      this.setSnapping(false);
      this.clearInlineStyles();
      this.dragY = 0;
      onComplete?.();
    }, this.snapDurationMs);
  }

  private applyDragStyles() {
    const host = this.el.nativeElement;
    if (!this.panelHeight) {
      return;
    }

    const progress = Math.min(1, Math.abs(this.dragY) / this.panelHeight);
    host.style.transform = `translateY(${this.dragY}px)`;
    host.style.opacity = String(1 - progress * this.opacityFadeRatio);
  }

  private clearInlineStyles() {
    const host = this.el.nativeElement;
    host.style.transform = '';
    host.style.transition = '';
    host.style.opacity = '';
  }

  private setDragging(next: boolean) {
    if (this.dragging === next) {
      return;
    }

    this.dragging = next;
    this.draggingChange.emit(next);
  }

  private setSnapping(next: boolean) {
    if (this.snapping === next) {
      return;
    }

    this.snapping = next;
    this.snappingChange.emit(next);
  }

  private clearTimers() {
    if (this.snapTimer) {
      clearTimeout(this.snapTimer);
      this.snapTimer = undefined;
    }
    if (this.enterTimer) {
      clearTimeout(this.enterTimer);
      this.enterTimer = undefined;
    }
  }
}
