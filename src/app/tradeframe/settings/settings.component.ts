import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Web3Service } from 'src/app/services/web3.service';
import { ApiService } from 'src/app/services/api.service';
import { Router } from '@angular/router';
import {Location} from '@angular/common';
@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  estimateData: any = [
    {
      "acceptance": 1,
      "gasPrice": 0,
      "estimatedFee": 0
    },
    {
      "acceptance": 1,
      "gasPrice": 0,
      "estimatedFee": 0
    },
    {
      "acceptance": 1,
      "gasPrice": 0,
      "estimatedFee": 0
    }
  ];

  gasMethodNames = ['Low', 'Average', 'Fast'];

  slippage: any;

  network: any;
  
  selectedMethod = 1;
  selectedSlippage: any;
  customSlippage: any;

  constructor(private _location: Location, private router:Router,private http: HttpClient, private web3: Web3Service, private apiService: ApiService) { 
    let isToken = this.apiService.componentTokenCheck();
    // console.log("settings isToken ",isToken)
    if(!isToken) {
      this.router.navigateByUrl('/password');
    }
  }

  ngOnInit(): void {
    if(localStorage.getItem('slippage') != null) {
      this.slippage = (localStorage.getItem('slippage'));
      if(this.slippage != '0.005' && this.slippage != '0.01' && this.slippage != '0.05') {
        this.selectedSlippage = '0';
        this.customSlippage = parseFloat(this.slippage) * 100;
      }
      else {
        this.selectedSlippage = this.slippage;
      }
    }
    else {
      this.selectedSlippage = '0.01';
      this.slippage = 0.01;
    }

    this.web3.getNetwork().subscribe((network) => {
      this.network = network;
      if(network.chainId == 1) {
        this.web3.getEthGasEstimate()
        .subscribe((response: any) => {
          // console.log(response);
          this.estimateData = response.speeds; 
          var currentGasMethod = localStorage.getItem('gasMethodType');
          if(currentGasMethod != null) {
            this.selectedMethod = parseInt(currentGasMethod);
          }
          else {
            this.selectedMethod = 1;
          }
        })
      } else if(network.chainId == 56) {
        this.web3.getBSCGasEstimate()
        .subscribe((response: any) => {
          // console.log(response);
          this.estimateData = response.speeds;
          // console.log(this.estimateData[1]);
          var currentGasMethod = localStorage.getItem('gasMethodType');
          if(currentGasMethod != null) {
            this.selectedMethod = parseInt(currentGasMethod);
          }
          else {
            this.selectedMethod = 1;
          }
        })
      }
      setInterval(() => {
        if(network.chainId == 1) {
          this.web3.getEthGasEstimate()
          .subscribe((response: any) => {
            // console.log(response);
            this.estimateData = response.speeds; 
            var currentGasMethod = localStorage.getItem('gasMethodType');
            if(currentGasMethod != null) {
              this.selectedMethod = parseInt(currentGasMethod);
            }
            else {
              this.selectedMethod = 1;
            }
          })
        } else if(network.chainId == 56) {
          this.web3.getBSCGasEstimate()
          .subscribe((response: any) => {
            // console.log(response);
            this.estimateData = response.speeds;
            // console.log(this.estimateData[1]);
            var currentGasMethod = localStorage.getItem('gasMethodType');
            if(currentGasMethod != null) {
              this.selectedMethod = parseInt(currentGasMethod);
            }
            else {
              this.selectedMethod = 1;
            }
          })
        }
      }, 25000);
    })
  }

  back() {
    this._location.back();
  }

  changeMethod(newMethod: any) {
    if(this.network.chainId == 1) {
      localStorage.setItem('gasMethodETH', this.estimateData[newMethod].gasPrice);
    }
    else if(this.network.chainId == 56) {
      localStorage.setItem('gasMethodBSC', this.estimateData[newMethod].gasPrice);
    }
    else {

    }
    localStorage.setItem('gasMethodType', newMethod);
  }

  validateSlippage() {
    // console.log('validating slippage: ' + this.customSlippage);
    if(this.customSlippage > 90) {
      this.customSlippage = 90;
    }
    if(this.customSlippage <= 0 || this.customSlippage == null || isNaN(this.customSlippage)) {
      this.customSlippage = 0.1;
    }
    localStorage.setItem('slippage', (this.customSlippage / 100).toString());
    this.slippage = this.customSlippage / 100;
  }

  changeSlippage(slippage: any) {
    if(slippage == '0') {
      this.selectedSlippage = '0';

      if(this.customSlippage > 90) {
        this.customSlippage = 90;
      }
      if(this.customSlippage <= 0 || this.customSlippage == null || isNaN(this.customSlippage)) {
        this.customSlippage = 0.1;
      }
      localStorage.setItem('slippage', (this.customSlippage / 100).toString());
      this.slippage = this.customSlippage / 100;
    }
    else {
      localStorage.setItem('slippage', slippage);
      this.slippage = slippage;
    }
  }

  reset() {
    this.selectedMethod = 1;
    this.selectedSlippage = '0.01';
    this.changeMethod(1);
    this.changeSlippage('0.01');
  }
}
