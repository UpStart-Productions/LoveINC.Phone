import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
} from '@ionic/angular/standalone';
import type { GroceryItem } from '@upstart-productions/meal-planner';

@Component({
  selector: 'app-grocery-item-list',
  templateUrl: './grocery-item-list.component.html',
  styleUrls: ['./grocery-item-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonItemSliding,
    IonItem,
    IonLabel,
    IonItemOptions,
    IonItemOption,
    IonIcon,
  ],
})
export class GroceryItemListComponent {
  @Input({ required: true }) items: GroceryItem[] = [];
  @Input() flushTop = false;

  @Output() itemTap = new EventEmitter<GroceryItem>();
  @Output() itemDelete = new EventEmitter<GroceryItem>();

  readonly removingIds = new Set<number>();

  onItemTap(item: GroceryItem, sliding: IonItemSliding): void {
    void sliding.close();
    this.itemTap.emit(item);
  }

  async onDelete(item: GroceryItem, sliding: IonItemSliding): Promise<void> {
    await sliding.close();
    if (item.id) {
      this.removingIds.add(item.id);
    }
    window.setTimeout(() => {
      this.itemDelete.emit(item);
      if (item.id) {
        this.removingIds.delete(item.id);
      }
    }, 180);
  }
}
