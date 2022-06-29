import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BsDropdownModule, BsDropdownConfig } from 'ngx-bootstrap/dropdown';
import { AppRoutingModule } from './app-routing.module';
import { HomeModule } from './tradeframe/home/home.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { NgxSpinnerModule } from "ngx-spinner";
import { TradeframeComponent } from './tradeframe/tradeframe.component';
import { SimpleswapComponent } from './tradeframe/simpleswap/simpleswap.component';
import { ClassictradeComponent } from './tradeframe/classictrade/classictrade.component';
import { PasswordComponent } from './tradeframe/password/password.component';
import { SelectDropDownModule } from 'ngx-select-dropdown'
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { SearchInLoopPipe } from './pipes/search-in-loop.pipe';
import { ModalModule } from 'ngx-bootstrap/modal';
import { SettingsComponent } from './tradeframe/settings/settings.component';
import { HomeComponent } from './tradeframe/home/home.component';
import { MainComponent } from './tradeframe/home/main/main.component';
import { PrivacyComponent } from './tradeframe/home/privacy/privacy.component';
import { TermsComponent } from './tradeframe/home/terms/terms.component';
import { GovernanceComponent } from './tradeframe/home/governance/governance.component';
import { TradeframeModule } from './tradeframe/tradeframe.module';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { RouterModule } from '@angular/router';
import { LimitOrderProtocolFacade } from 'limit-order-protocol';

@NgModule({
  declarations: [
    AppComponent,
    TradeframeComponent,
    SimpleswapComponent,
    ClassictradeComponent,
    PasswordComponent,
    SearchInLoopPipe,
    SettingsComponent,
    HomeComponent,
    MainComponent,
    PrivacyComponent,
    TermsComponent,
    GovernanceComponent
  ],
  imports: [
    RouterModule,
    HttpClientModule,
    BrowserAnimationsModule,
    BrowserModule,
    AppRoutingModule,
    HomeModule,
    TradeframeModule,
    FormsModule,
    BsDropdownModule,
    SelectDropDownModule,
    CollapseModule.forRoot(),
    ModalModule.forRoot(),
    NgxSpinnerModule,
    TooltipModule.forRoot(),
    TabsModule.forRoot(),
  ],
  providers: [BsDropdownConfig],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
