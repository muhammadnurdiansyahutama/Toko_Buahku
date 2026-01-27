import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SellerTab3Page } from './seller-tab3.page';

const routes: Routes = [
  {
    path: '',
    component: SellerTab3Page
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SellerTab3PageRoutingModule {}
