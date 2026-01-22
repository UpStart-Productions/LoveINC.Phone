import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DonateMoneyPage } from './donate-money.page';

describe('DonateMoneyPage', () => {
  let component: DonateMoneyPage;
  let fixture: ComponentFixture<DonateMoneyPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DonateMoneyPage],
    });
    fixture = TestBed.createComponent(DonateMoneyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
