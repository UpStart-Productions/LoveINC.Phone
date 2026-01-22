import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DonateGoodsPage } from './donate-goods.page';

describe('DonateGoodsPage', () => {
  let component: DonateGoodsPage;
  let fixture: ComponentFixture<DonateGoodsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DonateGoodsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});