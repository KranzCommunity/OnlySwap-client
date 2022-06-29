import { Component, OnChanges, OnInit, Inject, SimpleChanges, TemplateRef, ViewChild, Renderer2 } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subscription, timer } from 'rxjs';
import { NgxSpinnerService } from "ngx-spinner";
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Web3Service } from '../../services/web3.service';
import { ApiService } from '../../services/api.service';

import { Router } from '@angular/router';
declare var window: any;
@Component({
  selector: 'app-password',
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.scss']
})
export class PasswordComponent implements OnInit {
  @ViewChild("walletConnect") private walletConnectModal!: TemplateRef<any>;
  passwordForm: any = {
    password:""
  };
  modalRef: any;
  modalHeader = '';
  modalBody = '';
  constructor(private router:Router,private http: HttpClient, private web3Service: Web3Service, private spinner: NgxSpinnerService, private modalService: BsModalService, private apiService: ApiService) { 
    let isToken = this.apiService.componentTokenCheck();
    if(isToken) {
      this.verifyToken();
    }
  }

  ngOnInit(): void {

  

  }

  ngAfterViewInit() {
    
  }

  // showPasswordPopup() {
  //   // console.log("showPasswordPopup ")
  //   let isToken = this.apiService.componentTokenCheck();
  //   // console.log("isToken ",isToken)
  //   if(!isToken) {
  //     this.passwordModalRef = this.modalService.show(this.passwordPopup, {
  //       class: 'modal-dialog-centered accept-popup',
  //       backdrop : 'static',
  //       keyboard : false
  //     });
  //   } else {
  //     this.verifyToken();
  //   }
  // }

  openModal(header: any, body: any) {
    this.modalHeader = header;
    this.modalBody = body;
    this.modalRef = this.modalService.show(this.walletConnectModal, {
      class: 'modal-dialog-centered accept-popup' 
    });
  }

  verifyToken() {
    // console.log("verifyToken")
    let token = localStorage.getItem("appToken");
    this.apiService.verifyPasswordApi({password:token}).subscribe((res : any)=>{
      // console.log("res ",res)
      if(res.status) {
        this.router.navigateByUrl("/simpleswap")
        // window.location.reload();
      } else {
        this.openModal('Fail', 'Token expired');
        localStorage.removeItem("appToken");
      }
    },(HttpErrorResponse) => {
    });
  }

  passwordCheck() {
    // console.log("this.passwordForm ",this.passwordForm)
    this.apiService.verifyPasswordApi(this.passwordForm).subscribe((res : any)=>{
      // console.log("res ",res)
      if(res.status) {
        localStorage.setItem("appToken", this.passwordForm.password)
        // this.router.navigateByUrl("/")
        this.router.navigateByUrl("/simpleswap")
        this.apiService.componentTokenCheck();
      } else {
        this.openModal('Failed to load', 'Invalid Password!');
      }
    },(HttpErrorResponse) => {
      // this.apiService.errorHandling(HttpErrorResponse);
    });
  }


}
