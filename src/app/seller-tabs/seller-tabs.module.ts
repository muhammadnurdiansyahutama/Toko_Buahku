import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SellerTabsPageRoutingModule } from './seller-tabs-routing.module';

import { SellerTabsPage } from './seller-tabs.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SellerTabsPageRoutingModule
  ],
  declarations: [SellerTabsPage]
})
export class SellerTabsPageModule {}
