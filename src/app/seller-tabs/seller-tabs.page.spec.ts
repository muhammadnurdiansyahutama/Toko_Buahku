import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SellerTabsPage } from './seller-tabs.page';

describe('SellerTabsPage', () => {
  let component: SellerTabsPage;
  let fixture: ComponentFixture<SellerTabsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SellerTabsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
