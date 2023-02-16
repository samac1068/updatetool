import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {StorageService} from './storage.service';
import { catchError } from 'rxjs/operators';
import {Admin} from '../models/Admin.model';
import {ConlogService} from '../modules/conlog/conlog.service';
import {User} from '../models/User.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(private http: HttpClient, private store: StorageService, private conlog: ConlogService) {
  }

  private getWSPath(): string { // This updates the relative path depending on running locally or on a server.
    return (this.store.system['webservice']['locale'] == 'production') ? "/querytool/api" : "";
  }

  private errorHandler(error: any) {
    let errorMessage: string = "";

    if(error["errmess"] != null) {
      errorMessage = error["errmess"];
    } else {
      let errorDetails: string = (error.error instanceof ErrorEvent) ? `(Client Error: ${error.error.message})` : `(Server Error: ${error.status}\nMessage: ${error.message})`;

      switch (error.status) {
        case 504:  //Gateway Timeout Error
          errorMessage = `${error.status}: Gateway Timeout Error.\n${errorDetails}`;
          break;
        case 500:   // Internal Server Error
          errorMessage = `The access entry key is now invalid. It is not recommended to use the refresh page at anytime while using this application.  You must close this tab and open from DAMPS-Orders.\n${errorDetails}`;
          break;
        case 401:   // Unauthorized Error
        case 403:   // Forbidden Error
          errorMessage = `Your access cannot be validated, therefore, you are not permitted to use this application.\n${errorDetails}`;
          break;
        case 404:   // Page not Found Error
          errorMessage = `Somehow the yellow brick road has disappeared.  Please return to the hosting application and try again. We apologize for the inconvenience.\n${errorDetails}`;
          break;
      }
    }
      alert(errorMessage);
      this.conlog.log(errorMessage);
      return throwError(errorMessage);
  }

  /** Get the user information from the server **/
  getLocalToken(username: string): Observable<string> {
    this.conlog.log('getLocalToken');
    const reqbody = {
      devkey: this.store.getDevKey(),
      username: username
    };
    return this.http.post<string>(`${this.getWSPath()}/UserW/RequestLocalToken`, reqbody)
      .pipe(catchError(this.errorHandler));
  }

 /* closeTokenSession(): Observable<any> {
    this.conlog.log('closeTokenSession');
    return this.http.get(`${this.getWSPath()}CloseTokenSession/${this.store.user['token']}/${this.store.getUserValue('username')}`);
  }

  getUserSessionInfo() {
    this.conlog.log('GetUserSessionInfo');
    return this.http.get(`${this.getWSPath()}GetUserSessionInfo`);
  }*/

  validateUserToken(token: string) { //First service called when the application is first executed, unless executed locally
    this.conlog.log('validateUserToken');
    const reqbody = {
      apikey: this.store.getPassKey(),
      tokensid: token
    };
    return this.http.post(`${this.getWSPath()}/UserW/ValidateUserToken`, reqbody)
      .pipe(catchError(this.errorHandler));
  }

  //Second service called to pull in the user's specific information which is required for set up of the individual pages
  getUserInfo() {
    this.conlog.log('getUserInfo');
    const reqbody = {
      apikey: this.store.getPassKey(),
      skey: this.store.getUserValue("skey"),
      Username: this.store.getUserValue("username")
    };
    return this.http.post(`${this.getWSPath()}/UserW/GetUserInfo`, reqbody)
      .pipe(catchError(this.errorHandler));
  }

  getUserSavedQueries(): Observable<any> {
    this.conlog.log('getUserSavedQueries');
    const reqbody = {
      apikey: this.store.getPassKey(),
      skey: this.store.getUserValue("skey"),
      userid: this.store.getUserValue("userid")
    };
    return this.http.post(`${this.getWSPath()}/UserW/GetUserSavedQueries`, reqbody)
      .pipe(catchError(this.errorHandler));
  }

  getAppUpdates(): Observable<any> {
    this.conlog.log('getAppUpdates - From local JSON file');
    return this.http.get<[]>('assets/whatsnew.json')     // Pulling the update information from the local JSON file and not the database.
      .pipe(catchError(this.errorHandler));
  }

  updateUserVersion(version: string): Observable<any> {
    this.conlog.log('updateUserVersion');
    const reqbody = {
      apikey: this.store.getPassKey(),
      skey: this.store.getUserValue("skey"),
      userid: this.store.getUserValue("userid"),
      version: version
    };
    return this.http.post<any[]>(`${this.getWSPath()}/UserW/UpdateUserDate`, reqbody)
      .pipe(catchError(this.errorHandler));
  }

  getTableDBList(server: string, db: string) {
    this.conlog.log('getTableDBList');
    const reqbody = {
      apikey: this.store.getPassKey(),
      skey: this.store.getUserValue("skey"),
      server: server,
      database: db
    };
    return this.http.post<any[]>(`${this.getWSPath()}/UserW/GetDbTableList`, reqbody)
      .pipe(catchError(this.errorHandler));
  }

  getQueryData(server: string, db: string, tbl: string, col: string, where: string, join: string, order: string, cnt: number, lmtrow: number, speccnt: string, username: string, usedistinct: number) {
    this.conlog.log('getQueryData');
    const reqbody = {
      apikey: this.store.getPassKey(),
      skey: this.store.getUserValue("skey"),
      server: server,
      database: db,
      table: tbl,
      columns: col,
      where: where,
      join: join,
      order: order,
      count: cnt,
      limitrow: lmtrow,
      speccnt: speccnt,
      username: username,
      usedistinct: usedistinct
    };
    return this.http.post(`${this.getWSPath()}/UserW/GetQueryData`, reqbody)
      .pipe(catchError(this.errorHandler));
  }

  getTableProperties(server: string, db: string, tbl: string): Observable<any[]> {
    this.conlog.log('getTableProperties');
    const reqbody = {
      apikey: this.store.getPassKey(),
      skey: this.store.getUserValue("skey"),
      server: server,
      database: db,
      tablename: tbl
    };
    return this.http.post<any[]>(`${this.getWSPath()}/UserW/GetTableProperties`, reqbody)
      .pipe(catchError(this.errorHandler));
  }

  //Used to get all the stored materials like stored procedures, views, and functions.
  getStoredObjectList(server: string, db: string, type: string) {
    this.conlog.log('getStoredObjectList for ' + type);
    let webservice: string = "";

    const reqbody = {
      apikey: this.store.getPassKey(),
      skey: this.store.getUserValue("skey"),
      server: server,
      database: db
    };

    switch(type) {
      case "proc":
        webservice = `${this.getWSPath()}/UserW/GetStoreProcList`;
        break;
      case "view":
        webservice = `${this.getWSPath()}/UserW/GetStoredViewList`;
        break;
      case "func":
        webservice = `${this.getWSPath()}/UserW/GetStoredFunctionsList`;
        break
    }

    return this.http.post<any[]>(webservice, reqbody)
      .pipe(catchError(this.errorHandler));
  }

  getStoredValues(server: string, db: string, itemname: string) {
    this.conlog.log('getStoredValues');
    const reqbody = {
      apikey: this.store.getPassKey(),
      skey: this.store.getUserValue("skey"),
      server: server,
      database: db,
      procname: itemname
    };
    return this.http.post<any[]>(`${this.getWSPath()}/UserW/ReturnStr_StoredValues`, reqbody)
      .pipe(catchError(this.errorHandler));
  }

  executeQStr(queryid: number) {
    this.conlog.log('executeQStr');
    const reqbody = {
      apikey: this.store.getPassKey(),
      skey: this.store.getUserValue("skey"),
      queryid: queryid
    };
    return this.http.post<any[]>(`${this.getWSPath()}/UserW/CaptureQStr`, reqbody)
      .pipe(catchError(this.errorHandler));
  }

  addEditUpdateUserInfo(user: User) {
    this.conlog.log('addEditUpdateUserInfo');
    let action: string = (user.userid == -9) ? "add" : "edit";
    const reqbody = {
      apikey: this.store.getPassKey(),
      skey: this.store.getUserValue("skey"),
      action: action,
      username: user.username,
      firstname: user.fname,
      lastname: user.lname,
      server: user.servername,
      database: user.database,
      network: user.network,
      appdata: user.appdata,
      userid: user.userid
    };
    return this.http.post<any[]>(`${this.getWSPath()}/UserW/AddEditUpdateUserInfo`, reqbody)
      .pipe(catchError(this.errorHandler));
  }

  //  headleyt:  20210106  added a new parameter, qtype, to be added when the query is created
  storeNewQuery(title: string, body: string, server: string, database: string, userid: string, qtype: string, display: string) {
    this.conlog.log('storeNewQuery');
    const reqbody = {
      apikey: this.store.getPassKey(),
      skey: this.store.getUserValue("skey"),
      title: title,
      body: body,
      server: server,
      database: database,
      userid: userid,
      qtype: qtype,
      display: display
    };
    return this.http.post<any[]>(`${this.getWSPath()}/UserW/StoreUserQuery`, reqbody)
      .pipe(catchError(this.errorHandler));
  }

  updateRowInfo(server: string, db: string, table: string, updatekey: string, extwhere: string) {
    this.conlog.log('updateRowInfo');
    const reqbody = {
      apikey: this.store.getPassKey(),
      skey: this.store.getUserValue("skey"),
      server: server,
      database: db,
      tablename: table,
      updatekey: updatekey,
      extwhere: extwhere
    };
    return this.http.post<any[]>(`${this.getWSPath()}/UserW/UpdateRowInfo`, reqbody)
      .pipe(catchError(this.errorHandler));
  }

  adminManager(ad: Admin) {
    this.conlog.log("adminManager");
    const reqbody = {
      apikey: this.store.getPassKey(),
      skey: this.store.getUserValue("skey"),
      action: ad.action,
      adminuser: this.store.user.username,
      purgedate: ad.purgedate,
      useridstr: ad.useridstr,
      userid: ad.userid,
      username: ad.username,
      firstname: ad.firstname,
      lastname: ad.lastname,
      network: ad.network,
      database: ad.database,
      version: ad.version,
      isadmin: (ad.isadmin) ? 1 : 0
    };
    return this.http.post<any[]>(`${this.getWSPath()}/UserW/QtAdminManager`, reqbody)
      .pipe(catchError(this.errorHandler));
  }

  getUserColumnSelection(userid: number) {
    this.conlog.log('getUserColummnSelection');
    const reqbody = {
      apikey: this.store.getPassKey(),
      skey: this.store.getUserValue("skey"),
      userid: userid
    };
    return this.http.post<any[]>(`${this.getWSPath()}/UserW/GetUserColumnSelections`, reqbody)
      .pipe(catchError(this.errorHandler));
  }

  updateUserColumnSelection(colObj: any) {
    this.conlog.log("updateUserColumnSelection");
    const reqbody = {
      apikey: this.store.getPassKey(),
      skey: this.store.getUserValue("skey"),
      action: colObj.action,
      rtype: colObj.rtype,
      tablename: colObj.tablename,
      columnnames: colObj.columnnames,
      distinctcol: colObj.distinctcol,
      userid: this.store.user["userid"],
      id: (colObj.id == null) ? "-9" : colObj.id
    };
    return this.http.post<any[]>(`${this.getWSPath()}/UserW/UpdateUserColumnSelection`, reqbody)
      .pipe(catchError(this.errorHandler));
  }

  clearUserDefinedPK(tablename: string) {
    this.conlog.log("clearUserDefinedPK");
    const reqbody = {
      apikey: this.store.getPassKey(),
      skey: this.store.getUserValue("skey"),
      userid: this.store.getUserValue("userid"),
      tablename: tablename
    };
    return this.http.post<any[]>(`${this.getWSPath()}/UserW/ClearUserDefinedPk`, reqbody)
      .pipe(catchError(this.errorHandler));
  }

  getResetPortalSession(action: string, cutidlist: string) {
    this.conlog.log('getResetPortalSession');
    const reqbody = {
      apikey: this.store.getPassKey(),
      skey: this.store.getUserValue("skey"),
      action: action,
      cutidlist: cutidlist
    };
    return this.http.post<any[]>(`${this.getWSPath()}/UserW/GetResetActivePortalSessions`, reqbody)
      .pipe(catchError(this.errorHandler));
  }
}

