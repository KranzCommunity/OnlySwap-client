import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from '../../environments/environment';
declare var window: any;
import { Router } from '@angular/router';
@Injectable({
	providedIn: "root",
})
export class ApiService {
	baseUrl: string = environment.apiUrl;
	apiUrl: string = "http://64.225.4.69:3000";
	oneInchApiUrl: string = "https://limit-orders.1inch.exchange";
	private _simpleSwapFormData: any;

	passwordChecked = new BehaviorSubject(false);
	getPasswordChecked = this.passwordChecked.asObservable();

	constructor(private http: HttpClient, private router:Router) {
		// try {
		// 	this.web3js = window.web3;
		// 	this.setNetwork(this.web3js.currentProvider.networkVersion);
		// 	window.ethereum.on('chainChanged', (chainId: any) => {
		// 		if(this.changedByUser == true)
		// 			localStorage.setItem('changedByUser', 'true');
		// 		window.location.reload();
		// 	})
		// } catch(exc: any) {
		// 	if(exc.name == 'TypeError') {
		// 		this.networkAvailable = false;
		// 	}
		// }
	}

	errorHandling(HttpErrorResponse: any) {
		// // console.log("HttpErrorResponse ",HttpErrorResponse.statusText)
		if(HttpErrorResponse.statusText == "Unauthorized") {
			// this.logout();
		} else {
			if(HttpErrorResponse.error) {
				// this.showToast({msg:HttpErrorResponse.error.data.message});
			} else {
				// this.showToast({msg:HttpErrorResponse.statusText});
			}
		}
	}

	getToken() {
		return localStorage.getItem("token");
	}

	limitOrderApi(data: any) {
		let headers = new HttpHeaders({
			'Authorization': 'jwt '+this.getToken()
		})
		return this.http.post(this.baseUrl+'/users/limit-order', data, {headers});
	}

	matchingLimitOrderApi(data: any) {
		let headers = new HttpHeaders({
			'Authorization': 'jwt '+this.getToken()
		})
		return this.http.post(this.baseUrl+'/users/match-limit-order', data, {headers});
	}

	limitOrderSignatureApi(data: any) {
		let headers = new HttpHeaders({
			'Authorization': 'jwt '+this.getToken()
		})
		return this.http.post(this.baseUrl+'/users/limit-order-signature', data, {headers});
	}
	
	expirySave(data: any) {
		let headers = new HttpHeaders({
			'Authorization': 'jwt '+this.getToken()
		})
		return this.http.post(this.baseUrl+'/users/test-expiry', data, {headers});
	}

	getChartApi(data: any) {
		let headers = new HttpHeaders({
			'Authorization': 'jwt '+this.getToken()
		})
		return this.http.post(this.baseUrl+'/users/chart/'+data.from_token+"/"+data.to_token+"/"+data.tf, data, {headers});
	}

	verifyPasswordApi(data: any) {
		let headers = new HttpHeaders({
			'Authorization': 'jwt '+this.getToken()
		})
		return this.http.post(this.baseUrl+'/users/verify-password', data, {headers});
	}

	userOrdersApi(data: any) {
		let headers = new HttpHeaders({
			'Authorization': 'jwt '+this.getToken()
		})
		return this.http.post(this.baseUrl+'/users/orders', data, {headers});
	}

	orderCancelApi(data: any) {
		let headers = new HttpHeaders({
			'Authorization': 'jwt '+this.getToken()
		})
		return this.http.post(this.baseUrl+'/users/order-cancel', data, {headers});
	}

	get simpleSwapFormData(): any {
        return this._simpleSwapFormData;
    }
    set simpleSwapFormData(data: any) {
        this._simpleSwapFormData = data;
    }

    oneInchLimitOrderApi(data: any) {
		let headers = new HttpHeaders({
			// 'Authorization': 'jwt '+this.getToken()
		})
		return this.http.post(this.oneInchApiUrl+'/v2.0/1/limit-order', data, {headers});
	}

	componentTokenCheck() {
		let token = localStorage.getItem("appToken");
		if(token) {
			return this.verifyPasswordApi({password:token}).subscribe((res : any)=>{
		      if(res.status) {
		        this.passwordChecked.next(true)
				return true;
		      } else {
		        this.passwordChecked.next(false)
		        localStorage.removeItem("appToken");
		        this.router.navigateByUrl("/password")
				return false;
		      }
		    },(HttpErrorResponse: any) => {
		    	this.passwordChecked.next(false)
		    	this.router.navigateByUrl("/password")
				return false;
		    });
		} else {
			this.passwordChecked.next(false)
			this.router.navigateByUrl("/password")
			return false;
		}
	}
}