import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SellerTab2Page } from './seller-tab2.page';

const routes: Routes = [
  {
    path: '',
    component: SellerTab2Page
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SellerTab2PageRoutingModule {}
