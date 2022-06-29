import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { HttpClient } from '@angular/common/http';
import { ethers } from "ethers";
import erc20ABI from '../../assets/abi-erc20.json';
import { LIMIT_ORDER_PROTOCOL_ABI } from "limit-order-protocol";

declare var window: any;

@Injectable({
  providedIn: "root",
})
export class Web3Service {
  private provider: any;
  private accounts: any;
  private limitOrderContractAddress = '0xF31eF7970D301c1A5bCBb6f21520828c6Fd39Ca1';
  private etherScanApiKey = "S18W6HNUCX2MWVHU3BEVU8RG7UF2GSTD3P";
  private bscScanApiKey = "S18W6HNUCX2MWVHU3BEVU8RG7UF2GSTD3P";
  private enableMetamask: any;
  private changedByUser = false;
  web3Modal: any;

  private accountStatusSource = new Subject<any>();
  accountStatus$ = this.accountStatusSource.asObservable();
  
  private userAccount = new BehaviorSubject<any>("");
  public userAccountBalance = new BehaviorSubject<any>("");
  public network = new BehaviorSubject<any>("");
  userBalance: any;
  private networkAvailable: any;

  public minABI = [  
    {    
      constant: true,
      inputs: [{ name: "_owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "balance", type: "uint256" }],
      type: "function",
    },
  
  ];

  setAccount(value: any) {
    this.userAccount.next(value);
  }

  getAccount() {
    return this.userAccount.asObservable();
  }

  setNetwork(network: any) {
    this.network.next(network);
  }

  getNetwork() {
    return this.network.asObservable();
  }

  getAccountAddress() {
    return this.userAccount.getValue();
  }

  setUserBalance(value: any) {
    this.userAccountBalance.next(value);
  }

  getUserBalance() {
    return this.userAccountBalance.asObservable();
  }

  constructor(private http: HttpClient) {
    try {
      window.ethereum.on('chainChanged', (chainId: any) => {
        if(this.changedByUser == true)
          localStorage.setItem('changedByUser', 'true');
        window.location.reload();
      })
      window.ethereum.on('accountsChanged', (chainId: any) => {
        if(this.changedByUser == true)
          localStorage.setItem('changedByUser', 'true');
        window.location.reload();
      })
    } catch(exc: any) {
      if(exc.name == 'TypeError') {
        this.networkAvailable = false;
      }
    }
  }

  async getAccountNetwork() {
    try {
      const currentProvider = new ethers.providers.Web3Provider(window.ethereum, "any");
      const network = await currentProvider.getNetwork();
      this.setNetwork(network);
      return network;
    } catch(exc: any) {
      return -1;
    }
  }

  async connectAccount() {
    try {
      this.enableMetamask = await window.ethereum.enable();
      let currentProvider = new window._ethers.providers.Web3Provider(window.ethereum, "any");
      this.accounts = await window.ethereum.request({ method: 'eth_accounts' });
      this.accountStatusSource.next(this.accounts);
      this.setNetwork(await currentProvider.getNetwork());
      this.setAccount(this.accounts[0]);
      let userBalance = await currentProvider.getBalance(this.getAccountAddress());
      this.userBalance = parseFloat(window._ethers.utils.formatUnits(userBalance, "ether")).toFixed(4);
      this.userAccountBalance.next(this.userBalance);
      this.setUserBalance(this.userBalance);
      return 0;
    } catch(exc: any) {
      return -1;
    }
  }

  async changeNetwork(chainId: any) {
    try {
      var networkInHash = window._ethers.utils.hexlify(chainId);
      if(networkInHash == '0x01')
        networkInHash = '0x1';
      const networkChanged = await window.ethereum.request({ method: 'wallet_switchEthereumChain', params:[{chainId: networkInHash}]});
      if(networkChanged == null) {
        this.changedByUser = true;
        return true;
      }
      else
        return false;
    } catch(exc: any) {
      if(exc.code == 4902) {
        const params = {
          chainId: networkInHash,
          chainName: 'Smart Chain',
          nativeCurrency: {
            symbol: 'BNB',
            decimals: 18
          },
          rpcUrls: ['https://bsc-dataseed.binance.org/'],
          blockExplorerUrls: ['https://bscscan.com']
        }
        const networkAdded = await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [params]});
        if(networkAdded == null) {
          this.changedByUser = true;
          return true;
        }
        else
          return false;
      }
      return false;
    }
  }

