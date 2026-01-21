import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransformationClassDetailPage } from './transformation-class-detail.page';

describe('TransformationClassDetailPage', () => {
  let component: TransformationClassDetailPage;
  let fixture: ComponentFixture<TransformationClassDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TransformationClassDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
