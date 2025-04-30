import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseCsvUploadComponent } from './purchase-csv-upload.component';

describe('PurchaseCsvUploadComponent', () => {
  let component: PurchaseCsvUploadComponent;
  let fixture: ComponentFixture<PurchaseCsvUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseCsvUploadComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PurchaseCsvUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
