import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SellerTab4PageRoutingModule } from './seller-tab4-routing.module';

import { SellerTab4Page } from './seller-tab4.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SellerTab4PageRoutingModule
  ],
  declarations: [SellerTab4Page]
})
export class SellerTab4PageModule {}
