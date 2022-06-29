import { Injectable } from '@angular/core';
import { Web3Service } from '../../services/web3.service';
import { PancakeswapPair, PancakeswapPairSettings, BNB, RouteQuote } from 'simple-pancakeswap-sdk-with-multicall-fix';

@Injectable({
  providedIn: 'root'
})
export class pancakeswapService {

  userAddress: any;
  slippage: any = 0.01;

  constructor(web3Service: Web3Service) { 
    web3Service.getAccount().subscribe(userAddress => {
      this.userAddress = userAddress;
    });
  }

  public createPair(swapform: any) {

    if(swapform.fromtoken == 'BNB' || swapform.totoken == 'BNB') {

      if(swapform.fromtoken == 'BNB' && swapform.totoken == 'BNB') {
        var thisPair = new PancakeswapPair({
          fromTokenContractAddress: BNB.token().contractAddress,
          toTokenContractAddress: BNB.token().contractAddress,
          ethereumAddress: this.userAddress,
          settings: new PancakeswapPairSettings({
            slippage: parseFloat(this.slippage)
          })
        })
        return thisPair;
      }

      if(swapform.fromtoken == 'BNB') {
        var thisPair = new PancakeswapPair({
          fromTokenContractAddress: BNB.token().contractAddress,
          toTokenContractAddress: swapform.toTokenAddress,
          ethereumAddress: this.userAddress,
          settings: new PancakeswapPairSettings({
            slippage: parseFloat(this.slippage)
          })
        })
        return thisPair;
      }
      else {
        var thisPair = new PancakeswapPair({
          fromTokenContractAddress: swapform.fromTokenAddress,
          toTokenContractAddress: BNB.token().contractAddress,
          ethereumAddress: this.userAddress,
          settings: new PancakeswapPairSettings({
            slippage: parseFloat(this.slippage)
          })
        })
        return thisPair;
      }
    }
    else {
      var thisPair = new PancakeswapPair({
        fromTokenContractAddress: swapform.fromTokenAddress,
        toTokenContractAddress: swapform.toTokenAddress,
        ethereumAddress: this.userAddress,
        settings: new PancakeswapPairSettings({
          slippage: parseFloat(this.slippage)
        })
      })
      return thisPair;
    }
  }

  public async getTradeDetails(swapform: any) {

    try {

      var thisPair = this.createPair(swapform);
      const thisPairFactory = await thisPair.createFactory();
      const tradeQuote = await thisPairFactory.findAllPossibleRoutesWithQuote(swapform.fromamount);
      const trade = await thisPairFactory.trade(swapform.fromamount);
      const quotes = trade.allTriedRoutesQuotes;

      var viableQuotes = await this.getViableQuotes(quotes);

      return {
        viableQuotes: viableQuotes,
        trade: trade
      };

    } catch(exc: any) {
      if(exc.code == 1 || exc.code == "CALL_EXCEPTION") {
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
        quote.exchangeName = 'Pancakeswap';
        viableQuotes.push(quote);
      }
    })
    return viableQuotes;
  }


}
