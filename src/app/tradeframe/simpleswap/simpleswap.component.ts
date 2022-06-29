import { Component, OnChanges, OnInit, Inject, SimpleChanges, TemplateRef, ViewChild, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NgxSpinnerService } from "ngx-spinner";
import { BsModalService } from 'ngx-bootstrap/modal';
import { SushiswapServiceService } from '../../services/sushiswap/sushiswap-service.service'
import { UniswapServiceService } from  '../../services/uniswap/uniswap-service.service'
import { pancakeswapService } from '../../services/pancakeswap/pancakeswap-service.service'
import { BakeryswapServiceService } from '../../services/bakeryswap/bakeryswap-service.service'
import { Web3Service } from '../../services/web3.service'
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-simpleswap',
  templateUrl: './simpleswap.component.html',
  styleUrls: ['./simpleswap.component.scss']
})
export class SimpleswapComponent implements OnInit {

  modalRef: any;
  @ViewChild("walletConnect") private walletConnectModal!: TemplateRef<any>;
  @ViewChild("txSubmitted") private txSubmittedModal!: TemplateRef<any>;
  @ViewChild("static2Modal") private static2Modal!: TemplateRef<any>;
  @ViewChild("staticRModal") private staticRModal!: TemplateRef<any>;
  static2ModalRef: any;
  staticRModalRef: any;
  modalHeader = '';
  modalBody = '';
  isCollapsed = true;
  downarrow = true;
  network: any;

  tradeDetails: any;
  uniswapTradeDetails: any;
  sushiswapTradeDetails: any;
  pancakeswapTradeDetails: any;
  bakeryswapTradeDetails: any;
  uniswapObservable: any;
  sushiswapObservable: any;
  pancakeswapObservable: any;
  bakeryswapObservable: any;
  accountBalance: any;
  toTokenBalance: any;
  fromTokenBalance: any;
  swapDisabled = false;

  search = {
    to: '',
    from: ''
  }

  swapform = {
    fromamount: '',
    toamount: '',
    fromtoken: 'ETH',
    totoken: 'KRZ',
    fromtokenname: 'Ethereum',
    totokenname: 'Kranz Token',
    toTokenAddress: '0xf54b304e2e4b28c7e46619d1a340f9b2b72383d7',
    fromTokenAddress: '"NO_CONTRACT_ADDRESS"',
    fromTokenLogo: '../../../assets/images/icons/ethereum.png',
    toTokenLogo: 'https://etherscan.io/token/images/kranztoken_32.png'
  }

  tokensListConfig = {
    displayFn: (item: any) => {
      return item.name;
    },
    displayKey: "name",
    search: true,
    searchOnKey: "name",
    searchPlaceholder: "Search with token symbol here",
    clearOnSelection: false,
    noResultsFound: "No tokens found!"
  }

  getSwapQuoteLoop: any;
  tradeQuote: any;
  bestQuote: any;
  approvalPending: boolean = false;
  searchText = '';
  tokensList: any;

  newToken: any= {
    "isNewToken":true,
    "address":"",
    "asset":"",
    "decimals":0,
    "logoURI":"",
    "name":"",
    "pairs":[],
    "symbol":"",
    "type":""
  }

  tokenType: any;
  newTokenAbi: any;
  storageName: any;

  constructor(private router:Router, @Inject(DOCUMENT) private document: Document, private renderer: Renderer2, private http: HttpClient, private uniswapService: UniswapServiceService, private sushiswapService: SushiswapServiceService, private bakerySwapService: BakeryswapServiceService, private pancakeSwapService: pancakeswapService, private web3Service: Web3Service, private spinner: NgxSpinnerService, private modalService: BsModalService, private apiService: ApiService) {
    
   }

  ngOnInit(): void {

    try {

      this.web3Service.getNetwork().subscribe(network => {
        this.network = network;
        if(network.chainId == 56) {
          let simpleS = this.apiService.simpleSwapFormData;
          if(simpleS) {
            this.swapform = simpleS;
            this.callGetSwapQuoteWithDelay();
            setTimeout(() => {
              this.apiService.simpleSwapFormData = undefined;
            });
          } else {
            this.swapform.fromtoken = 'BNB';
            this.swapform.fromtokenname = 'Binance coin';
            this.swapform.fromTokenLogo = '../../../assets/images/icons/bnb.png';
            this.swapform.totokenname = 'Kranz Token';
            this.swapform.toTokenAddress = '0xf54b304e2e4b28c7e46619d1a340f9b2b72383d7';
            this.swapform.totoken =  'KRZ';
            this.swapform.toTokenLogo = 'https://etherscan.io/token/images/kranztoken_32.png';
          }
          this.fetchBscTokens().subscribe(response => {
            this.tokensList = response;
            this.addCustomToken();
          })
          this.web3Service.getAccount().subscribe(async (userAcc) => {
            if(userAcc) {
              this.accountBalance = await this.web3Service.getEthBalance();
              if(this.accountBalance == '0')
                this.openModal('Could not fetch user balance!', 'Please reload the page.');
            }
          })

          this.storageName = "BEP_TOKEN";
        }
        else {

          let simpleS = this.apiService.simpleSwapFormData;
          if(simpleS) {
            this.swapform = simpleS;
            this.callGetSwapQuoteWithDelay();
            setTimeout(() => {
              this.apiService.simpleSwapFormData = undefined;
            });
          } else {
            this.swapform.fromtoken = 'ETH';
            this.swapform.fromtokenname = 'Ethereum';
            this.swapform.fromTokenLogo = '../../../assets/images/icons/ethereum.png';
            this.swapform.totokenname = 'Kranz Token';
            this.swapform.toTokenAddress = '0xf54b304e2e4b28c7e46619d1a340f9b2b72383d7';
            this.swapform.totoken =  'KRZ';
            this.swapform.toTokenLogo = 'https://etherscan.io/token/images/kranztoken_32.png';
            this.swapform.fromTokenAddress = 'NO_CONTRACT_ADDRESS'; 
          }
          this.fetchEthTokens().subscribe(response => {
            this.tokensList = response;
            this.addCustomToken();
          })
          this.web3Service.getAccount().subscribe(async (userAcc) => {
            if(userAcc) {
              this.accountBalance = await this.web3Service.getEthBalance();
              if(this.accountBalance == '0')
                this.openModal('Could not fetch user balance!', 'Please reload the page.');
            }
          })
          this.storageName = "ERC_TOKEN";
        }
      })

    } catch(exc) {
      this.openModal('Could not find a supported blockchain provider!', 'Please install Metamask and reload the app.');
    }
  }

