import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {PrivacyComponent} from './privacy/privacy.component';
import {GovernanceComponent} from './governance/governance.component';
import {TermsComponent} from './terms/terms.component';
import { MainComponent } from './main/main.component';
import { HomeComponent } from './home.component';

const routes: Routes = [
    {
        path: '',
        component: MainComponent
    },
    {
        path: 'home',
        component: HomeComponent,
        children: [
            {
                path: '',
                component: MainComponent
            },
            {
                path: 'main',
                component: MainComponent
            },
            {
                path: 'privacy',
                component: PrivacyComponent
            },
            {
                path: 'terms',
                component: TermsComponent
            },
            {
                path: 'governance',
                component: GovernanceComponent
            }
        ]
    }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }