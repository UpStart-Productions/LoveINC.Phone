import { Component, OnInit, OnDestroy, ElementRef, Renderer2, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon, AlertController, ActionSheetController } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { QuillToolbarService, QuillToolbarState } from './quill-toolbar.service';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-journal-quill-floating-toolbar',
  templateUrl: './quill-floating-toolbar.component.html',
  styleUrls: ['./quill-floating-toolbar.component.scss'],
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon],
})
export class JournalQuillFloatingToolbarComponent implements OnInit, OnDestroy, AfterViewInit {
  toolbarState: QuillToolbarState = {
    isVisible: false,
    keyboardHeight: 0,
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isBulletList: false,
    isOrderedList: false,
    isHeader1: false,
    boldMode: false,
    italicMode: false,
    underlineMode: false,
    bulletMode: false,
    orderedMode: false,
    header1Mode: false,
  };

  private subscriptions: Subscription[] = [];
  private quillEditor: any = null;
  private lastSelectionIndex: number | null = null;
  private alertController = inject(AlertController);
  private actionSheetController = inject(ActionSheetController);

  constructor(
    private quillToolbarService: QuillToolbarService,
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.quillToolbarService.toolbarState.subscribe((state) => {
        this.toolbarState = state;
        this.updateToolbarPosition();
      })
    );
    this.subscriptions.push(
      this.quillToolbarService.activeQuillEditor.subscribe((editor) => {
        this.quillEditor = editor;
        if (editor) {
          this.setupEditorListeners(editor);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.forceRemoveToolbarGaps(), 100);
  }

  private forceRemoveToolbarGaps(): void {
    const container = this.elementRef.nativeElement.querySelector('.toolbar-container');
    const buttons = this.elementRef.nativeElement.querySelectorAll('ion-button');
    if (container) {
      this.renderer.setStyle(container, 'display', 'flex');
      this.renderer.setStyle(container, 'gap', '0');
    }
    buttons.forEach((button: Element) => {
      this.renderer.setStyle(button, 'margin', '0');
    });
  }

  private setupEditorListeners(editor: any): void {
    editor.on('selection-change', (range: any) => {
      if (range) {
        this.lastSelectionIndex = range.index;
        this.quillToolbarService.updateFormatState();
      }
    });
    editor.on('text-change', () => {
      this.quillToolbarService.updateFormatState();
    });
  }

  private updateToolbarPosition(): void {
    const toolbar = this.elementRef.nativeElement.querySelector('.quill-floating-toolbar');
    if (!toolbar) return;
    if (this.toolbarState.isVisible) {
      // Sit directly above the keyboard: offset from the bottom of the screen by keyboard height
      const kh = this.toolbarState.keyboardHeight > 0 ? this.toolbarState.keyboardHeight : 0;
      this.renderer.setStyle(toolbar, 'bottom', `${kh}px`);
    } else {
      this.renderer.setStyle(toolbar, 'bottom', '-76px');
    }
  }

  isFormatActive(format: string): boolean {
    switch (format) {
      case 'bold':
        return this.toolbarState.isBold || this.toolbarState.boldMode;
      case 'italic':
        return this.toolbarState.isItalic || this.toolbarState.italicMode;
      case 'underline':
        return this.toolbarState.isUnderline || this.toolbarState.underlineMode;
      case 'bullet':
        return this.toolbarState.isBulletList || this.toolbarState.bulletMode;
      case 'ordered':
        return this.toolbarState.isOrderedList || this.toolbarState.orderedMode;
      case 'header1':
        return this.toolbarState.isHeader1 || this.toolbarState.header1Mode;
      default:
        return false;
    }
  }

  onFormatClick(format: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!this.quillEditor) return;

    const selection = this.quillEditor.getSelection();
    if (selection && selection.length > 0) {
      const isActive = this.isFormatActive(format);
      this.quillToolbarService.executeFormat(format, !isActive);
    } else {
      this.quillToolbarService.toggleFormatMode(format);
    }
    setTimeout(() => {
      if (this.quillEditor && this.lastSelectionIndex !== null) {
        this.quillEditor.setSelection(this.lastSelectionIndex, 0);
      }
    }, 50);
  }

  async onPhotoClick(): Promise<void> {
    if (!this.quillEditor) return;
    try {
      const actionSheet = await this.actionSheetController.create({
        header: 'Add photo',
        buttons: [
          {
            text: 'Take Photo',
            icon: 'camera-outline',
            handler: () => {
              void this.capturePhoto(CameraSource.Camera);
            },
          },
          {
            text: 'Choose from Library',
            icon: 'images-outline',
            handler: () => {
              void this.capturePhoto(CameraSource.Photos);
            },
          },
          {
            text: 'Cancel',
            icon: 'close-outline',
            role: 'cancel',
          },
        ],
      });
      await actionSheet.present();
    } catch {
      // ignore
    }
  }

  private async capturePhoto(source: CameraSource): Promise<void> {
    if (!this.quillEditor) return;
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source,
      });
      if (photo.dataUrl && this.quillEditor) {
        const selection = this.quillEditor.getSelection();
        const index = selection ? selection.index : this.quillEditor.getLength();
        this.quillEditor.insertEmbed(index, 'image', photo.dataUrl);
        this.quillEditor.setSelection(index + 1, 0);
      }
    } catch (err) {
      const msg = String((err as Error)?.message ?? err);
      if (/cancel|dismiss|denied/i.test(msg)) {
        return;
      }
      const alert = await this.alertController.create({
        header: 'Photo',
        message: 'Could not add the photo. Check camera and photo library permissions in Settings.',
        buttons: ['OK'],
      });
      await alert.present();
    }
  }

  async onLinkClick(): Promise<void> {
    if (!this.quillEditor) return;
    const selection = this.quillEditor.getSelection();
    if (!selection || selection.length === 0) {
      const alert = await this.alertController.create({
        header: 'Select text',
        message: 'Select the text you want to turn into a link.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }
    const format = this.quillEditor.getFormat();
    const currentLink = (format as { link?: string }).link || '';
    const alert = await this.alertController.create({
      header: currentLink ? 'Edit link' : 'Insert link',
      inputs: [
        {
          name: 'url',
          type: 'url',
          placeholder: 'https://',
          value: currentLink,
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        ...(currentLink
          ? [
              {
                text: 'Remove',
                role: 'destructive' as const,
                handler: () => {
                  this.quillEditor.format('link', false);
                },
              },
            ]
          : []),
        {
          text: currentLink ? 'Update' : 'Insert',
          handler: (data: { url?: string }) => {
            if (data?.url?.trim()) {
              let url = data.url.trim();
              if (!/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
              }
              this.quillEditor.format('link', url);
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async onClearClick(): Promise<void> {
    if (!this.quillEditor) return;
    const alert = await this.alertController.create({
      header: 'Clear content',
      message: 'Clear all text in this entry?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Clear',
          role: 'destructive',
          handler: () => {
            this.quillEditor.setText('');
            this.quillToolbarService.resetFormatModes();
          },
        },
      ],
    });
    await alert.present();
  }

  async onCloseKeyboard(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await Keyboard.hide();
      } catch {
        // ignore
      }
    } else if (this.quillEditor) {
      this.quillEditor.blur();
    }
  }
}
