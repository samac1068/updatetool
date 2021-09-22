import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { StorageService } from './storage.service';
import {catchError} from 'rxjs/operators';
import {Admin} from '../models/Admin.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient, private store: StorageService) {
  }

  private getWSPath(): string {
    return this.store.system['webservice']['path'];
  }

  private static errorHandler(error) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    alert(errorMessage);
    console.log(errorMessage);
    return throwError(errorMessage);
  }

  /** Get the user information from the server **/
  getLocalToken(username: string): Observable<string> {
    return this.http.get<string>(`${this.getWSPath()}RequestLocalToken/${this.store.getPassKey()}/${username}`);
  }

  closeTokenSession(): Observable<any> {
    console.log('closeTokenSession');
    return this.http.get(`${this.getWSPath()}CloseTokenSession/${this.store.user['token']}/${this.store.getUserValue('username')}`);
  }

  getUserSessionInfo() {
    console.log('GetUserSessionInfo');
    return this.http.get(`${this.getWSPath()}GetUserSessionInfo`);
  }

  validateUserToken(token: string) { //First service called when the application is first executed, unless executed locally
    console.log('validateUserToken');
    return this.http.get(`${this.getWSPath()}ValidateUserToken/${this.store.getPassKey()}/${token}`);
  }

  //Second service called to pull in the user's specific information which is required for set up of the individual pages
  getUserInfo() {
    console.log('getUserInfo');
    return this.http.get(`${this.getWSPath()}GetUserInfo/${this.store.getPassKey()}/${this.store.getUserValue('username')}`);
  }

  getUserSavedQueries(): Observable<any> {
    console.log('getUserSavedQueries');
    return this.http.get(`${this.getWSPath()}GetUserSavedQueries/${this.store.getPassKey()}/${this.store.getUserValue('userid')}`);
  }

  getAppUpdates(): Observable<any> {
    console.log('getAppUpdates');
    return this.http.get<any[]>(`${this.getWSPath()}GetAppUpdates/${this.store.getPassKey()}`);
  }

  updateUserVersion(version: string): Observable<any> {
    console.log('updateUserVersion');
    return this.http.get<any[]>(`${this.getWSPath()}UpdateUserDate/${this.store.getPassKey()}/${this.store.getUserValue('userid')}/${version}`);
  }

  getTableDBList(server: string, db: string) {
    console.log('getTableDBList');
    return this.http.get<any[]>(`${this.getWSPath()}GetDbTableList/${this.store.getPassKey()}/${server}/${db}`)
      .pipe(catchError(DataService.errorHandler));
  }

  getQueryData(server: string, db: string, tbl: string, col: string, where: string, join: string, order: string, cnt: boolean, lmtrow: boolean, speccnt: string, username: string) {
    console.log('getQueryData');
    return this.http.get(`${this.getWSPath()}GetQueryData/${this.store.getPassKey()}/${server}/${db}/${tbl}/${col}/${where}/${join}/${order}/${cnt}/${lmtrow}/${speccnt}/${username}`);
  }

  getTableProperties(server: string, db: string, tbl: string): Observable<any[]> {
    console.log('getTableProperties');
    return this.http.get<any[]>(`${this.getWSPath()}GetTableProperties/${this.store.getPassKey()}/${server}/${db}/${tbl}`)
      .pipe(catchError(DataService.errorHandler));
  }

  getStoreProcList(server: string, db: string) {
    console.log('getStoreProcList');
    return this.http.get<any[]>(`${this.getWSPath()}GetStoreProcList/${this.store.getPassKey()}/${server}/${db}`);
  }

  getStoredViewList(server: string, db: string) {
    console.log('getStoredViewList');
    return this.http.get<any[]>(`${this.getWSPath()}GetStoredViewList/${this.store.getPassKey()}/${server}/${db}`);
  }

  getStoredFunctionsList(server: string, db: string) {
    console.log('getStoredFunctionList');
    return this.http.get<any[]>(`${this.getWSPath()}GetStoredFunctionsList/${this.store.getPassKey()}/${server}/${db}`);
  }

  getStoredValues(server: string, db: string, itemname: string) {
    console.log('getStoredValues');
    return this.http.get<any[]>(`${this.getWSPath()}ReturnStr_StoredValues/${this.store.getPassKey()}/${server}/${db}/${itemname}`);
  }

  executeQStr(queryid: number) {
    console.log('executeQStr');
    return this.http.get<any[]>(`${this.getWSPath()}CaptureQStr/${this.store.getPassKey()}/${queryid}`);
  }

  addEditUpdateUserInfo(username: string, firstname: string, lastname: string, network: string, userid: number) {
    console.log('addEditUpdateUserInfo');
    var action: string = (userid == -9) ? "add" : "edit";
    return this.http.get<any[]>(`${this.getWSPath()}AddEditUpdateUserInfo/${this.store.getPassKey()}/${action}/${username}/${firstname}/${lastname}/${network}/${userid}`);
  }

  //  headleyt:  20210106  added a new parameter, qtype, to be added when the query is created
  storeNewQuery(title: string, body: string, server: string, database: string, userid: string, qtype: string, display: string) {
    console.log('storeNewQuery');
    return this.http.get<any[]>(`${this.getWSPath()}StoreUserQuery/${this.store.getPassKey()}/${this.store.customURLEncoder(title)}/${this.store.customURLEncoder(body)}/${server}/${database}/${userid}/${qtype}/${display}`);
  }

  updateRowInfo(server: string, db: string, table: string, updatekey: string, extwhere: string) {
    console.log('updateRowInfo');
    return this.http.get<any[]>(`${this.getWSPath()}UpdateRowInfo/${this.store.getPassKey()}/${server}/${db}/${table}/${updatekey}/${extwhere}/${this.store.getUserValue('userid')}`);
  }

  adminManager(ad: Admin) {
    console.log("adminManager");
    return this.http.get<any[]>(`${this.getWSPath()}QtAdminManager/${this.store.getPassKey()}/${ad.action}/${this.store.user.username}/${ad.purgedate}/${ad.useridstr}/${ad.userid}/${ad.username}/${ad.firstname}/${ad.lastname}/${ad.network}/${ad.version}/${ad.isadmin}`);
  }

  getUserColumnSelection(userid: number) {
    console.log('getUserColummnSelection');
    return this.http.get<any[]>(`${this.getWSPath()}GetUserColumnSelections/${this.store.getPassKey()}/${userid}`);
  }

  updateUserColumnSelection(colObj: any) {
    console.log("updateUserColumnSelection");
    return this.http.get<any[]>(`${this.getWSPath()}UpdateUserColumnSelection/${this.store.getPassKey()}/${this.store.getUserValue('userid')}/${colObj.action}/${colObj.rtype}/${colObj.tablename}/${colObj.columnnames}/${colObj.distinctcol}/${colObj.id}`);
  }

  clearUserDefinedPK(tablename: string) {
    console.log("clearUserDefinedPK");
    return this.http.get<any[]>(`${this.getWSPath()}ClearUserDefinedPK/${this.store.getPassKey()}/${this.store.getUserValue('userid')}/${tablename}`);
  }
}

