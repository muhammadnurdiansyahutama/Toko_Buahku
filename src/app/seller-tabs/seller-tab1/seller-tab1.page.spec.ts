import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SellerTab1Page } from './seller-tab1.page';

describe('SellerTab1Page', () => {
  let component: SellerTab1Page;
  let fixture: ComponentFixture<SellerTab1Page>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SellerTab1Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
