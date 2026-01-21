import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GapMinistriesPage } from './gap-ministries.page';

describe('GapMinistriesPage', () => {
  let component: GapMinistriesPage;
  let fixture: ComponentFixture<GapMinistriesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GapMinistriesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
