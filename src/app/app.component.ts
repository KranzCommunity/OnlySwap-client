import { Component, OnChanges, OnInit, Inject, SimpleChanges, TemplateRef, ViewChild, Renderer2, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Web3Service } from '../app/services/web3.service';
import { UniswapServiceService } from '../app/services/uniswap/uniswap-service.service';
import { ApiService } from '../app/services/api.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  

  isCollapsed = true;
  title = 'Kranz-web-angular';
  chainId: any;
  networkId: any;
  tokenAddress = '0x2f5cae07b3edcaa752b5396c40ce2092f4144976';
  userAcc: any;
  userAccDisplay: any;
  accountBalance: any;

  modalRef: any;
  @ViewChild("walletConnect") private walletConnectModal!: TemplateRef<any>;
  @ViewChild("tosPopup") private tosPopup!: TemplateRef<any>;
  modalHeader = '';
  modalBody = '';
  isToken: any;
  connectWalletCalled: boolean= false;
  constructor(private apiService:ApiService, @Inject(DOCUMENT) private document: Document, private renderer: Renderer2, public web3Service: Web3Service, public uniSwapService: UniswapServiceService, private modalService: BsModalService, private router: Router, private cdr:ChangeDetectorRef) {
    //this.isToken = this.apiService.componentTokenCheck();
    
    this.renderer.removeClass(this.document.body, 'dark-theme');
    this.renderer.removeClass(this.document.body, 'fun-theme');
    this.renderer.addClass(this.document.body, 'light-theme');

    web3Service.getAccount().subscribe(async userAcc => {
      this.userAcc = userAcc;
      this.userAccDisplay = userAcc.substring(0, 5) + '...' + userAcc.substring(userAcc.length-5, userAcc.length-1);
    })
    this.web3Service.getNetwork().subscribe((network) => {
      this.networkId = network.chainId;
    })

    // this.apiService.getPasswordChecked.subscribe((isChecked) => {
    //   // console.log("getpasswordChecked ",isChecked)
    //   this.isToken = isChecked;
    //   if(isChecked) {
    //     this.connectWalletPre();
    //   }
    // })
  }

  async ngOnInit(): Promise<void> {

    if(localStorage.getItem('theme') == 'light') {
      this.renderer.removeClass(this.document.body, 'dark-theme');
      this.renderer.removeClass(this.document.body, 'fun-theme');
      this.renderer.addClass(this.document.body, 'light-theme');
    }
    else if(localStorage.getItem('theme') == 'dark') {
      this.renderer.removeClass(this.document.body, 'light-theme');
      this.renderer.removeClass(this.document.body, 'fun-theme');
      this.renderer.addClass(this.document.body, 'dark-theme');
    }
    else if(localStorage.getItem('theme') == 'fun') {
      this.renderer.removeClass(this.document.body, 'light-theme');
      this.renderer.removeClass(this.document.body, 'dark-theme');
      this.renderer.addClass(this.document.body, 'fun-theme');
    }
    else {
      this.renderer.removeClass(this.document.body, 'dark-theme');
      this.renderer.removeClass(this.document.body, 'fun-theme');
      this.renderer.addClass(this.document.body, 'light-theme');
    }

    var networkStatus = 0;
    if(localStorage.getItem('changedByUser') == 'true') {
      networkStatus = await this.web3Service.connectAccount();
      localStorage.setItem('changedByUser', 'false');
    }
    if(networkStatus == -1) {
      this.openModal('Could not find a supported blockchain provider!', 'Please install Metamask and reload the app.');
      return;
    }
    this.accountBalance = this.web3Service.userBalance;
    this.web3Service.getNetwork().subscribe((network) => {
      if(network == "")
        return;
      this.networkId = network.chainId; 
    })
    this.web3Service.userAccountBalance.subscribe((balance) => {
      // // console.log(`The chainId of MAINNET is ` + network);
      this.accountBalance = balance;
      this.cdr.detectChanges();
    })
    // this.connectWallet();
  }
  ngAfterViewInit() {
    // let isToken = this.apiService.componentTokenCheck();
    // if(!isToken) {
    //   this.router.navigateByUrl("/password")
    // } else {
    //   this.connectWallet();
    // }
    this.connectWallet();
  }

  connectWalletPre() {
    if(!this.connectWalletCalled) {
      this.connectWallet();
    }
  }

  openModal(header: any, body: any) {
    this.modalHeader = header;
    this.modalBody = body;
    this.modalRef = this.modalService.show(this.walletConnectModal, {
      class: 'modal-dialog-centered accept-popup' 
    });
  }

  async connectWallet() {
    this.connectWalletCalled = true;
    if(localStorage.getItem('tos') == null) {
      this.modalRef = this.modalService.show(this.tosPopup, {
        class: 'modal-dialog-centered accept-popup' 
      });
    }
    else {
      var networkStatus = await this.web3Service.connectAccount();
      if(networkStatus == -1) {
        this.openModal('Could not find a supported blockchain provider!', 'Please install Metamask and reload the app.');
        return;
      }
      this.accountBalance = this.web3Service.userBalance;
      this.web3Service.getNetwork().subscribe((network) => {
        // // console.log(`The chainId of MAINNET is ` + network);
        this.chainId = network.chainId;
        if(network.chainId != 1 && network.chainId != 56) {
          this.openModal('This network is not supported!', 'Please change the network to Ethereum Mainnet or Binance Smart Chain.');
        return;
        }
        if(network.chainId == 1) {
          if(localStorage.getItem('gasMethodETH') == null) {
            this.web3Service.getEthGasEstimate()
            .subscribe((response: any) => {
              // console.log(response);
              let currentGasMethodIndex = localStorage.getItem('gasMethodType');
              if(currentGasMethodIndex == null)
                currentGasMethodIndex = '1';
              let gasPrice = response.speeds[parseInt(currentGasMethodIndex)].gasPrice;
              localStorage.setItem('gasMethodETH', gasPrice);
            })
          }
        } else {
          if(localStorage.getItem('gasMethodBSC') == null) {
            this.web3Service.getBSCGasEstimate()
            .subscribe((response: any) => {
              // console.log(response);
              let currentGasMethodIndex = localStorage.getItem('gasMethodType');
              if(currentGasMethodIndex == null)
                currentGasMethodIndex = '1';
              let gasPrice = response.speeds[parseInt(currentGasMethodIndex)].gasPrice;
              localStorage.setItem('gasMethodBSC', gasPrice);
            })
          }
        }
      })
    }
    
  }

  async changeNetwork(chainId: any) {
    const networkChanged = await this.web3Service.changeNetwork(chainId);
    if(networkChanged) {
      this.chainId = chainId;
      this.web3Service.connectAccount();
    }
    if(!networkChanged)
      this.openModal('Could not change the network.', 'Please try again!');
  }

  async acceptToc() {
    localStorage.setItem('tos', 'accepted');
    this.modalRef.hide();
    var networkStatus = await this.web3Service.connectAccount();
    if(networkStatus == -1) {
      this.openModal('Could not find a supported blockchain provider!', 'Please install Metamask and reload the app.');
      return;
    }
    this.accountBalance = this.web3Service.userBalance;
    this.web3Service.getNetwork().subscribe((network) => {
      // // console.log(`The chainId of MAINNET is ` + network);
      this.chainId = network.chainId;
    })
  }

  theme(type: any) {
    if(type=="light-theme") {
      this.renderer.removeClass(this.document.body, 'dark-theme');
      this.renderer.removeClass(this.document.body, 'fun-theme');
      this.renderer.addClass(this.document.body, 'light-theme');
      localStorage.setItem('theme', 'light');
    }
    else if(type=="dark-theme") {
      this.renderer.removeClass(this.document.body, 'light-theme');
      this.renderer.removeClass(this.document.body, 'fun-theme');
      this.renderer.addClass(this.document.body, 'dark-theme');
      localStorage.setItem('theme', 'dark');
    }
    else if(type=="fun-theme") {
      this.renderer.removeClass(this.document.body, 'light-theme');
      this.renderer.removeClass(this.document.body, 'dark-theme');
      this.renderer.addClass(this.document.body, 'fun-theme');
      localStorage.setItem('theme', 'fun');
    }
  }

  navto(dest: any) {
    this.router.navigate(['home/' + dest]);
  }

}