  openModal(header: any, body: any) {
    this.modalHeader = header;
    this.modalBody = body;
    this.modalRef = this.modalService.show(this.walletConnectModal, {
      class: 'modal-dialog-centered' 
    });
  }

  openModalTx(header: any, body: any) {
    this.modalHeader = header;
    this.modalBody = body;
    this.modalRef = this.modalService.show(this.txSubmittedModal, {
      class: 'modal-dialog-centered' 
    });
  }

  fetchEthTokens(): Observable<any> {
    return this.http.get('https://assets.onlyswap.com/assets/ethereum-assets');
  }

  fetchBscTokens(): Observable<any> {
    return this.http.get('https://assets.onlyswap.com/assets/bsc-assets');
  }

  async changeToToken(token: any) {
    if(token.symbol == this.swapform.fromtoken) {
      // // console.log("same to as from")
      this.swapform.fromtoken = this.swapform.totoken;
      this.swapform.fromTokenAddress = this.swapform.toTokenAddress;
      this.swapform.fromtokenname = this.swapform.totokenname;
      this.swapform.fromTokenLogo = this.swapform.toTokenLogo;

      this.swapform.totoken = token.symbol;
      this.swapform.toTokenAddress = token.address;
      this.swapform.totokenname = token.name;
      this.swapform.toTokenLogo = token.logoURI;
    } else {
      this.swapform.totoken = token.symbol;
      this.swapform.toTokenAddress = token.address;
      this.swapform.totokenname = token.name;
      this.swapform.toTokenLogo = token.logoURI;
      if(token.symbol == 'ETH' || token.symbol == 'BNB') {
        // this.fromTokenBalance = await this.web3Service.getEthBalance();
      }
      else {
        this.fromTokenBalance = await this.web3Service.getERC20Balance(token.address);
      }
    }
    
    this.callGetSwapQuoteWithDelay();
  }

  async changeFromToken(token: any) {
    if(token.symbol == this.swapform.totoken) {
      this.swapform.totoken = this.swapform.fromtoken;
      this.swapform.toTokenAddress = this.swapform.fromTokenAddress;
      this.swapform.totokenname = this.swapform.fromtokenname;
      this.swapform.toTokenLogo = this.swapform.fromTokenLogo;

      this.swapform.fromtoken = token.symbol;
      this.swapform.fromTokenAddress = token.address;
      this.swapform.fromtokenname = token.name;
      this.swapform.fromTokenLogo = token.logoURI;
      
    } else {
      this.swapform.fromtoken = token.symbol;
      this.swapform.fromTokenAddress = token.address;
      this.swapform.fromtokenname = token.name;
      this.swapform.fromTokenLogo = token.logoURI;
    }

    if(token.symbol == 'ETH' || token.symbol == 'BNB') {
      this.fromTokenBalance = await this.web3Service.getEthBalance();
    }
    else {
      this.fromTokenBalance = await this.web3Service.getERC20Balance(token.address);
    }
    
    this.callGetSwapQuoteWithDelay();
  }

  async swapFromToTokens() {
    var buffToken = {
      totoken: this.swapform.totoken,
      toTokenAddress: this.swapform.toTokenAddress,
      totokenname: this.swapform.totokenname,
      toTokenLogo: this.swapform.toTokenLogo 
    }
    this.swapform.totoken = this.swapform.fromtoken;
    this.swapform.toTokenAddress = this.swapform.fromTokenAddress;
    this.swapform.totokenname = this.swapform.fromtokenname;
    this.swapform.toTokenLogo = this.swapform.fromTokenLogo;
    
    this.swapform.fromtoken = buffToken.totoken;
    this.swapform.fromTokenAddress = buffToken.toTokenAddress;
    this.swapform.fromtokenname = buffToken.totokenname;
    this.swapform.fromTokenLogo = buffToken.toTokenLogo;

    this.downarrow = !this.downarrow;

    if(this.swapform.fromtoken == 'ETH' || this.swapform.fromtoken == 'BNB') {
      // this.fromTokenBalance = await this.web3Service.getEthBalance();
    }
    else {
      this.fromTokenBalance = await this.web3Service.getERC20Balance(this.swapform.fromTokenAddress);
    }
    this.callGetSwapQuoteWithDelay();
  }

