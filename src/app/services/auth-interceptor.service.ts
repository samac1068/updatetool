import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEventType } from "@angular/common/http";
import {tap} from "rxjs";
import {ConlogService} from "../modules/conlog/conlog.service";
import {StorageService} from "./storage.service";

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptorService implements HttpInterceptor {

  constructor(private store: StorageService, private conlog: ConlogService) { }
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    // Need to only attached for POST requests
    if(req.method == 'POST') {
      this.conlog.log("Adding Bearer Token");
      const updatedReq: HttpRequest<any> = req.clone({
        params: req.params.append('Authorization', this.store.getBearerToken())
      });
      return next.handle(updatedReq);
    } else
      return next.handle(req);
  }
}
