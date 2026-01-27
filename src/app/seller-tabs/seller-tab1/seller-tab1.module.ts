import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SellerTab1PageRoutingModule } from './seller-tab1-routing.module';

import { SellerTab1Page } from './seller-tab1.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SellerTab1PageRoutingModule
  ],
  declarations: [SellerTab1Page]
})
export class SellerTab1PageModule {}
