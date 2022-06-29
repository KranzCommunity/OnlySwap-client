import { Injectable } from '@angular/core';
import { Web3Service } from '../web3.service';
import { ApiService } from '../api.service';
import { HttpClient } from '@angular/common/http';
import { ethers } from "ethers";
import Web3 from 'web3';
import {
  LimitOrderBuilder,
  LimitOrderPredicateBuilder,
  LimitOrderPredicateCallData,
  LimitOrderProtocolFacade,
  Web3ProviderConnector
} from 'limit-order-protocol';
import { rejects } from 'assert';

@Injectable({
  providedIn: 'root'
})

export class LimitorderprotocolService {

  contractAddress: string = '0xF31eF7970D301c1A5bCBb6f21520828c6Fd39Ca1';
  connector: any;
  web3: any = new Web3('wss://mainnet.infura.io/ws/v3/420c1724670d45f684d2b4f5a92c65de');
  public expiry: any;

  constructor(private web3Service: Web3Service, private apiService: ApiService) {
    this.connector = new Web3ProviderConnector(this.web3);
    this.expiry = new Map<string, number>();
    this.expiry.set("10min", {
      title: "10 Minutes",
      seconds: 600
    })
    this.expiry.set("10min", {
      title: "10 Minutes",
      seconds: 600
    })
    this.expiry.set("1hr", {
      title: "1 Hour",
      seconds: 3600
    })
    this.expiry.set("1day", {
      title: "1 Day",
      seconds: 86400
    })
    this.expiry.set("7day", {
      title: "7 Days",
      seconds: 604800
    })
    this.expiry.set("30day", {
      title: "30 Days",
      seconds: 2592000
    })
    this.expiry.set("3month", {
      title: "3 Months",
      seconds: 7776000
    })
    this.expiry.set("6month", {
      title: "6 Months",
      seconds: 15552000
    })
    this.expiry.set("1yr", {
      title: "1 Year",
      seconds: 31104000
    })
    this.expiry.set("custom", {
      title: "Custom",
      seconds: 0
    })
  }

  calculatePredicateFromExpiry(expiry: any, limitOrderProtocolFacade: any) {
    const selectedExpiry = this.expiry.get(expiry);
    const limitOrderPredicateBuilder = new LimitOrderPredicateBuilder(
      limitOrderProtocolFacade
    );
    const {
      timestampBelow
    } = limitOrderPredicateBuilder;
    const simplePredicate: LimitOrderPredicateCallData = (
      timestampBelow(Math.round(Date.now() / 1000) + selectedExpiry.seconds)
    );
    return {
      selectedExpiry: selectedExpiry,
      selectedPredicate: simplePredicate
    }
  }

  async getRemainingOld(orderHash: string, limitOrderProtocolFacade: any) {
    try {
      const remaining: any = limitOrderProtocolFacade.remaining(
        orderHash
      );
      return remaining.toString();
    } catch (error: any) {
      const errorMessage = typeof error === 'string' ? error : error.message;
      if(errorMessage.includes('LOP: Unknown order')) {
        return "orderMakerAmount";
      }
      throw error;
    }
  }

  // async buildLimitOrder(limitForm: any, chainId: any, connector: any) {
    
  //   const limitOrderBuilder = new LimitOrderBuilder(
  //     this.contractAddress,
  //     chainId,
  //     connector
  //   );

  //   let makerAmountFormat = await this.web3Service.toWei(limitForm.fromAmount);
  //   let takerAmountFormat = await this.web3Service.toWei(limitForm.toAmount);

  //   let limitOrder = limitOrderBuilder.buildLimitOrder({
  //     makerAssetAddress: limitForm.fromTokenAddress,
  //     takerAssetAddress: limitForm.toTokenAddress,
  //     makerAddress: this.web3Service.getAccountAddress(),
  //     makerAmount: makerAmountFormat,
  //     takerAmount: takerAmountFormat,
  //     predicate: limitForm.predicate,
  //     // permit: '0x0',
  //     // interaction: '0x0',
  // });
  // }

  async LimitOrderBuilder(chainId: any) {
    return new Promise(async (resolve, reject) => {
      let limitOrderBuilder = new LimitOrderBuilder(
          this.contractAddress,
          chainId,
          this.connector
      );
      resolve(limitOrderBuilder);
    })
  }
  
  async buildLimitOrder(limitOrderBuilder: any, makerToken: any, takerToken: any, userAdd: any, makerAmountFormat: any, takerAmountFormat: any, predicate: any) {
    return new Promise(async (resolve, reject) => {
      let limitOrder = limitOrderBuilder.buildLimitOrder({
          makerAssetAddress: makerToken,
          takerAssetAddress: takerToken,
          makerAddress: userAdd,
          makerAmount: makerAmountFormat,
          takerAmount: takerAmountFormat,
          predicate: predicate,
          // permit: '0x0',
          // interaction: '0x0',
      });
      resolve(limitOrder);
    })
  }
  
  async buildLimitOrderTypedData(limitOrderBuilder: any, limitOrder: any) {
    return new Promise(async (resolve, reject) => {
     let typedData = limitOrderBuilder.buildLimitOrderTypedData(
        limitOrder
      );
      resolve(typedData);
    })
  }
  
  async buildLimitOrderHash(limitOrderBuilder: any, limitOrderTypedData: any) {
    return new Promise(async (resolve, reject) => {
     let orderHash = limitOrderBuilder.buildLimitOrderHash(
      limitOrderTypedData
      );
      resolve(orderHash);
    })
  }
  
  async LimitOrderProtocolFacade() {
    return new Promise(async (resolve, reject) => {
      let limitOrderProtocolFacade = new LimitOrderProtocolFacade(
          this.contractAddress,
          this.connector
      );
      resolve(limitOrderProtocolFacade);
    })
  }
  
  async fillLimitOrder(limitOrderProtocolFacade: any, limitOrder: any, signature: any, makerAmount: any, takerAmount: any, thresholdAmount: any) {
    return new Promise(async (resolve, reject) => {
      let callData = limitOrderProtocolFacade.fillLimitOrder(
          limitOrder,
          signature,
          makerAmount,
          takerAmount,
          thresholdAmount
      );
      resolve(callData);
    })
  }

  async getRemaining(orderHash: string, limitOrderProtocolFacade: any) {
    return new Promise(async (resolve, reject) => {
      const remaining: any = await this.web3Service.getRemainingOrderAmount(
        this.contractAddress,
        orderHash
      );
      resolve(remaining);
    })
  }

  async cancelLimitOrder(limitOrderProtocolFacade: any, order: any) {
    return new Promise(async (resolve, reject) => {
      try {
        const callData = limitOrderProtocolFacade.cancelLimitOrder(order);
        resolve(callData);
      } catch(exc: any) {
        console.log(exc);
        reject(exc);
      }
    })
  }

}
