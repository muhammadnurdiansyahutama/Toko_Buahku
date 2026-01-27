import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SellerTab2Page } from './seller-tab2.page';

describe('SellerTab2Page', () => {
  let component: SellerTab2Page;
  let fixture: ComponentFixture<SellerTab2Page>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SellerTab2Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
