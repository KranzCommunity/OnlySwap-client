import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SimpleswapComponent } from './tradeframe/simpleswap/simpleswap.component';
import { SettingsComponent } from './tradeframe/settings/settings.component';
import { ClassictradeComponent } from './tradeframe/classictrade/classictrade.component';
import { PasswordComponent } from './tradeframe/password/password.component';

const routes: Routes = [
  {
    path: '',
    component: ClassictradeComponent
  },
  {
    path: 'simpleswap',
    component: SimpleswapComponent
  },
  {
    path: 'settings',
    component: SettingsComponent
  },
  {
    path: 'classictrade',
    component: ClassictradeComponent
  }
  // {
  //   path: 'password',
  //   component: PasswordComponent
  // }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