  async getEthBalance() {
    return new Promise(async (resolve, reject) => {
      let currentProvider = new window._ethers.providers.Web3Provider(window.ethereum, "any");
      let result = await currentProvider.getBalance(this.getAccountAddress());
      let userBalance = parseFloat(window._ethers.utils.formatUnits(result, "ether")).toFixed(4);
      this.setUserBalance(userBalance);
      return resolve(userBalance);
    })
  }

  async getERC20Balance(tokenAddress: any) {
    return new Promise(async (resolve, reject) => {
      let currentProvider = new ethers.providers.Web3Provider(window.ethereum, "any");
      const contract = new ethers.Contract(tokenAddress, erc20ABI, currentProvider);
      const balance = ethers.utils.formatUnits(await contract.balanceOf(this.getAccountAddress()));
      return resolve(parseFloat(balance).toFixed(4));
    })
  }

  async checkAllowance(tokenAddress: any, userAddress: any, contractAddress: any) {
    return new Promise(async (resolve, reject) => {
      try {
        let currentProvider = new ethers.providers.Web3Provider(window.ethereum, "any");
        const contract = new ethers.Contract(tokenAddress, erc20ABI, currentProvider);
        let allowance = await contract.allowance(userAddress, contractAddress);
        resolve(this.toWei(allowance.toString()));
      } catch(exc: any) {
        // console.log(exc);
        reject(exc);
      }
    })
  }

  async addAllowance(transaction: any) {
    return new Promise(async (resolve, reject) => {
      try {
        const transactionParameters = {
          to: transaction.to,
          from: transaction.from,
          value: transaction.value,
          data: transaction.data
        };
        let currentProvider = new ethers.providers.Web3Provider(window.ethereum, "any");
        const signer = currentProvider.getSigner();
        const txResponse = await signer.sendTransaction(transactionParameters);
        const confirmation = await txResponse.wait();
        return resolve(confirmation);
      } catch(exc: any) {
        // console.log(exc);
        reject(exc);
      }
    })
  }

  async startEth() {
    // console.log(window.ethereum);
    // console.log(window.web3);

    if (!window.ethereum || !window.web3) {
    } else {
      try {
        this.enableMetamask = await window.ethereum.enable();
      } catch (e) {}
    }
  }

  getEthGasEstimate() {
    // return this.http.get('https://ethgasstation.info/api/ethgasAPI.json?api-key=5b1ee16cff92091c8970c12a4704d6464a685a73d58dc5dab6ab1400661b') as any;

    return this.http.get('https://owlracle.info/eth/gas?apikey=ee9a3ecd8d7647fdaf55be185b018ba6&accept=35,60,90') as any;
  }

  getBSCGasEstimate() {
    // return this.http.get('https://bscgas.info/gas?apikey=8365e68384084528a052b71f9ddc4c1a');

    return this.http.get('https://owlracle.info/bsc/gas?apikey=ee9a3ecd8d7647fdaf55be185b018ba6&accept=35,60,90') as any;
  }