  async setFromAmountToMax() {
    if(this.swapform.fromtoken == 'ETH' || this.swapform.fromtoken == 'BNB') {
      let maxBal: any = await this.web3Service.getMaxOfBalance();
      // this.swapform.fromamount = this.accountBalance;
      this.swapform.fromamount = maxBal.toString();
    } else {
      this.swapform.fromamount = this.fromTokenBalance;
    }
    this.callGetSwapQuoteWithDelay();
  }

  callGetSwapQuoteWithDelay()  {
    this.reloadBalance();
    delete this.tradeQuote;
    delete this.bestQuote;
    this.swapform.toamount = '';

    this.swapDisabled = false;
    
    if(this.swapform.fromtoken == 'ETH' || this.swapform.fromtoken == 'BNB') {
      if(this.swapform.fromamount > this.accountBalance) {
        this.swapDisabled = true;
      }
    }
    else {
      if(this.swapform.fromamount > this.fromTokenBalance) {
        this.swapDisabled = true;
      }
    }

    if(this.swapform.fromamount != '' && this.swapform.fromamount != null && !isNaN(parseFloat(this.swapform.fromamount)) && parseFloat(this.swapform.fromamount) >= 0.0001) {
      window.clearTimeout(this.getSwapQuoteLoop);
      this.getSwapQuoteLoop = window.setTimeout(() => {
        this.getSwapQuote();
      }, 900);
    }

  }

