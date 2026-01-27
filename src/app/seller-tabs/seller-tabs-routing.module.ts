import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SellerTabsPage } from './seller-tabs.page';

const routes: Routes = [
  {
    path: '',
    component: SellerTabsPage,
    children: [
      {
        path: 'seller-tab1',
        loadChildren: () => import('./seller-tab1/seller-tab1.module').then(m => m.SellerTab1PageModule)
      },
      {
        path: 'seller-tab2',
        loadChildren: () => import('./seller-tab2/seller-tab2.module').then(m => m.SellerTab2PageModule)
      },
      {
        path: 'seller-tab3',
        loadChildren: () => import('./seller-tab3/seller-tab3.module').then(m => m.SellerTab3PageModule)
      },
      {
        path: 'seller-tab4',
        loadChildren: () => import('./seller-tab4/seller-tab4.module').then(m => m.SellerTab4PageModule)
      },
      {
        path: '',
        redirectTo: 'seller-tab1',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SellerTabsPageRoutingModule { }
