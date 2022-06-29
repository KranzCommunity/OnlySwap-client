import { Injectable } from '@angular/core';
import { Web3Service } from '../../services/web3.service';
import { UniswapPair, ChainId, UniswapPairSettings, ETH, TradeDirection, RouteQuote } from 'simple-uniswap-sdk';

@Injectable({
  providedIn: 'root'
})
export class UniswapServiceService {

  userAddress: any;
  slippage: any = 0.01;

  constructor(web3Service: Web3Service) { 
    web3Service.getAccount().subscribe(userAddress => {
      this.userAddress = userAddress;
    });
  }

  public createPair(swapform: any) {

    if(sessionStorage.getItem('slippage') != null)
      this.slippage = sessionStorage.getItem('slippage');

    if(swapform.fromtoken == 'ETH' || swapform.totoken == 'ETH') {

      if(swapform.fromtoken == 'ETH' && swapform.totoken == 'ETH') {
        var thisPair = new UniswapPair({
          fromTokenContractAddress: ETH.MAINNET().contractAddress,
          toTokenContractAddress: ETH.MAINNET().contractAddress,
          ethereumAddress: this.userAddress,
          chainId: ChainId.MAINNET,
          settings: new UniswapPairSettings({
            slippage: parseFloat(this.slippage)
          })
        })
        return thisPair;
      }

      if(swapform.fromtoken == 'ETH') {
        var thisPair = new UniswapPair({
          fromTokenContractAddress: ETH.MAINNET().contractAddress,
          toTokenContractAddress: swapform.toTokenAddress,
          ethereumAddress: this.userAddress,
          chainId: ChainId.MAINNET,
          settings: new UniswapPairSettings({
            slippage: parseFloat(this.slippage)
          })
        })
        return thisPair;
      }
      else {
        var thisPair = new UniswapPair({
          fromTokenContractAddress: swapform.fromTokenAddress,
          toTokenContractAddress: ETH.MAINNET().contractAddress,
          ethereumAddress: this.userAddress,
          chainId: ChainId.MAINNET,
          settings: new UniswapPairSettings({
            slippage: parseFloat(this.slippage)
          })
        })
        return thisPair;
      }
    }
    else {
      var thisPair = new UniswapPair({
        fromTokenContractAddress: swapform.fromTokenAddress,
        toTokenContractAddress: swapform.toTokenAddress,
        ethereumAddress: this.userAddress,
        chainId: ChainId.MAINNET,
        settings: new UniswapPairSettings({
          slippage: parseFloat(this.slippage)
        })
      })
      return thisPair;
    }
  }

  public async getTradeDetails(swapform: any) {

    if(!this.userAddress || this.userAddress == null) {
      return alert('Please connect to a wallet first!');
    }

    var thisPair = this.createPair(swapform);

    try {

      const thisPairFactory = await thisPair.createFactory();
      const trade = await thisPairFactory.trade(swapform.fromamount, TradeDirection.input);
      const quotes = trade.allTriedRoutesQuotes;

      var viableQuotes = await this.getViableQuotes(quotes);

      return {
        viableQuotes: viableQuotes,
        trade: trade
      };

    } catch(e: any) {
      // console.log(e);
      if(e.code == 1) {
        return {
          error: 'noliquidity'
        }
      }
      else
      return;
    }

  }

  async getViableQuotes(quotes: any) {
    var viableQuotes: RouteQuote[] = [];
    await quotes.forEach((quote: any) => {
      if(quote.routePathArray.length == 2) {
        quote.exchangeName = 'Uniswap ' + quote.uniswapVersion;
        viableQuotes.push(quote);
      }
    })
    return viableQuotes;
  }

}