  async getSwapQuote() {

    this.swapDisabled = false;
    this.approvalPending = false;
    
    if(this.swapform.fromtoken == 'ETH' || this.swapform.fromtoken == 'BNB') {
      if(this.swapform.fromamount > this.accountBalance) {
        this.swapDisabled = true;
      }
    }
    else {
      if(this.swapform.fromamount > this.fromTokenBalance) {
        this.swapDisabled = true;
      }
    }

    try {

      delete this.tradeQuote;
      delete this.bestQuote;
      this.swapform.toamount = '';
      if(this.web3Service.getAccountAddress() == null || this.web3Service.getAccountAddress() == "" || this.web3Service.getAccountAddress() == undefined) {
        this.openModal('','Connect the wallet first!');
        // alert('Connect the wallet first!');
        return;
      }

      this.spinner.show();
      if(this.network.chainId == 56) {
        this.pancakeswapTradeDetails = await this.pancakeSwapService.getTradeDetails(this.swapform);
        this.bakeryswapTradeDetails = await this.bakerySwapService.getTradeDetails(this.swapform);

        // console.log("this.pancakeswapTradeDetails :: ", this.pancakeswapTradeDetails);
        // console.log("this.bakeryswapTradeDetails :: ", this.bakeryswapTradeDetails);

        if(this.pancakeswapTradeDetails.error == 'noliquidity' && this.bakeryswapTradeDetails.error == 'noliquidity') {
          this.openModal('No liquidity found for this pair!','Please try another pair.');
          return;
        }

        if(!this.pancakeswapTradeDetails.viableQuotes) {
          this.pancakeswapTradeDetails = {
            viableQuotes: []
          }
        }
        if(!this.bakeryswapTradeDetails.viableQuotes) {
          this.bakeryswapTradeDetails = {
            viableQuotes: []
          }
        }

        if(this.pancakeswapTradeDetails.viableQuotes.length > 0) {
          this.pancakeswapTradeDetails.viableQuotes.forEach((quote: any, index: any) => {
            this.pancakeswapTradeDetails.viableQuotes[index].transaction = this.pancakeswapTradeDetails.trade.transaction;
          });
        }

        if(this.bakeryswapTradeDetails.viableQuotes.length > 0) {
          this.bakeryswapTradeDetails.viableQuotes.forEach((quote: any, index: any) => {
            this.bakeryswapTradeDetails.viableQuotes[index].transaction = this.bakeryswapTradeDetails.trade.transaction;
          });
        }

        if(this.pancakeswapTradeDetails.viableQuotes.length < 1 && this.pancakeswapTradeDetails.trade) {
          this.pancakeswapTradeDetails.trade.exchangeName = "Pancakeswap";
          this.pancakeswapTradeDetails.trade.routePathArrayTokenMap = this.pancakeswapTradeDetails.trade.routePathTokenMap;
          this.pancakeswapTradeDetails.viableQuotes.push(this.pancakeswapTradeDetails.trade);
        }

        if(this.bakeryswapTradeDetails.viableQuotes.length < 1 && this.bakeryswapTradeDetails.trade) {
          this.bakeryswapTradeDetails.trade.exchangeName = "Bakeryswap";
          this.bakeryswapTradeDetails.trade.routePathArrayTokenMap = this.bakeryswapTradeDetails.trade.routePathTokenMap;
          this.bakeryswapTradeDetails.viableQuotes.push(this.bakeryswapTradeDetails.trade);
        }

        this.tradeDetails = {
          viableQuotes: this.pancakeswapTradeDetails.viableQuotes.concat(this.bakeryswapTradeDetails.viableQuotes),
          pancakeSwapFee: this.pancakeswapTradeDetails.trade ? this.pancakeswapTradeDetails.trade.liquidityProviderFee : 0,
          bakerySwapFee: this.bakeryswapTradeDetails.trade ? this.bakeryswapTradeDetails.trade.liquidityProviderFee : 0
        }

        if(this.pancakeswapTradeDetails.trade) {

          if(this.pancakeswapObservable) {
            this.pancakeswapObservable.unsubscribe();
          }         

          this.pancakeswapObservable = this.pancakeswapTradeDetails.trade.quoteChanged$.subscribe(async (newTrade: any) => {
            // console.log(newTrade);
            this.tradeDetails = newTrade;
            this.tradeQuote = await this.pancakeSwapService.getViableQuotes(newTrade.allTriedRoutesQuotes);
            if(this.tradeQuote.length > 0) {
              this.tradeQuote.forEach((quote: any, index: any) => {
                this.tradeQuote[index].transaction = newTrade.transaction;
              });
              this.tradeQuote = this.tradeQuote.concat(this.bakeryswapTradeDetails.viableQuotes);
            }
            else {
              if(newTrade.transaction) {
                newTrade.exchangeName = "Pancakeswap";
                newTrade.routePathArrayTokenMap = newTrade.routePathTokenMap;
                this.tradeQuote = this.bakeryswapTradeDetails.viableQuotes.slice();
                this.tradeQuote.push(newTrade);
              }
            }
            // console.log('pancakswap new quote');
    
            // console.log(this.tradeQuote);
            await this.tradeQuote.forEach((quote: any, index: number) => {
              quote.expectedConvertQuote = this.decideDecimalsByAmount(quote.expectedConvertQuote);
              quote.liquidityProviderFee = this.decideDecimalsByAmount(newTrade.liquidityProviderFee);
        
              if(this.tradeQuote.length == 1) {
                this.bestQuote = quote;
                this.swapform.toamount = this.toPlainString(this.bestQuote.expectedConvertQuote);
this.bestQuote.expectedConvertQuoteInString = this.toPlainString(this.bestQuote.expectedConvertQuote);
              }
              else if(index < (this.tradeQuote.length-1)) {
                if((parseFloat(quote.expectedConvertQuote) >= parseFloat(this.tradeQuote[index+1].expectedConvertQuote)) && (parseFloat(quote.expectedConvertQuote) > parseFloat(this.bestQuote.expectedConvertQuote))) {
                  this.bestQuote = quote;
                  this.swapform.toamount = this.toPlainString(this.bestQuote.expectedConvertQuote);
this.bestQuote.expectedConvertQuoteInString = this.toPlainString(this.bestQuote.expectedConvertQuote);
                }
                else if((parseFloat(quote.expectedConvertQuote) < parseFloat(this.tradeQuote[index+1].expectedConvertQuote)) && (parseFloat(this.tradeQuote[index+1].expectedConvertQuote) > parseFloat(this.bestQuote.expectedConvertQuote))) {
                  this.bestQuote = this.tradeQuote[index+1];
                  this.swapform.toamount = this.toPlainString(this.bestQuote.expectedConvertQuote);
this.bestQuote.expectedConvertQuoteInString = this.toPlainString(this.bestQuote.expectedConvertQuote);
                }
              }
              this.tradeQuote[index].expectedConvertQuoteInString = quote.expectedConvertQuote.toString();
            });
          })
        }

        if(this.bakeryswapTradeDetails.trade) {
          if(this.bakeryswapObservable) {
            this.bakeryswapObservable.unsubscribe();
          }

          this.bakeryswapObservable = this.bakeryswapTradeDetails.trade.quoteChanged$.subscribe(async (newTrade: any) => {
            // console.log(newTrade);
            this.tradeDetails = newTrade;
            this.tradeQuote = await this.bakerySwapService.getViableQuotes(newTrade.allTriedRoutesQuotes);
            if(this.tradeQuote.length > 0) {
              this.tradeQuote.forEach((quote: any, index: any) => {
                this.tradeQuote[index].transaction = newTrade.transaction;
              });
              this.tradeQuote = this.tradeQuote.concat(this.pancakeswapTradeDetails.viableQuotes);
            }
            else {
              if(newTrade.transaction) {
                newTrade.exchangeName = "Bakeryswap";
                newTrade.routePathArrayTokenMap = newTrade.routePathTokenMap;
                this.tradeQuote = this.pancakeswapTradeDetails.viableQuotes.slice();
                this.tradeQuote.push(newTrade);
              }
            }
            // console.log('bakeryswap new quote');
            // console.log(this.tradeQuote);
            await this.tradeQuote.forEach((quote: any, index: number) => {
              quote.expectedConvertQuote = this.decideDecimalsByAmount(quote.expectedConvertQuote);
              quote.liquidityProviderFee = this.decideDecimalsByAmount(newTrade.liquidityProviderFee);
        
              if(this.tradeQuote.length == 1) {
                this.bestQuote = quote;
                this.swapform.toamount = this.toPlainString(this.bestQuote.expectedConvertQuote);
this.bestQuote.expectedConvertQuoteInString = this.toPlainString(this.bestQuote.expectedConvertQuote);
              }
              else if(index < (this.tradeQuote.length-1)) {
                if((parseFloat(quote.expectedConvertQuote) >= parseFloat(this.tradeQuote[index+1].expectedConvertQuote)) && (parseFloat(quote.expectedConvertQuote) > parseFloat(this.bestQuote.expectedConvertQuote))) {
                  this.bestQuote = quote;
                  this.swapform.toamount = this.toPlainString(this.bestQuote.expectedConvertQuote);
this.bestQuote.expectedConvertQuoteInString = this.toPlainString(this.bestQuote.expectedConvertQuote);
                }
                else if((parseFloat(quote.expectedConvertQuote) < parseFloat(this.tradeQuote[index+1].expectedConvertQuote)) && (parseFloat(this.tradeQuote[index+1].expectedConvertQuote) > parseFloat(this.bestQuote.expectedConvertQuote))) {
                  this.bestQuote = this.tradeQuote[index+1];
                  this.swapform.toamount = this.toPlainString(this.bestQuote.expectedConvertQuote);
this.bestQuote.expectedConvertQuoteInString = this.toPlainString(this.bestQuote.expectedConvertQuote);
                }
              }
              this.tradeQuote[index].expectedConvertQuoteInString = quote.expectedConvertQuote.toString();
            });
          })
        }

      }
      else {
        this.uniswapTradeDetails = await this.uniswapService.getTradeDetails(this.swapform);
        this.sushiswapTradeDetails = await this.sushiswapService.getTradeDetails(this.swapform);

        if(this.uniswapTradeDetails.error == 'noliquidity' && this.sushiswapTradeDetails.error == 'noliquidity') {
          this.openModal('No liquidity found for this pair!','Please try another pair.');
          return;
        }

        if(!this.sushiswapTradeDetails.viableQuotes) {
          this.sushiswapTradeDetails = {
            viableQuotes: []
          }
        }
        if(!this.uniswapTradeDetails.viableQuotes) {
          this.uniswapTradeDetails = {
            viableQuotes: []
          }
        }

        if(this.uniswapTradeDetails.viableQuotes.length < 1 && this.uniswapTradeDetails.trade) {
          this.uniswapTradeDetails.trade.exchangeName = "Uniswap";
          this.uniswapTradeDetails.trade.routePathArrayTokenMap = this.uniswapTradeDetails.trade.routePathTokenMap;
          this.uniswapTradeDetails.viableQuotes.push(this.uniswapTradeDetails.trade);
        }

        if(this.sushiswapTradeDetails.viableQuotes.length < 1 && this.sushiswapTradeDetails.trade) {
          this.sushiswapTradeDetails.trade.exchangeName = "Sushiswap";
          this.sushiswapTradeDetails.trade.routePathArrayTokenMap = this.sushiswapTradeDetails.trade.routePathTokenMap;
          this.sushiswapTradeDetails.viableQuotes.push(this.sushiswapTradeDetails.trade);
        }

        this.tradeDetails = {
          viableQuotes: this.uniswapTradeDetails.viableQuotes.concat(this.sushiswapTradeDetails.viableQuotes),
          uniswapFee: this.uniswapTradeDetails.trade ? this.uniswapTradeDetails.trade.liquidityProviderFee : 0,
          sushiSwapFee: this.sushiswapTradeDetails.trade ? this.sushiswapTradeDetails.trade.liquidityProviderFee : 0
        }

        if(this.uniswapTradeDetails.trade) {

          if(this.uniswapObservable) {
            this.uniswapObservable.unsubscribe();
          }
          this.uniswapObservable = this.uniswapTradeDetails.trade.quoteChanged$.subscribe(async (newTrade: any) => {
            // console.log(newTrade);
            this.tradeQuote = await this.uniswapService.getViableQuotes(newTrade.allTriedRoutesQuotes);
            if(this.tradeQuote.length > 0) {
              this.tradeQuote.forEach((quote: any, index: any) => {
                this.tradeQuote[index].transaction = newTrade.transaction;
              });
              this.tradeQuote = this.tradeQuote.concat(this.sushiswapTradeDetails.viableQuotes);
            }
            else {
              if(newTrade.transaction) {
                newTrade.exchangeName = "Pancakeswap";
                newTrade.routePathArrayTokenMap = newTrade.routePathTokenMap;
                this.tradeQuote = this.sushiswapTradeDetails.viableQuotes.slice();
                this.tradeQuote.push(newTrade);
              }
            }
            // console.log('uniswap new quote');
            // console.log(this.tradeQuote);
            await this.tradeQuote.forEach((quote: any, index: number) => {
              quote.expectedConvertQuote = this.decideDecimalsByAmount(quote.expectedConvertQuote);
              quote.liquidityProviderFee = this.decideDecimalsByAmount(newTrade.liquidityProviderFee);
        
              if(this.tradeQuote.length == 1) {
                if(quote.transaction) {
                  this.bestQuote = quote;
                  this.swapform.toamount = this.toPlainString(this.bestQuote.expectedConvertQuote);
this.bestQuote.expectedConvertQuoteInString = this.toPlainString(this.bestQuote.expectedConvertQuote);
                }
              }
              else if(index < (this.tradeQuote.length-1)) {
                if((parseFloat(quote.expectedConvertQuote) >= parseFloat(this.tradeQuote[index+1].expectedConvertQuote)) && (parseFloat(quote.expectedConvertQuote) > parseFloat(this.bestQuote.expectedConvertQuote))) {
                  if(this.tradeQuote[index+1].transaction) {
                    this.bestQuote = this.tradeQuote[index+1];
                    this.swapform.toamount = this.toPlainString(this.bestQuote.expectedConvertQuote);
this.bestQuote.expectedConvertQuoteInString = this.toPlainString(this.bestQuote.expectedConvertQuote);
                  }
                }
                else if((parseFloat(quote.expectedConvertQuote) < parseFloat(this.tradeQuote[index+1].expectedConvertQuote)) && (parseFloat(this.tradeQuote[index+1].expectedConvertQuote) > parseFloat(this.bestQuote.expectedConvertQuote))) {
                  this.bestQuote = this.tradeQuote[index+1];
                  this.swapform.toamount = this.toPlainString(this.bestQuote.expectedConvertQuote);
this.bestQuote.expectedConvertQuoteInString = this.toPlainString(this.bestQuote.expectedConvertQuote);
                }
              }
              this.tradeQuote[index].expectedConvertQuoteInString = quote.expectedConvertQuote.toString();
            });
          })
        }
    
        if(this.sushiswapTradeDetails.trade) {

          if(this.sushiswapTradeDetails.trade.quoteChanged$) {
            if(this.sushiswapObservable) {
              this.sushiswapObservable.unsubscribe();
            }
            this.sushiswapObservable = this.sushiswapTradeDetails.trade.quoteChanged$.subscribe(async (newTrade: any) => {
              // console.log(newTrade);
              this.tradeQuote = await this.sushiswapService.getViableQuotes(newTrade.allTriedRoutesQuotes);
              if(this.tradeQuote.length > 0) {
                this.tradeQuote.forEach((quote: any, index: any) => {
                  this.tradeQuote[index].transaction = newTrade.transaction;
                });
                this.tradeQuote = this.tradeQuote.concat(this.uniswapTradeDetails.viableQuotes);
              }
              else {
                if(newTrade.transaction) {
                  newTrade.exchangeName = "Pancakeswap";
                  newTrade.routePathArrayTokenMap = newTrade.routePathTokenMap;
                  this.tradeQuote = this.uniswapTradeDetails.viableQuotes.slice();
                  this.tradeQuote.push(newTrade);
                }
              }
              // console.log('sushiswap new quote');
              // console.log(this.tradeQuote);
              await this.tradeQuote.forEach((quote: any, index: number) => {
                quote.expectedConvertQuote = this.decideDecimalsByAmount(quote.expectedConvertQuote);
                quote.liquidityProviderFee = this.decideDecimalsByAmount(newTrade.liquidityProviderFee);
          
                if(this.tradeQuote.length == 1) {
                  if(quote.transaction) {
                    this.bestQuote = quote;
                    this.swapform.toamount = this.toPlainString(this.bestQuote.expectedConvertQuote);
this.bestQuote.expectedConvertQuoteInString = this.toPlainString(this.bestQuote.expectedConvertQuote);
                  }
                }
                else if(index < (this.tradeQuote.length-1)) {
    
                  if(this.tradeQuote[index+1].transaction) {
                    if((parseFloat(quote.expectedConvertQuote) >= parseFloat(this.tradeQuote[index+1].expectedConvertQuote)) && (parseFloat(quote.expectedConvertQuote) > parseFloat(this.bestQuote.expectedConvertQuote))) {
                      this.bestQuote = this.tradeQuote[index+1];
                      this.swapform.toamount = this.toPlainString(this.bestQuote.expectedConvertQuote);
this.bestQuote.expectedConvertQuoteInString = this.toPlainString(this.bestQuote.expectedConvertQuote);
                    }
                    else if((parseFloat(quote.expectedConvertQuote) < parseFloat(this.tradeQuote[index+1].expectedConvertQuote)) && (parseFloat(this.tradeQuote[index+1].expectedConvertQuote) > parseFloat(this.bestQuote.expectedConvertQuote))) {
                    this.bestQuote = this.tradeQuote[index+1];
                    this.swapform.toamount = this.toPlainString(this.bestQuote.expectedConvertQuote);
this.bestQuote.expectedConvertQuoteInString = this.toPlainString(this.bestQuote.expectedConvertQuote);
                  }
                  }
                }
                this.tradeQuote[index].expectedConvertQuoteInString = quote.expectedConvertQuote.toString();
              });
            })
          }
        }

      }

      this.tradeQuote = this.tradeDetails.viableQuotes;
      this.bestQuote = {
        expectedConvertQuote: 0
      }
      await this.tradeQuote.forEach((quote: any, index: number) => {
        quote.expectedConvertQuote = this.decideDecimalsByAmount(quote.expectedConvertQuote);
        if(quote.exchangeName.includes('Uniswap')) {
          quote.liquidityProviderFee = this.decideDecimalsByAmount(this.tradeDetails.uniswapFee);
        }
        else if(quote.exchangeName.includes('Sushiswap')) {
          quote.liquidityProviderFee = this.decideDecimalsByAmount(this.tradeDetails.sushiSwapFee);
        }
        else if(quote.exchangeName.includes('Pancakeswap')) {
          quote.liquidityProviderFee = this.decideDecimalsByAmount(this.tradeDetails.pancakeSwapFee);
        }
        else if(quote.exchangeName.includes('Bakeryswap')) {
          quote.liquidityProviderFee = this.decideDecimalsByAmount(this.tradeDetails.bakerySwapFee);
        }

        if(quote.routePathArrayTokenMap[0].symbol == 'WBNB') {
          quote.routePathArrayTokenMap[0].symbol = 'BNB';
        }

        if(this.tradeQuote.length == 1) {
          this.bestQuote = quote;
          this.swapform.toamount = this.toPlainString(this.bestQuote.expectedConvertQuote);
this.bestQuote.expectedConvertQuoteInString = this.toPlainString(this.bestQuote.expectedConvertQuote);
        }
        else if(index < (this.tradeQuote.length-1)) {
          if((parseFloat(quote.expectedConvertQuote) >= parseFloat(this.tradeQuote[index+1].expectedConvertQuote)) && (parseFloat(quote.expectedConvertQuote) > parseFloat(this.bestQuote.expectedConvertQuote))) {
            if(quote.transaction) {
              this.bestQuote = quote;
              this.swapform.toamount = this.toPlainString(this.bestQuote.expectedConvertQuote);
this.bestQuote.expectedConvertQuoteInString = this.toPlainString(this.bestQuote.expectedConvertQuote);
            }
          }
          else if((parseFloat(quote.expectedConvertQuote) < parseFloat(this.tradeQuote[index+1].expectedConvertQuote)) && (parseFloat(this.tradeQuote[index+1].expectedConvertQuote) > parseFloat(this.bestQuote.expectedConvertQuote))) {
            if(this.tradeQuote[index+1].transaction) {
              this.bestQuote = this.tradeQuote[index+1];
              this.swapform.toamount = this.toPlainString(this.bestQuote.expectedConvertQuote);
this.bestQuote.expectedConvertQuoteInString = this.toPlainString(this.bestQuote.expectedConvertQuote);
            }
          }
        }
        this.tradeQuote[index].expectedConvertQuoteInString = quote.expectedConvertQuote.toString();
        if(this.bestQuote.hasEnoughAllowance == false && this.bestQuote.hasEnoughAllowance != undefined) {
          this.approvalPending = true;
        }
        else {
          this.approvalPending = false;
        }
      });
      this.spinner.hide();

    } catch(exc) {
      // console.log(exc);
      this.openModal('Something went wrong!', 'Please refresh the quote or select another pair.');
      // alert('Could not find a supported blockchain provider! Please install Metamask and reload the app.');
    }

  }

