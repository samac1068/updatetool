import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { StorageService } from './storage.service';
import {catchError} from 'rxjs/operators';
import {Admin} from '../models/Admin.model';
import {ConlogService} from '../modules/conlog/conlog.service';
import {User} from '../models/User.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient, private store: StorageService, private conlog: ConlogService) {
  }

  private getWSPath(): string {
    return this.store.system['webservice']['path'];
  }

  private errorHandler(error: any) {
    let errorMessage: string;
    if (error.error instanceof ErrorEvent) {
      // client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    alert(errorMessage);
    this.conlog.log("ErrorHandler:");
    this.conlog.log(errorMessage);
    return throwError(errorMessage);
  }

  /** Get the user information from the server **/
  getLocalToken(username: string): Observable<string> {
    return this.http.get<string>(`${this.getWSPath()}RequestLocalToken/${this.store.getPassKey()}/${username}`);
  }

  closeTokenSession(): Observable<any> {
    this.conlog.log('closeTokenSession');
    return this.http.get(`${this.getWSPath()}CloseTokenSession/${this.store.user['token']}/${this.store.getUserValue('username')}`);
  }

  getUserSessionInfo() {
    this.conlog.log('GetUserSessionInfo');
    return this.http.get(`${this.getWSPath()}GetUserSessionInfo`);
  }

  validateUserToken(token: string) { //First service called when the application is first executed, unless executed locally
    this.conlog.log('validateUserToken');
    return this.http.get(`${this.getWSPath()}ValidateUserToken/${this.store.getPassKey()}/${token}`)
      .pipe(catchError(this.errorHandler));
  }

  //Second service called to pull in the user's specific information which is required for set up of the individual pages
  getUserInfo() {
    this.conlog.log('getUserInfo');
    return this.http.get(`${this.getWSPath()}GetUserInfo/${this.store.getPassKey()}/${this.store.getUserValue('username')}`)
      .pipe(catchError(this.errorHandler));
  }

  getUserSavedQueries(): Observable<any> {
    this.conlog.log('getUserSavedQueries');
    return this.http.get(`${this.getWSPath()}GetUserSavedQueries/${this.store.getPassKey()}/${this.store.getUserValue('userid')}`)
      .pipe(catchError(this.errorHandler));
  }

  getAppUpdates(): Observable<any> {
    this.conlog.log('getAppUpdates');
    return this.http.get<any[]>(`${this.getWSPath()}GetAppUpdates/${this.store.getPassKey()}`)
      .pipe(catchError(this.errorHandler));
  }

  updateUserVersion(version: string): Observable<any> {
    this.conlog.log('updateUserVersion');
    return this.http.get<any[]>(`${this.getWSPath()}UpdateUserDate/${this.store.getPassKey()}/${this.store.getUserValue('userid')}/${version}`)
      .pipe(catchError(this.errorHandler));
  }

  getTableDBList(server: string, db: string) {
    this.conlog.log('getTableDBList');
    return this.http.get<any[]>(`${this.getWSPath()}GetDbTableList/${this.store.getPassKey()}/${server}/${db}`)
      .pipe(catchError(this.errorHandler));
  }

  getQueryData(server: string, db: string, tbl: string, col: string, where: string, join: string, order: string, cnt: boolean, lmtrow: boolean, speccnt: string, username: string, usedistinct: string) {
    this.conlog.log('getQueryData');
    return this.http.get(`${this.getWSPath()}GetQueryData/${this.store.getPassKey()}/${server}/${db}/${tbl}/${col}/${where}/${join}/${order}/${cnt}/${lmtrow}/${speccnt}/${username}/${usedistinct}`)
      .pipe(catchError(this.errorHandler));
  }

  getTableProperties(server: string, db: string, tbl: string): Observable<any[]> {
    this.conlog.log('getTableProperties');
    return this.http.get<any[]>(`${this.getWSPath()}GetTableProperties/${this.store.getPassKey()}/${server}/${db}/${tbl}`)
      .pipe(catchError(this.errorHandler));
  }

  getStoreProcList(server: string, db: string) {
    this.conlog.log('getStoreProcList');
    return this.http.get<any[]>(`${this.getWSPath()}GetStoreProcList/${this.store.getPassKey()}/${server}/${db}`)
      .pipe(catchError(this.errorHandler));
  }

  getStoredViewList(server: string, db: string) {
    this.conlog.log('getStoredViewList');
    return this.http.get<any[]>(`${this.getWSPath()}GetStoredViewList/${this.store.getPassKey()}/${server}/${db}`)
      .pipe(catchError(this.errorHandler));
  }

  getStoredFunctionsList(server: string, db: string) {
    this.conlog.log('getStoredFunctionList');
    return this.http.get<any[]>(`${this.getWSPath()}GetStoredFunctionsList/${this.store.getPassKey()}/${server}/${db}`)
      .pipe(catchError(this.errorHandler));
  }

  getStoredValues(server: string, db: string, itemname: string) {
    this.conlog.log('getStoredValues');
    return this.http.get<any[]>(`${this.getWSPath()}ReturnStr_StoredValues/${this.store.getPassKey()}/${server}/${db}/${itemname}`)
      .pipe(catchError(this.errorHandler));
  }

  executeQStr(queryid: number) {
    this.conlog.log('executeQStr');
    return this.http.get<any[]>(`${this.getWSPath()}CaptureQStr/${this.store.getPassKey()}/${queryid}`)
      .pipe(catchError(this.errorHandler));
  }

  addEditUpdateUserInfo(user: User) {
    this.conlog.log('addEditUpdateUserInfo');
    let action: string = (user.userid == -9) ? "add" : "edit";
    return this.http.get<any[]>(`${this.getWSPath()}AddEditUpdateUserInfo/${this.store.getPassKey()}/${action}/${user.username}/${user.fname}/${user.lname}/${user.servername}/${user.database}/${user.appdata}/${user.userid}`)
      .pipe(catchError(this.errorHandler));
  }

  //  headleyt:  20210106  added a new parameter, qtype, to be added when the query is created
  storeNewQuery(title: string, body: string, server: string, database: string, userid: string, qtype: string, display: string) {
    this.conlog.log('storeNewQuery');
    return this.http.get<any[]>(`${this.getWSPath()}StoreUserQuery/${this.store.getPassKey()}/${this.store.customURLEncoder(title)}/${this.store.customURLEncoder(body)}/${server}/${database}/${userid}/${qtype}/${this.store.customURLEncoder(display)}`)
      .pipe(catchError(this.errorHandler));
  }

  updateRowInfo(server: string, db: string, table: string, updatekey: string, extwhere: string) {
    this.conlog.log('updateRowInfo');
    return this.http.get<any[]>(`${this.getWSPath()}UpdateRowInfo/${this.store.getPassKey()}/${server}/${db}/${table}/${updatekey}/${extwhere}/${this.store.getUserValue('userid')}`)
      .pipe(catchError(this.errorHandler));
  }

  adminManager(ad: Admin) {
    this.conlog.log("adminManager");
    return this.http.get<any[]>(`${this.getWSPath()}QtAdminManager/${this.store.getPassKey()}/${ad.action}/${this.store.user.username}/${ad.purgedate}/${ad.useridstr}/${ad.userid}/${ad.username}/${ad.firstname}/${ad.lastname}/${ad.network}/${ad.database}/${ad.version}/${ad.isadmin}`)
      .pipe(catchError(this.errorHandler));
  }

  getUserColumnSelection(userid: number) {
    this.conlog.log('getUserColummnSelection');
    return this.http.get<any[]>(`${this.getWSPath()}GetUserColumnSelections/${this.store.getPassKey()}/${userid}`)
      .pipe(catchError(this.errorHandler));
  }

  updateUserColumnSelection(colObj: any) {
    this.conlog.log("updateUserColumnSelection");
    return this.http.get<any[]>(`${this.getWSPath()}UpdateUserColumnSelection/${this.store.getPassKey()}/${this.store.getUserValue('userid')}/${colObj.action}/${colObj.rtype}/${colObj.tablename}/${colObj.columnnames}/${colObj.distinctcol}/${colObj.id}`)
      .pipe(catchError(this.errorHandler));
  }

  clearUserDefinedPK(tablename: string) {
    this.conlog.log("clearUserDefinedPK");
    return this.http.get<any[]>(`${this.getWSPath()}ClearUserDefinedPK/${this.store.getPassKey()}/${this.store.getUserValue('userid')}/${tablename}`)
      .pipe(catchError(this.errorHandler));
  }

  getResetPortalSession(action: string, cutidlist: string) {
    this.conlog.log('getResetPortalSession');
    return this.http.get<any[]>(`${this.getWSPath()}GetResetActivePortalSessions/${this.store.getPassKey()}/${action}/${cutidlist}`)
      .pipe(catchError(this.errorHandler));
  }
}

