import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SellerTab3PageRoutingModule } from './seller-tab3-routing.module';

import { SellerTab3Page } from './seller-tab3.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SellerTab3PageRoutingModule
  ],
  declarations: [SellerTab3Page]
})
export class SellerTab3PageModule {}