  async addAllowance() {
    if(this.bestQuote.approvalTransaction) {
      this.spinner.show();
      const approval: any = await this.web3Service.addAllowance(this.bestQuote.approvalTransaction);
      if(approval.transactionHash) {
        this.approvalPending = false;
      }
      this.spinner.hide();
    } else {
      this.openModal('Something went wrong!','Please refresh the quotation.');
    }
  }

  async sendTrade() {
    try {
      if(this.bestQuote) {
        this.spinner.show();
        const tradeResult = await this.web3Service.sendTransaction(this.bestQuote.transaction);
        this.openModalTx('Your swap transaction was submitted!',tradeResult);
        this.spinner.hide();
          setTimeout(() => {
            this.reloadBalance();
          }, 1000);
        
      }
      else {
        this.openModal('', 'Please first find a quote to swap!');
        // alert('Please first find a quote to swap!');
      }
    }
    catch(e) {
      this.spinner.hide();
      if(e == 'rejected')
        this.openModal('','Transaction was rejected by user!');
      else if(e == 'lowbal')
        this.openModal('','Not enough funds for gas fee!');
      else {
        
      }
    }
   
  }

  async reloadBalance() {
    if(this.swapform.fromtoken == 'ETH' || this.swapform.fromtoken == 'BNB') {
      this.accountBalance = await this.web3Service.getEthBalance();
      // console.log(this.accountBalance + ' reloaded');
    }
    else {
      this.fromTokenBalance = await this.web3Service.getERC20Balance(this.swapform.fromTokenAddress);
    }
  }

