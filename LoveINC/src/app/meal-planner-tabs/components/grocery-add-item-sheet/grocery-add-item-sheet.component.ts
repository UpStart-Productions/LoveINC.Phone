import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { PluginListenerHandle } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-grocery-add-item-sheet',
  templateUrl: './grocery-add-item-sheet.component.html',
  styleUrls: ['./grocery-add-item-sheet.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonItem,
    IonInput,
  ],
})
export class GroceryAddItemSheetComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('nameInput') nameInput?: IonInput;

  itemName = '';

  private keyboardShowListener?: PluginListenerHandle;
  private keyboardHideListener?: PluginListenerHandle;

  constructor(
    private modalCtrl: ModalController,
    private host: ElementRef<HTMLElement>
  ) {}

  ngOnInit() {
    void this.attachKeyboardListeners();
  }

  ngAfterViewInit() {
    window.setTimeout(() => {
      void this.nameInput?.setFocus();
    }, 280);
  }

  ngOnDestroy() {
    void this.detachKeyboardListeners();
    this.applyModalKeyboardOffset(0);
  }

  submit() {
    const name = this.itemName.trim();
    if (!name) {
      return;
    }
    void this.modalCtrl.dismiss({ name }, 'save');
  }

  close() {
    void this.modalCtrl.dismiss(null, 'cancel');
  }

  private async attachKeyboardListeners() {
    try {
      this.keyboardShowListener = await Keyboard.addListener('keyboardWillShow', (event) => {
        this.applyModalKeyboardOffset(event.keyboardHeight);
      });
      this.keyboardHideListener = await Keyboard.addListener('keyboardWillHide', () => {
        this.applyModalKeyboardOffset(0);
      });
    } catch {
      // Keyboard plugin may not be available (e.g. web).
    }
  }

  private async detachKeyboardListeners() {
    await this.keyboardShowListener?.remove();
    await this.keyboardHideListener?.remove();
    this.keyboardShowListener = undefined;
    this.keyboardHideListener = undefined;
  }

  private applyModalKeyboardOffset(height: number) {
    const modal = this.host.nativeElement.closest('ion-modal');
    if (!modal) {
      return;
    }
    (modal as HTMLElement).style.setProperty('--keyboard-offset', `${height}px`);
  }
}
