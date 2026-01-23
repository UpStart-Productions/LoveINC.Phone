import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeveloperOptionsPage } from './developer-options.page';

describe('DeveloperOptionsPage', () => {
  let component: DeveloperOptionsPage;
  let fixture: ComponentFixture<DeveloperOptionsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeveloperOptionsPage]
    }).compileComponents();

    fixture = TestBed.createComponent(DeveloperOptionsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