  toPlainString(num: any) {
    return (''+ +num).replace(/(-?)(\d*)\.?(\d*)e([+-]\d+)/,
      function(a: any,b: any,c: any,d: any,e: any) {
        return e < 0
          ? b + '0.' + Array(1-e-c.length).join('0') + c + d
          : b + c + d + Array(e-d.length+1).join('0');
      });
  }

  decideDecimalsByAmount(amount: any) {
    var decimals = 4;
    var returnAmount = parseFloat(parseFloat(amount).toFixed(4));
    while (returnAmount == 0) {
      decimals++;
      returnAmount = parseFloat((parseFloat(amount).toFixed(decimals)));
    }
    return returnAmount;
  }
 
  theme(type: any) {
    if(type=="light-theme") {
      this.renderer.removeClass(this.document.body, 'dark-theme');
      this.renderer.removeClass(this.document.body, 'fun-theme');
      this.renderer.addClass(this.document.body, 'light-theme');
    }
    else if(type=="dark-theme") {
      this.renderer.removeClass(this.document.body, 'light-theme');
      this.renderer.removeClass(this.document.body, 'fun-theme');
      this.renderer.addClass(this.document.body, 'dark-theme');
    }
    else if(type=="fun-theme") {
      this.renderer.removeClass(this.document.body, 'light-theme');
      this.renderer.removeClass(this.document.body, 'dark-theme');
      this.renderer.addClass(this.document.body, 'fun-theme');
    }
  }

