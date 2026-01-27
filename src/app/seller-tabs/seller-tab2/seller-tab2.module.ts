import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SellerTab2PageRoutingModule } from './seller-tab2-routing.module';

import { SellerTab2Page } from './seller-tab2.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SellerTab2PageRoutingModule
  ],
  declarations: [SellerTab2Page]
})
export class SellerTab2PageModule {}
