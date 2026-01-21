import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransformationClassesPage } from './transformation-classes.page';

describe('TransformationClassesPage', () => {
  let component: TransformationClassesPage;
  let fixture: ComponentFixture<TransformationClassesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TransformationClassesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