  // async getDetails() {
  //   const DAI: Token = await Fetcher.fetchTokenData(
  //     this.chainId,
  //     this.tokenAddress
  //   );
  //   const pair = await Fetcher.fetchPairData(DAI, WETH[DAI.chainId]);
  //   const route = new Route([pair], WETH[DAI.chainId]);

  //   // console.log(route.midPrice.toSignificant(6)); // 201.306
  //   // console.log(route.midPrice.invert().toSignificant(6)); // 0.00496756
  // }

  // async getTrade() {
  //   await this.uniSwapService.getTradeDetails();
  // }


  preserveForm() {
    // console.log("preserveForm ", this.swapform)
    this.apiService.simpleSwapFormData = this.swapform;
  }

  async searchToken() {
    // console.log("this.search ",this.search)
    let address: any="";
    if(this.search.from) {
      address = this.search.from.toLowerCase();
    } else if(this.search.to) {
      address = this.search.to.toLowerCase();
    } else {
      // this.openModal('Error','No search query');
      return;
    }

    let isAddress: any = await this.web3Service.checkIsAddress(address)
    // console.log("isAddress ",isAddress)
    if(!isAddress) {
      this.initNewToken();
      return;
    }

    let items = this.tokensList;

    let result = items.filter((item:any) => (item.symbol.includes(address) || item.name.includes(address) || item.address.includes(address)));
    // console.log("result ",result)
    if(result.length > 0) {
      return;
    } else {
        let details: any = await this.web3Service.getContractDetails(address)
        // console.log("details ",details);

        let contractAddress = address;
        let decimals = details.decimals;
        let name = details.name;
        let symbol = details.symbol;
        let type:any;
        if(this.network.chainId == 56) {
          type="BEP20"
        } else {
          type = "ERC20";
        }

        let newToken = {
          "isNewToken":true,
          "address":contractAddress,
          "asset":"",
          "decimals":parseInt(decimals),
          "logoURI":"",
          "name":name,
          "pairs":[],
          "symbol":symbol,
          "type":type
        }
        this.newToken = newToken;

        return;
    }
    
    
  }