  async sendTransaction(transaction: any) {

    return new Promise(async(resolve, reject) => {
      try {
        let currentProvider = new ethers.providers.Web3Provider(window.ethereum, "any");
        const network = await currentProvider.getNetwork();
        if(currentProvider.network.chainId == 1) {
          this.getEthGasEstimate()
          .subscribe(async (response: any) => {
            // console.log(response);
            currentProvider.getBlock("latest")
              .then(async(latestBlock: any) => {
                var gasMethod: any;
                if(localStorage.getItem('gasMethodETH') != null && localStorage.getItem('gasMethodETH') != undefined) {
                  gasMethod = localStorage.getItem('gasMethodETH');
                }
                else {
                  let gasPrice = await currentProvider.getGasPrice();
                  gasMethod = window._ethers.utils.formatUnits(gasPrice, "gwei");
                }
                let gasPrice = parseFloat(gasMethod.toString()) * 1000000000;

                let txnFee: any = (21000 * 7 * 10)/1000000000;
                
                let userBalance = await currentProvider.getBalance(this.getAccountAddress());
                this.userBalance = parseFloat(window._ethers.utils.formatUnits(userBalance, "ether")).toFixed(4);
                
                let totalTxnAmount = parseFloat(txnFee) + parseFloat(window._ethers.utils.formatUnits(transaction.value, "ether"));
                // console.log("totalTxnAmount ",totalTxnAmount);
                if(this.userBalance >= totalTxnAmount) {
                  const transactionParameters = {
                    to: transaction.to,
                    from: transaction.from,
                    value: transaction.value,
                    data: transaction.data,
                    // gasPrice: String((response.avgGas/10) * 1000000)
                    gasPrice: ethers.BigNumber.from(gasPrice.toString())
                  };
                  // console.log("transactionParameters ",transactionParameters);
                  // const txHash = await window.ethereum.request({
                  //   method: 'eth_sendTransaction',
                  //   params: [transactionParameters],
                  // });

                  let currentProvider = new ethers.providers.Web3Provider(window.ethereum, "any");
                  const signer = currentProvider.getSigner();
                  const txResponse = await signer.sendTransaction(transactionParameters);
                  const confirmation = await txResponse.wait();
                  return resolve(confirmation.transactionHash);
                } else {
                  return resolve('lowbal');
                }
              })
            
            
          })
        } else if(currentProvider.network.chainId == 56) {
          this.getBSCGasEstimate()
          .subscribe(async (response: any) => {
            // console.log(response);
            currentProvider.getBlock("latest")
              .then(async(latestBlock: any) => {
                var gasMethod: any;
                if(localStorage.getItem('gasMethodBSC') != null && localStorage.getItem('gasMethodBSC') != undefined) {
                  gasMethod = localStorage.getItem('gasMethodBSC');
                }
                else {
                  let gasPrice = await currentProvider.getGasPrice();
                  gasMethod = window._ethers.utils.formatUnits(gasPrice, "gwei");
                }
                let gasPrice = parseFloat(gasMethod.toString()) * 1000000000;

                let txnFee: any = (21000 * 7 * 10)/1000000000;
                
                let userBalance = await currentProvider.getBalance(this.getAccountAddress());
                this.userBalance = parseFloat(window._ethers.utils.formatUnits(userBalance, "ether")).toFixed(4);
                
                let totalTxnAmount = parseFloat(txnFee) + parseFloat(window._ethers.utils.formatUnits(transaction.value, "ether"));
                // console.log("totalTxnAmount ",totalTxnAmount);
                if(this.userBalance >= totalTxnAmount) {
                  const transactionParameters = {
                    to: transaction.to,
                    from: transaction.from,
                    value: transaction.value,
                    data: transaction.data,
                    gasPrice: ethers.BigNumber.from(gasPrice.toString())
                  };

                  // const txHash = await window.ethereum.request({
                  //   method: 'eth_sendTransaction',
                  //   params: [transactionParameters],
                  // });
            
                  // return resolve(txHash);
                  let currentProvider = new ethers.providers.Web3Provider(window.ethereum, "any");
                  const signer = currentProvider.getSigner();
                  signer.sendTransaction(transactionParameters)
                  .then(async (txResponse) => {
                    const confirmation = await txResponse.wait();
                    return resolve(confirmation.transactionHash);
                  })
                  .catch((exc: any) => {
                    return reject('rejected');
                  })
                } else {
                  return reject('lowbal');
                }
              })
            
            
          })
        }
  
      } catch(exc) {
        return reject('rejected');
        // alert('Transaction was rejected by user!');
      }
    })
  }

  async getMaxOfBalance() {
    return new Promise(async(resolve, reject) => {
      try {
        let currentProvider = new window._ethers.providers.Web3Provider(window.ethereum, "any");
        let txnFee: any = (21000 * 7 * 10)/1000000000;
        let userBalance = await currentProvider.getBalance(this.getAccountAddress());
        this.userBalance = parseFloat(window._ethers.utils.formatUnits(userBalance, "ether")).toFixed(4);
        
        let maxAvailable = this.userBalance - txnFee;
        return resolve(maxAvailable);
      } catch(exc) {
        // console.log(exc);
        return reject('rejected');
      }
    })
  }

  buildLimitOrder(makerAssetAddress: any, takerAssetAddress: any, userAddress: any, makerAmount: any, takerAmount: any, chainId: any): Observable<any> {

      const limitOrderParams = {
        makerAssetAddress: makerAssetAddress,
        takerAssetAddress: takerAssetAddress,
        walletAddress: userAddress,
        makerAmount: makerAmount.toString(),
        takerAmount: takerAmount.toString(),
        chainId: chainId
      }

      return this.http.post<any>('http://64.225.4.69:3000/users/limit-order', limitOrderParams);
  }

