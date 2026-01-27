import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SellerTab1Page } from './seller-tab1.page';

const routes: Routes = [
  {
    path: '',
    component: SellerTab1Page
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SellerTab1PageRoutingModule {}
