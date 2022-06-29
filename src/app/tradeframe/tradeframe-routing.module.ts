import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SimpleswapComponent } from './simpleswap/simpleswap.component';
import { SettingsComponent } from './settings/settings.component';
import { TradeframeComponent } from './tradeframe.component';

const routes: Routes = [
    {
        path: 'trade',
        component: TradeframeComponent,
        children: [
            {
                path: 'simple',
                component: SimpleswapComponent
            },
            {
                path: 'settings',
                component: SettingsComponent
            }
        ]
    }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TradeframeRoutingModule { }