  async signLimitOrder(account: any, chainId: any, trade_id: any,dataToSign: any) {
    return new Promise(async(resolve, reject) => {
      try {
      // try {
        var from = account;
        var params = [from, dataToSign];
        var method = 'eth_signTypedData_v4';
        // console.log("from ",from)
        // console.log("params ",params)
        
        // console.log('connected: ' + account);
        const msgParams = JSON.stringify({
            domain: {
                chainId: chainId,
                name: 'Only-Swap',
                verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
                version: '1',
            },
            // Defining the message signing data content.
            message: {
                /*
                - Anything you want. Just a JSON Blob that encodes the data you want to send
                - No required fields
                - This is DApp Specific
                - Be as explicit as possible when building out the message schema.
                */
                
                  salt: dataToSign.salt,
                  makerAsset: dataToSign.makerAsset,
                  takerAsset: dataToSign.takerAsset,
                  makerAssetData: dataToSign.makerAssetData,
                  takerAssetData: dataToSign.takerAssetData,
                  getMakerAmount: dataToSign.getMakerAmount,
                  getTakerAmount: dataToSign.getTakerAmount,
                  predicate: dataToSign.predicate,
                  permit: dataToSign.permit,
                  interaction: dataToSign.interaction,
                  trade_id: trade_id
            },
            primaryType: "Trade",
            types: {
                EIP712Domain: [{
                        name: "name",
                        type: "string"
                    },
                    {
                        name: "version",
                        type: "string"
                    },
                    {
                        name: "chainId",
                        type: "uint256"
                    },
                    {
                        name: "verifyingContract",
                        type: "address"
                    }
                ],
                Trade: [{
                    name: "trade_id",
                    type: "string"
                }, ]
            }
        });
        window.ethereum.request({
            method: 'eth_signTypedData_v4',
            params: [account, msgParams]
        }).then((signed: any) => {
            // console.log(signed);
            return resolve({status:1,data:signed});
        }).catch((e: any) => {
          return reject({status:0})
        });
      } catch(exc) {
        // console.log(exc);
        return reject('rejected');
        // alert('Transaction was rejected by user!');
      }
    })
  }


  searchTokenEtherscan(address: string, network: any) {
    if(network == 56) {
      return this.http.get('https://api.bscscan.io/api?module=contract&action=getabi&address='+address+'&apikey='+this.bscScanApiKey) as any;
    } else {
      return this.http.get('https://api.etherscan.io/api?module=contract&action=getabi&address='+address+'&apikey='+this.etherScanApiKey) as any;
    }
  }

