import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaleEditComponent } from './sale-edit.component';

describe('SaleEditComponent', () => {
  let component: SaleEditComponent;
  let fixture: ComponentFixture<SaleEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaleEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SaleEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
