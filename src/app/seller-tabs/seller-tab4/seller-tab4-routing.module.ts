import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SellerTab4Page } from './seller-tab4.page';

const routes: Routes = [
  {
    path: '',
    component: SellerTab4Page
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SellerTab4PageRoutingModule {}