  addCustomToken() {
    //this.checkToken();
    let customTokens = localStorage.getItem(this.storageName);
    // console.log("addCustomToken ",customTokens);
    if(customTokens) {
      let parsedCustomTokens = JSON.parse(customTokens);
      parsedCustomTokens.forEach((v: any, i: any) => {
        this.tokensList.unshift(v);
      })
    }
  }
  // checkToken() {
  //   let isToken = this.apiService.componentTokenCheck();
  //   // console.log("simpleSwap isToken ",isToken)
  //   if(!isToken) {
  //     this.router.navigateByUrl("/password")
  //   }
  // }

  async importToken() {
    if(this.newToken.address && this.newToken.symbol && this.newToken.decimals) {
      // push token in our list
      this.tokensList.unshift(this.newToken);
      
      //store token
      this.storeToken(this.newToken);

      this.addTokenToMetaMask();
    } else {
      // this.openModal('Error',"Token Invalid");
    }
  }

  storeToken(token: any) {

    let existingCustomTokens = localStorage.getItem(this.storageName);
    let customTokens = new Array();
    if(existingCustomTokens) {
      customTokens = JSON.parse(existingCustomTokens);
    }
    customTokens.push(token);
    localStorage.setItem(this.storageName,JSON.stringify(customTokens));
  }

  async sendApproval(abi: any, address: any) {
    try {
      let approved = await this.web3Service.sendApproval(abi, address)
      // console.log("approved ",approved)

      if (approved) {
        // console.log('Thanks for your interest!');
        if(this.staticRModalRef) {
          this.staticRModalRef.hide()
        }
        if(this.static2ModalRef) {
          this.static2ModalRef.hide()
        }
      } else {
        // console.log('Your loss!');
      }
    } catch (error) {
      // console.log(error);
    }
  }

  async addTokenToMetaMask() {
    const tokenAddress = this.newToken.address;
    const tokenSymbol = this.newToken.symbol;
    const tokenDecimals = this.newToken.decimals;
    const tokenImage = this.newToken.logoURI;

    try {
      // wasAdded is a boolean. Like any RPC method, an error may be thrown.
      let wasAdded = await this.web3Service.importToken(tokenAddress, tokenSymbol, tokenDecimals, tokenImage)

      if (wasAdded) {
        // console.log('Thanks for your interest!');
        if(this.staticRModalRef) {
          // select new token as from token
          this.swapform.fromtoken = this.newToken.symbol;
          this.swapform.fromTokenAddress = this.newToken.address;
          this.swapform.fromtokenname = this.newToken.name;
          this.swapform.fromTokenLogo = this.newToken.logoURI;

          this.search.from = "";
          this.initNewToken();
          this.staticRModalRef.hide()
        }
        if(this.static2ModalRef) {
          // select new token as to token
          this.swapform.totoken = this.newToken.symbol;
          this.swapform.toTokenAddress = this.newToken.address;
          this.swapform.totokenname = this.newToken.name;
          this.swapform.toTokenLogo = this.newToken.logoURI;


          this.search.to = "";
          this.initNewToken();
          this.static2ModalRef.hide()
        }
      } else {
        // console.log('Your loss!');
      }
    } catch (error) {
      // console.log(error);
    }
  }

  initNewToken() {
    this.newToken = {
    "isNewToken":true,
    "address":"",
    "asset":"",
    "decimals":0,
    "logoURI":"",
    "name":"",
    "pairs":[],
    "symbol":"",
    "type":""
  }
  }

  showRModal() {
    this.tokenListLoad();
    this.staticRModalRef = this.modalService.show(this.staticRModal, {
      class: 'modal-dialog-centered' 
    });

    this.staticRModalRef.onHide.subscribe((e: any) => {
        this.search.from = "";
        this.initNewToken();
    })

  }

  show2Modal() {
    this.tokenListLoad();
    this.static2ModalRef = this.modalService.show(this.static2Modal, {
      class: 'modal-dialog-centered' 
    });

    this.static2ModalRef.onHide.subscribe((e: any) => {
        this.search.to = "";
        this.initNewToken();
    })
  }

  tokenListLoad() {
    if(this.network.chainId == 56) {
      this.fetchBscTokens().subscribe(response => {
        this.tokensList = response;
        this.addCustomToken();
      })
    } else if(this.network.chainId == 1) {
      this.fetchEthTokens().subscribe(response => {
        this.tokensList = response;
        this.addCustomToken();
      })
    }
  }

  checkSearchClear() {
    if(!this.search.to && !this.search.from) {
      // console.log("clear")
       this.initNewToken(); 
    }
  }

  copyTx(tx: any) {
    navigator.clipboard.writeText(tx);
  }
}