  async importToken(tokenAddress: string, tokenSymbol: string, tokenDecimals: number, tokenImage: string) {
    return new Promise(async(resolve, reject) => {
      try {
        const wasAdded = await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20', // Initially only supports ERC20, but eventually more!
            options: {
              address: tokenAddress, // The address that the token is at.
              symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
              decimals: tokenDecimals, // The number of decimals in the token
              image: tokenImage, // A string url of the token logo
            },
          },
        });
        // console.log("web3Service importToken ",wasAdded)
        resolve(wasAdded);
      } catch(exc) {
        // console.log(exc);
        return reject('rejected');
      }
    })
  }

  async getContractDetails(address: string) {
    return new Promise(async(resolve, reject) => {
      try {
        // var agiContract = new web3.eth.Contract(abi,address);
        // let name =agiContract.methods.name();
        let currentProvider = new window._ethers.providers.Web3Provider(window.ethereum, "any");
        const contract = new window._ethers.Contract(address, erc20ABI, currentProvider);
        // console.log("contract ",contract)
        const name = await contract.name();
        const decimals = await contract.decimals();
        const symbol = await contract.symbol();
        resolve({name:name,decimals:decimals,symbol:symbol});
      } catch(exc) {
        // console.log(exc);
        // alert("Connect Metamask");
        return reject('rejected');
      }
    })
  }

  async sendApproval(abi: any, address: string) {
    return new Promise(async(resolve, reject) => {
      try {
        // var agiContract = new web3.eth.Contract(abi,address);
        // let name =agiContract.methods.name();
        let currentProvider = new window._ethers.providers.Web3Provider(window.ethereum, "any");
        const contract = new window._ethers.Contract(address, erc20ABI, currentProvider);
        // // console.log("contract ",contract)
        const name = await contract.methods.approve();
        const decimals = await contract.methods.decimals();
        const symbol = await contract.methods.symbol();
        resolve({name:name,decimals:decimals,symbol:symbol});
      } catch(exc) {
        // console.log(exc);
        // alert("Connect Metamask");
        return reject('rejected');
      }
    })
  }

  async checkIsAddress(address: string) {
    return window._ethers.utils.isAddress(address);
  }

  async toWei(amount: string) {
    let wei = window._ethers.utils.parseEther(amount);
    return wei.toString(10);
  }

  async signLimitOrderNew(typedData: any,account: any) {
    return new Promise(async(resolve, reject) => {
      try {
        // console.log("typedData ",typedData)
        // console.log("account ",account)
        var typeDataString = JSON.stringify(typedData);
        
        window.ethereum.request({
            method: 'eth_signTypedData_v4',
            params: [account, typeDataString]
        }).then((signed: any) => {
            // console.log("sign ",signed);

            
            // // console.log("eth-sign-hash ","0x" + TypedDataUtils.sign(msgParams).toString('hex'))
            return resolve({status:1,data:signed});
        }).catch((e: any) => {
          return reject({status:0})
        });


      } catch(exc) {
        // console.log(exc);
        return reject(exc);
        // alert('Transaction was rejected by user!');
      }
    })
  }

  async getRemainingOrderAmount(contractAddress: any, orderHash: any) {
    return new Promise(async (resolve, reject) => {
      try {
        let currentProvider = new ethers.providers.Web3Provider(window.ethereum, "any");
        const contract = new ethers.Contract(contractAddress, LIMIT_ORDER_PROTOCOL_ABI, currentProvider);
        const balance = await contract.remaining(orderHash);
        return resolve((this.formatUnits(balance.toString(), 18)));
      } catch(exc: any) {
        return reject("NA");
      }
    })
  }

  async getBlockNumber() {
    let currentProvider = new window._ethers.providers.Web3Provider(window.ethereum, "any");
    return await currentProvider.getBlockNumber();
  }

  async checkBalance() {
    try {
      let currentProvider = new window._ethers.providers.Web3Provider(window.ethereum, "any");
      let userBalance = await currentProvider.getBalance(this.getAccountAddress());
      this.userBalance = parseFloat(window._ethers.utils.formatUnits(userBalance, "ether")).toFixed(4);
      this.setUserBalance(this.userBalance);
      return 0;
    } catch(exc: any) {
      return -1;
    }
  }

  async fillLimitOrder(userAdd: any, contractAddress: any, callData: any) {
    return new Promise(async (resolve, reject) => {
      try {
        const transactionParameters = {
          from: userAdd,
          // gas: 210_000, // Set your gas limit
          // gasPrice: 40000, // Set your gas price
          to: contractAddress,
          data: callData,
        };
        let currentProvider = new ethers.providers.Web3Provider(window.ethereum, "any");
        const signer = currentProvider.getSigner();
        const txResponse = await signer.sendTransaction(transactionParameters);
        const confirmation = await txResponse.wait();
        return resolve(confirmation);
      } catch(exc: any) {
        console.log(exc);
        reject(exc);
      }
    })
  }
  
  async cancelLimitOrder(userAdd: any, contractAddress: any, callData: any) {
    return new Promise(async (resolve, reject) => {
      try {
        const transactionParameters = {
          from: userAdd,
          // gas: 210_000, // Set your gas limit
          // gasPrice: 40000, // Set your gas price
          to: contractAddress,
          data: callData,
        };
        let currentProvider = new ethers.providers.Web3Provider(window.ethereum, "any");
        const signer = currentProvider.getSigner();
        const txResponse = await signer.sendTransaction(transactionParameters);
        const confirmation = await txResponse.wait();
        return resolve(confirmation);
      } catch(exc: any) {
        console.log(exc);
        reject(exc);
      }
    })
  }

  convertToBigNumber(amount: any) {
    return ethers.BigNumber.from(amount.toString())
  }

  formatUnits(amount: any, decimals: any) {
    return ethers.utils.formatUnits(amount, decimals);
  }

  async approveAllowance(userAddress: any, tokenAddress: any, contractAddress: any, amount: any) {
    return new Promise(async (resolve, reject) => {
      try {
        let currentProvider = new ethers.providers.Web3Provider(window.ethereum, "any");
        const signer = currentProvider.getSigner();
        const contract = new ethers.Contract(tokenAddress, erc20ABI, signer);
        let tokenDecimals = await contract.decimals();
        let approvalResponse = await contract.approve(contractAddress, ethers.utils.parseUnits(amount.toString(), tokenDecimals));
        let approvalConfirmation = await approvalResponse.wait();
        resolve(approvalConfirmation);
      } catch(exc: any) {
        console.log(exc);
        reject(exc);
      }
    })
  }

}
