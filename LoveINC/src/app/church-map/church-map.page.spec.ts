import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChurchMapPage } from './church-map.page';

describe('ChurchMapPage', () => {
  let component: ChurchMapPage;
  let fixture: ComponentFixture<ChurchMapPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ChurchMapPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
