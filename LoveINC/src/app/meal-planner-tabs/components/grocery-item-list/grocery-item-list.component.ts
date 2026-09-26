import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { GroceryItem } from '@upstart-productions/meal-planner';
import { GrocerySwipeItemComponent } from './grocery-swipe-item.component';

@Component({
  selector: 'app-grocery-item-list',
  templateUrl: './grocery-item-list.component.html',
  styleUrls: ['./grocery-item-list.component.scss'],
  standalone: true,
  imports: [CommonModule, GrocerySwipeItemComponent],
})
export class GroceryItemListComponent {
  @Input({ required: true }) items: GroceryItem[] = [];

  @Output() itemDelete = new EventEmitter<GroceryItem>();

  onItemDelete(item: GroceryItem) {
    this.itemDelete.emit(item);
  }
}
