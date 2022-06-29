import { Component, OnChanges, OnInit, Inject, SimpleChanges, TemplateRef, ViewChild, Renderer2, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subscription, timer } from 'rxjs';
import { NgxSpinnerService } from "ngx-spinner";
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { SushiswapServiceService } from '../../services/sushiswap/sushiswap-service.service'
import { UniswapServiceService } from  '../../services/uniswap/uniswap-service.service'
import { pancakeswapService } from '../../services/pancakeswap/pancakeswap-service.service'
import { BakeryswapServiceService } from '../../services/bakeryswap/bakeryswap-service.service'
import { Web3Service } from '../../services/web3.service';
import { ApiService } from '../../services/api.service';
import { LimitorderprotocolService } from 'src/app/services/limitorder/limitorderprotocol.service';
import { Router } from '@angular/router';
// import {
//   LimitOrderBuilder,
//   Web3ProviderConnector,
// } from '@1inch/limit-order-protocol';

import Web3 from 'web3';
import {
    LimitOrderBuilder,
    LimitOrderPredicateBuilder,
    LimitOrderPredicateCallData,
    LimitOrderProtocolFacade,
    Web3ProviderConnector,
} from 'limit-order-protocol';
declare var window: any;

import { createChart } from 'lightweight-charts';
import { debug } from 'console';
@Component({
  selector: 'app-classictrade',
  templateUrl: './classictrade.component.html',
  styleUrls: ['./classictrade.component.scss']
})
export class ClassictradeComponent implements OnInit {
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    // console.log("height ",this.chart.nativeElement.offsetHeight)
    this.chartDiv.applyOptions({width: this.chart.nativeElement.offsetWidth-20, height: this.chart.nativeElement.offsetHeight-20})
  }

  modalRef: any;
  @ViewChild("walletConnect") private walletConnectModal!: TemplateRef<any>;
  @ViewChild('chart', {static: true}) chart: any;
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

  selectedTab = "limit";

  swapform = {
    fromamount: '1',
    toamount: '100',
    fromtoken: 'ETH',
    totoken: 'KRZ',
    fromtokenname: 'Ethereum',
    totokenname: 'Kranz Token',
    toTokenAddress: '0xf54b304e2e4b28c7e46619d1a340f9b2b72383d7',
    fromTokenAddress: '"NO_CONTRACT_ADDRESS"',
    fromTokenLogo: '../../../assets/images/icons/ethereum.png',
    toTokenLogo: 'https://etherscan.io/token/images/kranztoken_32.png',
    predicate: '0x0',
    fromthresholdamount:""
  }

  expiry: any;
  selectedExpiry: any;
  selectedPredicate: any;

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

  candlestickSeries: any;
  volumeSeries: any;
  chartArray!: any;

  high$ = new BehaviorSubject<any>('');
  low$ = new BehaviorSubject<any>('');

  selectedTimeFrame: any = '300';
  userAcc: any;

  contractAddress: string = '0xF31eF7970D301c1A5bCBb6f21520828c6Fd39Ca1'; // commented validate limitorder testnet
  limitOrder: any;
  limitOrderTypedData: any;
  limitOrderProtocolFacade: any;
  limitOrderBuilder: any;
  connector: any;

  web3: any = new Web3('wss://mainnet.infura.io/ws/v3/420c1724670d45f684d2b4f5a92c65de');

  blockNo:any;

  oneFromValue: any;
  oneToValue: any;
  chartDiv: any;


  tradePrice: any;
  tradeValue: any;
  inverseTradeValue: any;

  createOrderData: any = {
    limitOrder:{},
    signature:"",
    limitOrderHash:""
  };

  account$ = new BehaviorSubject<any>('');
  network$ = new BehaviorSubject<any>('');
  orders$ = new BehaviorSubject<any>('');

  signature: any;
  constructor(private router:Router,private http: HttpClient, private uniswapService: UniswapServiceService, private sushiswapService: SushiswapServiceService, private bakerySwapService: BakeryswapServiceService, private pancakeSwapService: pancakeswapService, private web3Service: Web3Service, private spinner: NgxSpinnerService, private modalService: BsModalService, private apiService: ApiService, public limitOrderService: LimitorderprotocolService) { 
    this.chartArray = new Array();
    this.connector = new Web3ProviderConnector(this.web3);

    this.web3Service.getNetwork().subscribe((network: any) => {
      this.network$.next(network);
    });
    this.web3Service.getAccount().subscribe((account: any) => {
      this.account$.next(account[0]);
    });
    // let isToken = this.apiService.componentTokenCheck();
    // // console.log("classicTrade isToken ",isToken)
    // if(!isToken) {
    //   this.router.navigateByUrl('/password');
    // }
    this.limitOrderProtocolFacade = new LimitOrderProtocolFacade(
      this.contractAddress,
      this.connector
    );
    
    this.changeExpiry("7day");
  }

  ngOnInit(): void {

    try {

      this.web3Service.getNetwork().subscribe(network => {
        this.network = network;
        this.initFunctions();
      })

    } catch(exc) {
      this.spinner.hide();
      this.openModal('Could not find a supported blockchain provider!', 'Please install Metamask and reload the app.');
    }
  }

  ngAfterViewInit() {
    console.log("ngAfterViewInit" ,this.chart)
    if(this.chart) {
      this.renderChart(this.chart);
      this.initChart();
      this.getChart(this.swapform.fromtoken, this.swapform.totoken, this.selectedTimeFrame);
    }
  }

  async initFunctions() {
    this.spinner.show();
    try {
      this.blockNo = await this.web3Service.getBlockNumber();
      if(this.network.chainId == 56 || this.network.chainId == 97) {
        let simpleS = this.apiService.simpleSwapFormData;
        if(simpleS) {
          this.swapform = simpleS;
          this.callGetSwapQuoteWithDelay();
        } else {
          this.swapform.totokenname = 'Kranz Token';
          this.swapform.toTokenAddress = '0xf54b304e2e4b28c7e46619d1a340f9b2b72383d7';
          this.swapform.totoken =  'KRZ';
          this.swapform.toTokenLogo = 'https://etherscan.io/token/images/kranztoken_32.png';
          if(this.selectedTab == "limit") {
            this.swapform.fromtoken = 'WBNB';
            this.swapform.fromTokenAddress = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
            this.swapform.fromtokenname = 'Wrapped BNB';
            this.swapform.fromTokenLogo = '../../../assets/images/icons/bnb.png';
          }
          else {
            this.swapform.fromtoken = 'BNB';
            this.swapform.fromtokenname = 'Binance coin';
            this.swapform.fromTokenLogo = '../../../assets/images/icons/bnb.png';
          }
        }
        // if(this.chart) {
        //   this.renderChart(this.chart);
        //   this.initChart();
        //   this.getChart(this.swapform.fromtoken, this.swapform.totoken, this.selectedTimeFrame);
        // }
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
          this.swapform.totokenname = 'Kranz Token';
          this.swapform.toTokenAddress = '0xf54b304e2e4b28c7e46619d1a340f9b2b72383d7';
          this.swapform.totoken =  'KRZ';
          this.swapform.toTokenLogo = 'https://etherscan.io/token/images/kranztoken_32.png';
          if(this.selectedTab == "limit") {
            this.swapform.fromtoken = 'WETH';
            this.swapform.fromtokenname = 'Wrapped Ethereum';
            this.swapform.fromTokenLogo = '../../../assets/images/icons/ethereum.png';
            this.swapform.fromTokenAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
          }
          else {
            this.swapform.fromtoken = 'WETH';
            this.swapform.fromtokenname = 'Wrapped Ethereum';
            this.swapform.fromTokenLogo = '../../../assets/images/icons/ethereum.png';
          }

          // if(this.chart) {
          //   this.renderChart(this.chart);
          //   this.initChart();
          //   this.getChart(this.swapform.fromtoken, this.swapform.totoken, this.selectedTimeFrame);
          // }
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
      this.reloadBalance();
      // this.getUserOrders(this.swapform.fromtoken, this.swapform.totoken);
      this.spinner.hide();
      // to load default prices with default swaptoken from amount as 1
      this.callGetSwapQuoteWithDelay();

      // var account: any = await this.web3Service.connectAccount();
      // console.log("account ",account)
      // this.account$.next(account[0]);

      // let network = await this.web3Service.getAccountNetwork();
      // console.log("network ",network)
      // this.network$.next(network);
    } catch(exc: any) {
      return this.spinner.hide();
    }
  }

  loadLimitOrder() {
    this.selectedTab = "limit";
    
  }

  loadClassicSwap() {
    this.selectedTab = "swap";
    this.callGetSwapQuoteWithDelay();
  }

  getExpiryTitle(e: any) {
    return String(e.value.title);
  }

  getPrice() {
    let price = (parseFloat(this.swapform.toamount) / parseFloat(this.swapform.fromamount)).toFixed(4);
    if(price == "NaN")
      return 0;
    else
      return price;
  }

  renderChart(chartElement: any) {
    // console.log("chartElement.nativeElement.offsetWidth ",chartElement.nativeElement.offsetWidth)
    // console.log("chartElement.nativeElement.offsetHeight ",chartElement.nativeElement.offsetHeight)
    this.chartDiv = createChart(chartElement.nativeElement, { width: chartElement.nativeElement.offsetWidth -20, height: chartElement.nativeElement.offsetHeight -20 });
    this.chartDiv.applyOptions({
      timeScale: {
    timeVisible: true,
    secondsVisible: false,
  },
        handleScroll: {
            mouseWheel: true,
            pressedMouseMove: true,
        },
        handleScale: {
            axisPressedMouseMove: true,
            mouseWheel: true,
            pinch: true,
        },
        
        layout: {
          backgroundColor: 'rgba(255,255,255,0.1)',
          textColor: 'rgba(157, 173, 209, 1)',
        },
        grid: {
          vertLines: {
            color: 'rgba(197, 203, 206, 0.5)',
          },
          horzLines: {
            color: 'rgba(197, 203, 206, 0.5)',
          },
        },

        
    });

    this.candlestickSeries = this.chartDiv.addCandlestickSeries();
  //   this.volumeSeries = chart.addHistogramSeries({
  //   color: 'rgba(218, 230, 254, 0.5)',
  //   priceFormat: {
  //     type: 'volume',
  //   },
  //   priceScaleId: '',
  //   scaleMargins: {
  //     top: 0.8,
  //     bottom: 0,
  //   },
  //   // overlay: true,
  // });
    this.chartDiv.subscribeCrosshairMove((param: any) => {
      if(param.time) {
        let ohlc = param.seriesPrices.get(this.candlestickSeries);
        let high = parseFloat(ohlc.high);
        let low = parseFloat(ohlc.low);
        this.high$.next(high.toFixed(4))
        this.low$.next(low.toFixed(4))
      }
    })
    var timeScale = this.chartDiv.timeScale();
    var timer: any = null;
    timeScale.subscribeVisibleLogicalRangeChange(() => {
    if (timer !== null) {
      return;
    }
    timer = setTimeout(() => {
     var logicalRange = timeScale.getVisibleLogicalRange();
     if (logicalRange !== null) {
       var barsInfo = this.candlestickSeries.barsInLogicalRange(logicalRange);
       if (barsInfo !== null && barsInfo.barsBefore < 1) {
        // this.chartPage = this.chartPage+1;
        // this.mergeChart();
       }
     }
     timer = null;
    }, 300);
  });
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
        this.toTokenBalance = await this.web3Service.getEthBalance();
      }
      else {
        this.toTokenBalance = await this.web3Service.getERC20Balance(token.address);
      }
    }
    
    this.tokenChangeCommon(false);
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

    this.spinner.show();
    if(token.symbol == 'ETH' || token.symbol == 'BNB') {
      this.fromTokenBalance = await this.web3Service.getEthBalance();
      this.approvalPending = false;
    }
    else {
      this.fromTokenBalance = await this.web3Service.getERC20Balance(token.address);
      let allowanceStatus: any = await this.checkTokenAllowance(this.swapform.fromTokenAddress, await this.web3Service.toWei(this.fromTokenBalance));
      if(!allowanceStatus.status) {
        this.approvalPending = true;
      }
    }
    
    if(this.selectedTab == "swap")
      this.tokenChangeCommon(true);
    else
      this.tokenChangeCommon(false);
    this.spinner.hide();
  }

  tokenChangeCommon(getQuote: boolean) {
    // console.log("tokenChangeCommon ")
    // console.log("this.swapform.toamount ",this.swapform.toamount);
    // console.log("this.swapform.fromamount ",this.swapform.fromamount);
    // this.oneFromValue;
    // this.oneToValue;
    this.initChart();
    this.getChart(this.swapform.fromtoken, this.swapform.totoken, this.selectedTimeFrame);

    if(getQuote) {
      this.callGetSwapQuoteWithDelay();
    }

    this.getUserOrders(this.swapform.fromtoken, this.swapform.totoken);
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

    this.reloadBalance();
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

  changeExpiry(expiry: any) {
    const expiryAndPredicate = this.limitOrderService.calculatePredicateFromExpiry(expiry, this.limitOrderProtocolFacade);
    this.selectedPredicate = expiryAndPredicate.selectedPredicate;
    this.selectedExpiry = expiryAndPredicate.selectedExpiry;
    this.swapform.predicate = this.selectedPredicate;
    // console.log("this.selectedExpiry ",this.selectedExpiry)
    // this.testExpirySave(this.selectedExpiry);
  }

  // testExpirySave(expiry: any) {
  //   this.apiService.expirySave({expiry:expiry, id: 55}).subscribe(async (res : any)=>{
  //     console.log("res ",res)
      
  //   },(HttpErrorResponse: any) => {
      
  //     this.apiService.errorHandling(HttpErrorResponse);
  //   });
  // }

  callGetSwapQuoteWithDelay()  {
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
      if(this.network.chainId == 56 || this.network.chainId == 97) {
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
      this.convertValues();

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

  convertValues() {
    // console.log("this.swapform.fromamount ",this.swapform.fromamount)
    // console.log("this.swapform.toamount ",this.swapform.toamount)
    this.oneFromValue = parseFloat(this.swapform.toamount) / parseFloat(this.swapform.fromamount);
    this.oneToValue = parseFloat(this.swapform.fromamount) / parseFloat(this.swapform.toamount);
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
      this.fromTokenBalance = this.accountBalance;
    }
    else {
      this.fromTokenBalance = await this.web3Service.getERC20Balance(this.swapform.fromTokenAddress);
    }
    if(this.swapform.totoken == 'ETH' || this.swapform.totoken == 'BNB') {
      this.accountBalance = await this.web3Service.getEthBalance();
      this.fromTokenBalance = this.accountBalance;
    }
    else {
      this.toTokenBalance = await this.web3Service.getERC20Balance(this.swapform.toTokenAddress);
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
  checkToken() {
    let isToken = this.apiService.componentTokenCheck();
    // console.log("simpleSwap isToken ",isToken)
    if(!isToken) {
      this.router.navigateByUrl("/password")
    }
  }

  async importToken() {
    if(this.newToken.address && this.newToken.symbol && this.newToken.decimals) {
      // push token in our list
      this.tokensList.unshift(this.newToken);
      
      //store token
      this.storeToken(this.newToken);

      // this.addTokenToMetaMask();
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
          this.fromTokenBalance = await this.web3Service.getERC20Balance(this.swapform.fromTokenAddress);
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
          this.toTokenBalance = await this.web3Service.getERC20Balance(this.swapform.toTokenAddress);
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

  getFromTokenUSDValue(): Observable<any> {
    if(this.network == '56') {
      return this.http.get('https://api.coingecko.com/api/v3/simple/token_price/binance-smart-chain?contract_addresses=' + this.swapform.fromTokenAddress + '&vs_currencies=usd');
    }
    else {
      return this.http.get('https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=' + this.swapform.fromTokenAddress + '&vs_currencies=usd');
    }
  }

  getToTokenUSDValue(): Observable<any> {
    if(this.network == '56') {
      return this.http.get('https://api.coingecko.com/api/v3/simple/token_price/binance-smart-chain?contract_addresses=' + this.swapform.toTokenAddress + '&vs_currencies=usd');
    }
    else {
      return this.http.get('https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=' + this.swapform.toTokenAddress + '&vs_currencies=usd');
    }
  }

  calculateTradeValue(callback: any) {
    this.getFromTokenUSDValue().subscribe(response => {
      var fromTokenUSDValue = response[this.swapform.fromTokenAddress.toLowerCase()].usd;
      this.getToTokenUSDValue().subscribe(response2 => {
        var toTokenUSDValue = response2[this.swapform.toTokenAddress.toLowerCase()].usd;
        var result = fromTokenUSDValue / toTokenUSDValue;
        var inverseResult = toTokenUSDValue / fromTokenUSDValue;
        (result < 0) ? callback(result, parseFloat(inverseResult.toFixed(4))) : callback(parseFloat(result.toFixed(4)), inverseResult);
      })
    })
  }

  createLimitOrder() {
    this.web3Service.buildLimitOrder(this.swapform.fromTokenAddress, this.swapform.toTokenAddress, '0x3B9855C30531e9d06D6FE8a7F3E0197089EEE848', this.swapform.fromamount, this.swapform.toamount, this.network)
      .subscribe((response: any) => {
        // console.log(response);
      })
  }

  signLimitOrder() {
    const msgParams = JSON.stringify({
      domain: {
        chainId: this.network,
        name: '1inch Limit Order Protocol',
        verifyingContract: '0xF31eF7970D301c1A5bCBb6f21520828c6Fd39Ca1',
        version: '1'
      },
      message: {

      }
    })
  }

  // async placeLimitOrder() {
  //   let takerAmount = this.tradeValue;
  //   // console.log("this.tradeValue ",this.tradeValue);

  //   let makerAmountFormat = await this.web3Service.toWei(this.swapform.fromamount.toString());
  //   let takerAmountFormat = await this.web3Service.toWei(this.swapform.fromamount.toString());
  //   // console.log("makerAmountFormat ",makerAmountFormat)
  //   // console.log("takerAmountFormat ",takerAmountFormat)
  //   let limitOrderData = {
  //       "makerAssetAddress":this.swapform.fromTokenAddress,
  //       "walletAddress":this.userAcc,
  //       "takerAssetAddress":this.swapform.toTokenAddress,
  //       "makerAmount":this.swapform.fromamount,
  //       "takerAmount":this.swapform.toamount,
  //       "chainId":this.network,
  //       "expiryTime": 60000,
  //       "from_token": this.swapform.fromtoken,
  //       "to_token": this.swapform.totoken,
  //       "makerAmountFormat":makerAmountFormat,
  //       "takerAmountFormat":takerAmountFormat
  //   }
  //   // expiryTime in seconds
  //   this.apiService.limitOrderApi(limitOrderData).subscribe(async (res : any)=>{
  //     // console.log("res ",res)
  //     if(res.status) {        
  //       // this.openModal('Could not fetch user balance!', 'Please reload the page.');
  //     } else {
  //       // console.log("limit order save error");
  //     }
  //   },(HttpErrorResponse) => {
  //     this.apiService.errorHandling(HttpErrorResponse);
  //   });
  // }

  // saveSignature(trade_id: any, signature: any) {
  //   // console.log("saveSignature")
  //   // console.log("trade_id ",trade_id)
  //   // console.log("signature ",signature)
  //   this.apiService.limitOrderSignatureApi({trade_id:trade_id, signature:signature}).subscribe(async (res : any)=>{
  //     // console.log("res ",res)
  //     if(res.status) {        

  //     } else {
  //       // console.log("limit order save error");
  //     }
  //   },(HttpErrorResponse) => {
  //     this.apiService.errorHandling(HttpErrorResponse);
  //   });
  // }
  initChart() {
    // console.log("initChart")
    this.chartArray = new Array();

  }
  getChart(from_token: string, to_token: string, time_frame_in_seconds: any) {
    // debugger;
    // console.log("getChart")
    // // console.log("from_token ",from_token)
    // // console.log("to_token ",to_token)
    // // console.log("time_frame_in_seconds ",time_frame_in_seconds)
    this.apiService.getChartApi({from_token:from_token, to_token:to_token, tf: time_frame_in_seconds}).subscribe(async (res : any)=>{
      // // console.log("res ",res)
      if(res.status) {
        // this.chartDiv.applyOptions({priceScale: {visible: true}})
        this.chartArray = res.data;
        this.candlestickSeries.setData(this.chartArray);
        // this.volumeSeries.setData(this.chartArray);
      } else {
        this.candlestickSeries.setData([]);
        // this.chartDiv.applyOptions({priceScale: {visible: false}})
        // this.openModal('Error loading chart', 'No data.');
        // this.volumeSeries.setData("");
      }
    },(HttpErrorResponse) => {
      this.apiService.errorHandling(HttpErrorResponse);
    });
  }

  selectTimeFrame(time_in_seconds: any) {
    this.selectedTimeFrame = time_in_seconds;
    this.getChart(this.swapform.fromtoken, this.swapform.totoken, this.selectedTimeFrame);
  }

  async oneInchClient() {
    //web3, 1inch fix

    // if(!this.userAcc || !this.network) {
    //   return alert("Metamask not connected")
    // }
    if(!this.swapform.fromTokenAddress || !this.swapform.toTokenAddress) {
      return alert("Swap tokens not selected")
    }
    // if(!this.swapform.fromamount) {
    //   return alert("Amount is required")
    // }
    // if(!this.tradeValue) {
    //   return alert("Could not fetch Last trade value")
    // }

    let chainId = 97;
    // console.log("chainId ",chainId)
    let takerAmount = 0;

    if(this.swapform.fromamount) {
      takerAmount = parseFloat(this.swapform.fromamount) * this.tradeValue;
    }
    
    this.limitOrderBuilder = new LimitOrderBuilder(
        this.contractAddress,
        chainId,
        this.connector
    );
    
    let makerAmountFormat = await this.web3Service.toWei("10000");
    let takerAmountFormat = await this.web3Service.toWei("5");
    // console.log("makerAmountFormat ",makerAmountFormat)
    // console.log("takerAmountFormat ",takerAmountFormat)

    // console.log("fromTokenAddress ",this.swapform.fromTokenAddress)
    // console.log("toTokenAddress ",this.swapform.toTokenAddress)
    
    // let userAdd: any = this.web3Service.getAccountAddress();
    let userAdd: any = "0x8aF74347376b0CA2EBaFf52AEa2F3e98AC7c8c38";
    let takerToken: any = "0xed24fc36d5ee211ea25a80239fb8c4cfd80f12ee"; // BUSD
    let makerToken: any = "0x5441fDFad9408368f756F34Aa9E919eA43d11755"; // UNPAD

    let userMakerTokenBalance = await this.web3Service.getERC20Balance(makerToken);
    let userTakerTokenBalance = await this.web3Service.getERC20Balance(takerToken);

    // console.log("userMakerTokenBalance ",userMakerTokenBalance);
    // console.log("userTakerTokenBalance ",userTakerTokenBalance);

    let userMakerTokenAllowance = await this.web3Service.checkAllowance(makerToken, userAdd, this.contractAddress);    
    let userTakerTokenAllowance = await this.web3Service.checkAllowance(takerToken, userAdd, this.contractAddress);

    // console.log("userMakerTokenAllowance ",userMakerTokenAllowance);
    // console.log("userTakerTokenAllowance ",userTakerTokenAllowance);
    
    this.limitOrder = this.limitOrderBuilder.buildLimitOrder({
        makerAssetAddress: makerToken,
        takerAssetAddress: takerToken,
        makerAddress: userAdd,
        makerAmount: makerAmountFormat,
        takerAmount: takerAmountFormat,
        // predicate: '0x0',
        // permit: '0x0',
        // interaction: '0x0',
    });
    // console.log("this.limitOrder ",JSON.stringify(this.limitOrder))
    
    this.limitOrderTypedData = this.limitOrderBuilder.buildLimitOrderTypedData(
      this.limitOrder
    );
    this.createOrderData.limitOrder = this.limitOrder;
    // console.log("this.limitOrderTypedData ",JSON.stringify(this.limitOrderTypedData))

    // direct sign
    let signature: any = await this.web3Service.signLimitOrderNew(this.limitOrderTypedData, userAdd);
    // console.log("signature ",signature.data)
    this.createOrderData.signature = signature.data;

    const limitOrderHash = this.limitOrderBuilder.buildLimitOrderHash(
        this.limitOrderTypedData
    );
    // console.log("limitOrderHash ",limitOrderHash)

    this.createOrderData.limitOrderHash = limitOrderHash;
    // console.log("createOrderData ",this.createOrderData)
    
    const thresholdAmount = await this.web3Service.toWei("11111");

    let limitOrderApiData = {
      address: userAdd, 
      chainId: chainId, 
      salt: this.limitOrder.salt, 
      makerAsset: this.limitOrder.makerAsset, 
      takerAsset: this.limitOrder.takerAsset, 
      makerAssetData: this.limitOrder.makerAssetData, 
      takerAssetData: this.limitOrder.takerAssetData, 
      getMakerAmount: this.limitOrder.getMakerAmount, 
      getTakerAmount: this.limitOrder.getTakerAmount, 
      predicate: this.limitOrder.getTakerAmount, 
      permit: this.limitOrder.permit, 
      interaction: this.limitOrder.interaction, 
      signature: signature.data, 
      orderHash: limitOrderHash, 
      makerAmount: makerAmountFormat, 
      takerAmount: takerAmountFormat, 
      thresholdAmount: thresholdAmount, 
      makerToken: "BUSD", 
      takerToken: "UNPAD", 
      limitOrderContract: this.contractAddress
    };
    this.apiService.limitOrderApi(limitOrderApiData).subscribe(async (res : any)=>{
      // console.log("res ",res)
      if(res.status) {        
        // this.openModal('Could not fetch user balance!', 'Please reload the page.');
      } else {
        // console.log("limit order save error");
      }
    },(HttpErrorResponse) => {
      this.apiService.errorHandling(HttpErrorResponse);
    });
    
  }

  // async testSave() {
  //   let limitOrder: any = {"salt":"1435485334431","makerAsset":"0xed24fc36d5ee211ea25a80239fb8c4cfd80f12ee","takerAsset":"0x5441fDFad9408368f756F34Aa9E919eA43d11755","makerAssetData":"0x23b872dd0000000000000000000000008af74347376b0ca2ebaff52aea2f3e98ac7c8c3800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000056bc75e2d63100000","takerAssetData":"0x23b872dd00000000000000000000000000000000000000000000000000000000000000000000000000000000000000008af74347376b0ca2ebaff52aea2f3e98ac7c8c380000000000000000000000000000000000000000000000008ac7230489e80000","getMakerAmount":"0xf4a215c30000000000000000000000000000000000000000000000056bc75e2d631000000000000000000000000000000000000000000000000000008ac7230489e80000","getTakerAmount":"0x296637bf0000000000000000000000000000000000000000000000056bc75e2d631000000000000000000000000000000000000000000000000000008ac7230489e80000","predicate":"0x","permit":"0x","interaction":"0x"}
  //   let signature: any = {"data":"0x764c12d95bdab7fa0db95231d83751850ec68b8cff54ff7dfeb62000c7193dc506792f7b8edc91ca92b60a8baf2770b12a2b3dfa8f9de01899482f830de891fb1c"}
  //   let limitOrderHash: any = "0x46c882c1a767d272b9478591a72f43d21b631455b2abe8c71778f9112fec52d3";
  //   let userAdd: any = this.web3Service.getAccountAddress();

  //   let makerAmountFormat = await this.web3Service.toWei("100");
  //   let takerAmountFormat = await this.web3Service.toWei("10");
  //   const thresholdAmount = await this.web3Service.toWei("11111");

  //   let limitOrderApiData = {
  //     address: userAdd, 
  //     chainId: 97, 
  //     salt: limitOrder.salt, 
  //     makerAsset: limitOrder.makerAsset, 
  //     takerAsset: limitOrder.takerAsset, 
  //     makerAssetData: limitOrder.makerAssetData, 
  //     takerAssetData: limitOrder.takerAssetData, 
  //     getMakerAmount: limitOrder.getMakerAmount, 
  //     getTakerAmount: limitOrder.getTakerAmount, 
  //     predicate: limitOrder.getTakerAmount, 
  //     permit: limitOrder.permit, 
  //     interaction: limitOrder.interaction, 
  //     signature: signature.data, 
  //     orderHash: limitOrderHash, 
  //     makerAmount: makerAmountFormat, 
  //     takerAmount: takerAmountFormat, 
  //     thresholdAmount: thresholdAmount, 
  //     makerToken: "BUSD", 
  //     takerToken: "UNPAD", 
  //     limitOrderContract: this.contractAddress
  //   };
  //   console.log("limitOrderApiData ",limitOrderApiData)
  //   this.apiService.limitOrderApi(limitOrderApiData).subscribe(async (res : any)=>{
  //     console.log("res ",res)
  //     if(res.status) {        
  //       // this.openModal('Could not fetch user balance!', 'Please reload the page.');
  //     } else {
  //       // console.log("limit order save error");
  //     }
  //   },(HttpErrorResponse) => {
  //     this.apiService.errorHandling(HttpErrorResponse);
  //   });
  // }

  async fillOrder() {
    // console.log("fillOrder");

    this.connector = new Web3ProviderConnector(this.web3);
    
    this.limitOrderProtocolFacade = new LimitOrderProtocolFacade(
        this.contractAddress,
        this.connector
    );

    const makerAmount = await this.web3Service.toWei("2");
    const takerAmount = await this.web3Service.toWei("0");
    const thresholdAmount = await this.web3Service.toWei("4");

    const sampleLimitOrder = {
      "limitOrder": {
          "salt": "214094135125",
          "makerAsset": "0x5441fDFad9408368f756F34Aa9E919eA43d11755",
          "takerAsset": "0xed24fc36d5ee211ea25a80239fb8c4cfd80f12ee",
          "makerAssetData": "0x23b872dd0000000000000000000000003b9855c30531e9d06d6fe8a7f3e0197089eee848000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000021e19e0c9bab2400000",
          "takerAssetData": "0x23b872dd00000000000000000000000000000000000000000000000000000000000000000000000000000000000000003b9855c30531e9d06d6fe8a7f3e0197089eee8480000000000000000000000000000000000000000000000004563918244f40000",
          "getMakerAmount": "0xf4a215c300000000000000000000000000000000000000000000021e19e0c9bab24000000000000000000000000000000000000000000000000000004563918244f40000",
          "getTakerAmount": "0x296637bf00000000000000000000000000000000000000000000021e19e0c9bab24000000000000000000000000000000000000000000000000000004563918244f40000",
          "predicate": "0x",
          "permit": "0x",
          "interaction": "0x"
      },
      "signature": "0xbec6f19af0af290b012727d867fc5ed4153a4fd4d49a215a78959e8c04e6dba852600f3c9ac91daffee45f2585b516b41767dabc4c9c74712a448bb7bbbbe4941c",
      "limitOrderHash": "0xa095e92dee8762ddadcbbde8ccb60267094dbb5ae7a015a96739bef0f76c5a60"
  }

    // console.log("order to be filled: ", this.createOrderData.limitOrder);

    const callData = this.limitOrderProtocolFacade.fillLimitOrder(
        this.createOrderData.limitOrder,
        this.createOrderData.signature,
        makerAmount,
        takerAmount,
        thresholdAmount
    );

    // let userAdd: any = this.web3Service.getAccountAddress();
    // let userAdd: any = "0xfF021A3890DC76b4E3A47a56B2b8Ac496D336A89";
    let userAdd: any = "0x3B9855C30531e9d06D6FE8a7F3E0197089EEE848";

    this.web3Service.fillLimitOrder(userAdd, this.contractAddress, callData).then((res:any) => {
      // console.log("res ",res)
    }).catch((e: any) => {
      // console.log("e ",e)
    })
  }

  async cancelOrder(order: any) {
    this.spinner.show();
    // console.log("cancelOrder");
    
    const cancleLimitOrder = {
      "salt": order.salt,
      "makerAsset": order.maker_asset,
      "takerAsset": order.taker_asset,
      "makerAssetData": order.maker_asset_data,
      "takerAssetData": order.taker_asset_data,
      "getMakerAmount": order.get_maker_amount,
      "getTakerAmount": order.get_taker_amount,
      "predicate": order.predicate,
      "permit": order.permit,
      "interaction": order.interaction
    }
    // console.log("cancleLimitOrder ",cancleLimitOrder)
    this.limitOrderProtocolFacade = await this.limitOrderService.LimitOrderProtocolFacade();
    const callData = await this.limitOrderService.cancelLimitOrder(this.limitOrderProtocolFacade, cancleLimitOrder);
    // console.log("cancelCalldata ",callData);
    let userAdd: any = this.web3Service.getAccountAddress();
    this.web3Service.cancelLimitOrder(userAdd, this.contractAddress, callData).then((res:any) => {
      // this.spinner.hide();
      // console.log("res ",res)
      this.userCancelOrder(order.id);
    }).catch((e: any) => {
      this.spinner.hide();
      // console.log("e ",e)
      if(e.data) {
        if(e.data.message) {
          this.openModal('Failed', e.data.message);
        }
      } else if(e.message) {
        this.openModal('Failed', e.message);
      }
    })
  }

  async checkRemaining(orderHash: any) {
    return new Promise(async (resolve, reject) => {
      try {
        this.limitOrderProtocolFacade = await this.limitOrderService.LimitOrderProtocolFacade();
        await this.limitOrderService.getRemaining(
          orderHash,
          this.limitOrderProtocolFacade
        ).then((remaining: any) => {
          // console.log("remaining ",remaining);
          resolve(remaining);
        }).catch((e: any) => {
          reject("NA");
        });
      } catch(exc: any) {
        // console.log(exc);
        reject("NA");
      }
    })
    
  }

  async approve() {
    this.spinner.show();
    let userAdd: any = this.web3Service.getAccountAddress();
    let allowance = parseFloat(this.fromTokenBalance) * 10;
    await this.web3Service.approveAllowance(userAdd, this.swapform.fromTokenAddress, this.contractAddress, allowance).then((response: any) => {
      this.spinner.hide();
      if(response.blockHash) {
        this.approvalPending = false;
      } else {
        this.approvalPending = true;
      }
    }).catch((e: any) => {
      // console.log("e ",e)
      this.spinner.hide();
      this.approvalPending = true;
      if(e.data) {
        if(e.data.message) {
          this.openModal('Failed', e.data.message);
        }
      } else if(e.message) {
        this.openModal('Failed', e.message);
      }
    });
  }

  async checkTokenAllowance(tokenAddress: any, amount: any) {
    return new Promise(async (resolve, reject) => {
      try {
        let userAdd: any = this.web3Service.getAccountAddress();
        // let userBalance: any = await this.web3Service.getERC20Balance(tokenAddress);
        let userTokenAllowance: any = await this.web3Service.checkAllowance(tokenAddress, userAdd, this.contractAddress);    
        // console.log("userTokenAllowance ",userTokenAllowance);

        if(parseFloat(amount) > 0) {
          if(parseFloat(userTokenAllowance) < parseFloat(amount)) {
            resolve({status: false});
            // let allowance = parseFloat(amount) * 10;
            // console.log("allowance ",allowance)
            // let response:any = await this.web3Service.approveAllowance(userAdd, tokenAddress, this.contractAddress, allowance);
            // console.log("response ",response);
            // if(response.hash) {
            //   resolve({status:1})
            // } else {
            //   resolve({status:0})
            // }
          }
          else {
            resolve({status: true})
          }
        } else {
          resolve({status: true})
        }
      } catch(exc: any) {
        // console.log(exc);
        reject(exc);
      }
    })
    
  }

  async reviewLimitOrder() {
    this.spinner.show();
    // console.log("this.swapform ",this.swapform)
    // console.log("reviewLimitOrder");

    let chainId = this.network.chainId;
    let userAdd: any = this.web3Service.getAccountAddress();
    
    let makerAmountFormat = await this.web3Service.toWei(parseFloat(this.swapform.fromamount).toString());
    let takerAmountFormat = await this.web3Service.toWei(parseFloat(this.swapform.toamount).toString());
    let thresholdAmount = await this.web3Service.toWei(parseFloat(this.swapform.fromamount).toString());
    
    // console.log("makerAmountFormat ",makerAmountFormat)
    // console.log("takerAmountFormat ",takerAmountFormat)
    // console.log("thresholdAmount ",thresholdAmount)

    // console.log("fromTokenAddress ",this.swapform.fromTokenAddress)
    // console.log("toTokenAddress ",this.swapform.toTokenAddress)
    
    let makerToken: any = this.swapform.fromTokenAddress;
    let takerToken: any = this.swapform.toTokenAddress;

    // let allowanceStatus: any = await this.checkTokenAllowance(makerToken, makerAmountFormat);
    // if(!allowanceStatus.status) {
    //   return alert("Allowance pending");
    // }

    this.limitOrderBuilder = await this.limitOrderService.LimitOrderBuilder(chainId);
    
    this.limitOrder = await this.limitOrderService.buildLimitOrder(this.limitOrderBuilder, makerToken, takerToken, userAdd, makerAmountFormat, takerAmountFormat, this.swapform.predicate);
    // console.log("this.limitOrder ",JSON.stringify(this.limitOrder))
    
    this.limitOrderTypedData = await this.limitOrderService.buildLimitOrderTypedData(this.limitOrderBuilder, this.limitOrder);
    // console.log("this.limitOrderTypedData ",JSON.stringify(this.limitOrderTypedData))

    this.createOrderData.limitOrder = this.limitOrder;
    
    // direct sign
    await this.web3Service.signLimitOrderNew(this.limitOrderTypedData, userAdd).then((signature: any) => {
      this.signature = signature.data;
    }).catch((e: any) => {
      this.spinner.hide();
      if(e.data) {
        if(e.data.message) {
          this.openModal('Failed', e.data.message);
        }
      } else if(e.message) {
        this.openModal('Failed', e.message);
      }
    });
    // console.log("signature ",this.signature.data)
    this.createOrderData.signature = this.signature;

    let limitOrderHash = await this.limitOrderService.buildLimitOrderHash(this.limitOrderBuilder, this.limitOrderTypedData);
    // console.log("limitOrderHash ",limitOrderHash)

    this.createOrderData.limitOrderHash = limitOrderHash;
    // console.log("createOrderData ",this.createOrderData)

    let limitOrderApiData = {
      address: userAdd, 
      chainId: chainId, 
      salt: this.limitOrder.salt, 
      makerAsset: this.limitOrder.makerAsset, 
      takerAsset: this.limitOrder.takerAsset, 
      makerAssetData: this.limitOrder.makerAssetData, 
      takerAssetData: this.limitOrder.takerAssetData, 
      getMakerAmount: this.limitOrder.getMakerAmount, 
      getTakerAmount: this.limitOrder.getTakerAmount, 
      predicate: this.limitOrder.predicate, 
      permit: this.limitOrder.permit, 
      interaction: this.limitOrder.interaction, 
      signature: this.signature, 
      orderHash: limitOrderHash, 
      makerAmount: makerAmountFormat, 
      takerAmount: takerAmountFormat, 
      thresholdAmount: thresholdAmount, 
      makerToken: this.swapform.fromtoken, 
      takerToken: this.swapform.totoken, 
      limitOrderContract: this.contractAddress,
      expiry: Math.floor((Date.now() / 1000) + this.selectedExpiry.seconds)
    };

    // console.log("limitOrderApiData ",limitOrderApiData);
    let matchingOrderResult: any = await this.getMatchingOrder(limitOrderApiData);
    // console.log("matchingOrderResult ",matchingOrderResult);

    if(matchingOrderResult.status) {
      // matching order found
      this.apiService.limitOrderApi(limitOrderApiData).subscribe(async (res : any)=>{
        // console.log("res ",res)
        this.spinner.hide();
        if(res.status) {
          if(matchingOrderResult.status && matchingOrderResult.data.length > 0) {
            this.fillOrderMatch(matchingOrderResult.data[0], limitOrderApiData)
          } else {
            this.openModal('Could not find matching order', 'Failed');
          }
        } else {
          this.openModal('Could not find matching order', 'Failed');
        }
      },(HttpErrorResponse) => {
        this.spinner.hide();
        this.apiService.errorHandling(HttpErrorResponse);
      });
    } else {
      // no matching order
      this.apiService.limitOrderApi(limitOrderApiData).subscribe(async (res : any)=>{
        // console.log("res ",res)
        this.spinner.hide();
        if(res.status) {
          this.openModal('Success', 'Order saved');
          this.getUserOrders(this.swapform.fromtoken, this.swapform.totoken);
        } else {
          this.openModal('Could not find matching order', 'Failed');
        }
      },(HttpErrorResponse) => {
        this.spinner.hide();
        this.apiService.errorHandling(HttpErrorResponse);
      });
    }
  }

  async getMatchingOrder(order: any) {
    return new Promise(async (resolve, reject) => {
      try {
        this.apiService.matchingLimitOrderApi(order).subscribe(async (res : any)=>{
          // console.log("res ",res)
          if(res.status) {        
            return resolve(res);
          } else {
            return resolve({status:0});
          }
        },(HttpErrorResponse: any) => {
          return resolve({status:0});
        });
      } catch(exc: any) {
        // console.log(exc);
        reject(exc);
      }
    })
  }

  async fillOrderMatch(matchOrder: any, currentOrder: any) {
    this.spinner.show();
    // console.log("fillOrderMatch");
    // console.log("matchOrder ",matchOrder)

    const makerAmount = currentOrder.takerAmount;
    const takerAmount = await this.web3Service.toWei("0");
    // const thresholdAmount = currentOrder.thresholdAmount;

    const sampleLimitOrder = {
      "limitOrder": {
          "salt": matchOrder.salt,
          "makerAsset": matchOrder.maker_asset,
          "takerAsset": matchOrder.taker_asset,
          "makerAssetData": matchOrder.maker_asset_data,
          "takerAssetData": matchOrder.taker_asset_data,
          "getMakerAmount": matchOrder.get_maker_amount,
          "getTakerAmount": matchOrder.get_taker_amount,
          "predicate": matchOrder.predicate,
          "permit": matchOrder.permit,
          "interaction": matchOrder.interaction
      },
      "signature": matchOrder.signature,
      "limitOrderHash": matchOrder.order_hash
    }

    // console.log("order to be filled: ", sampleLimitOrder);

    this.limitOrderProtocolFacade = await this.limitOrderService.LimitOrderProtocolFacade();

    let amount = currentOrder.makerAmount;
    let thresholdAmount: any = parseFloat(amount) * 5 / 100;
    thresholdAmount = (parseFloat(amount) + parseFloat(thresholdAmount)).toString();

    const callData = await this.limitOrderService.fillLimitOrder(this.limitOrderProtocolFacade,
        sampleLimitOrder.limitOrder,
        sampleLimitOrder.signature,
        makerAmount,
        takerAmount,
        thresholdAmount
    );

    let userAdd: any = this.web3Service.getAccountAddress();
    
    this.web3Service.fillLimitOrder(userAdd, this.contractAddress, callData).then((res:any) => {
      // console.log("res ",res)
      this.spinner.hide();
      this.openModal('Success', "Order executed");
      this.getUserOrders(this.swapform.fromtoken, this.swapform.totoken);
    }).catch((e: any) => {
      this.spinner.hide();
      // console.log("e ",e)
      if(e.data) {
        if(e.data.message) {
          this.openModal('Failed', e.data.message);
        }
      } else if(e.message) {
        this.openModal('Failed', e.message);
      }
    })
  }

  getUserOrders(fromtoken: any, totoken: any) {
    let chainId = this.network.chainId;
    let userAdd: any = this.web3Service.getAccountAddress();
    // console.log("userAdd ",userAdd)
    // console.log("chainId ",chainId)
    this.apiService.userOrdersApi({address:userAdd, chainId: chainId, fromToken: fromtoken, toToken: totoken}).subscribe(async (res : any)=>{
      // console.log("res ",res)
      if(res.status) {
        res.data.forEach(async (order:any, i: any) => {
          order.maker_amount = this.formatUnits(order.maker_amount, 18);
          order.taker_amount = this.formatUnits(order.taker_amount, 18);
          order.remaining = await this.checkRemaining(order.order_hash);
        })
        this.orders$.next(res.data);
      } else {
        this.orders$.next([]);
      }
    },(HttpErrorResponse: any) => {
      this.apiService.errorHandling(HttpErrorResponse);
    });
  
  }

  userCancelOrder(id: any) {
    // this.spinner.show();
    let chainId = this.network.chainId;
    let userAdd: any = this.web3Service.getAccountAddress();
    // console.log("userAdd ",userAdd)
    // console.log("chainId ",chainId)
    this.apiService.orderCancelApi({address:userAdd, chainId: chainId, id: id}).subscribe(async (res : any)=>{
      // console.log("res ",res)
      this.spinner.hide();
      if(res.status) {
        this.openModal('Success', res.message);
        this.getUserOrders(this.swapform.fromtoken, this.swapform.totoken);
      } else {
        this.openModal('Failed', res.message);
      }
    },(HttpErrorResponse: any) => {
      this.spinner.hide();
      this.apiService.errorHandling(HttpErrorResponse);
    });
  }

  formatUnits(amount: any, decimals: any) {
    return this.web3Service.formatUnits(amount, decimals);
  }

  importTestnetLocal() {
    // console.log("this.newToken ",this.newToken)
    this.newToken = {
      "isNewToken":true,
      "address":"0xed24fc36d5ee211ea25a80239fb8c4cfd80f12ee",
      "asset":"",
      "decimals":18,
      "logoURI":"",
      "name":"",
      "pairs":[],
      "symbol":"BUSD",
      "type":""
    };
    this.importToken();

    setTimeout(() => {
      this.newToken = {
        "isNewToken":true,
        "address":"0x5441fDFad9408368f756F34Aa9E919eA43d11755",
        "asset":"",
        "decimals":18,
        "logoURI":"",
        "name":"",
        "pairs":[],
        "symbol":"UNPAD",
        "type":""
      }
      this.importToken();

      this.initNewToken();
    }, 2000)
  }

}
