import { Injectable } from '@angular/core';
import { System } from '../models/System.model';
import { User } from '../models/User.model';
import { Tab } from '../models/Tab.model';
import {HttpParams} from '@angular/common/http';
import {Toaster} from 'ngx-toast-notifications';
import {ConlogService} from '../modules/conlog/conlog.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  // Variables to store all the global data
  private _passKey = "4A3F6BD3-61FB-467B-83D0-0EFBAF72AFC4";
  private _devKey = "4c7a4455fdab4fb8228748fd7702d245";
  private _connectid = 'MobCopConnectionString';
  private _appVersion = '2.23.0828 (Doc: 1.6)';
  private _inDev: boolean = false;
  private _bearerToken: string = "";

  // Public
  tabsArr = [];
  user: User = new User();
  system: System = new System();
  selectedTabID: string = "";
  selectedTab: Tab = new Tab;

  // Variable Constant
  rowOptions: any[] = [{lbl:'1 Row', value: 1}, {lbl: '10 Rows', value: 10}, {lbl: '50 Rows', value: 50}, {lbl:'100 Rows', value: 100},
    {lbl: '1000 Rows', value: 1000}];  //, {lbl: '2000 Rows', value: 2000}, {lbl:'All Rows', value: -9}
  conditionals: string[] = ["AND", "OR"];
  operators: string[] = ["LIKE","NOT LIKE","=","<>","!=",">",">=","!>","<","<=","!<","IN","IS NULL","IS NOT NULL"];
  //  headleyt:  20210129  Adding a text version of the operators
  operatorsText: string[] = ["like","not like","equals","not equal to ","not equal to","greater than","greater than or equal to","not greater than","less than","less than or equal to","not less than","in","is null","is not null"];
  dbNumericals: string[] = ["bit","tinyint","bool","boolean","smallint","mediumint","int","integer","bigint","float","double","decimal","double precision","dec"];
  ignoreChars: string[] = ["/","\\", "`"];
  maximumRowReturnCnt: number = 1000;
  displayFormats: any[] = [{id: 1, text: "Sentence Format"}, {id:0, text:"SQL Format"}];

  constructor(private toaster: Toaster, private conlog: ConlogService) { }

  // This will allow you to set a specific object for either the tab or the user variables
  setTabValue(section: string, value: any) {
    this.tabsArr[section] = value;
  }

  setUserValue(section: string, value: any) {
    this.user[section] = value;
  }

  setSystemValue(section: string, value: any) {
     this.system[section] = value;
  }

  getUserValue(section: string): any {
    return this.user[section];
  }

  setDevMode(value: boolean) {
    this._inDev = value;
  }

  getSystemValue(section: string): any {
    return this.system[section];
  }

  getUser(){
    return this.user;
  }

  getPassKey() {
    return this._passKey;
  }

  getDevKey() {
    return this._devKey;
  }

  getConnectID() {
    return this._connectid;
  }

  getVersion() {
    return this._appVersion;
  }

  isDevMode() {
    return this._inDev;
  }

  shutOffDev() {
    this._inDev = false;
  }

  getBearerToken(): string {
    return this._bearerToken;
  }

  setBearerToken(token: string): void {
    this._bearerToken = token;
  }

  /// Global Services - Let's see if this will work
  isInArray(arr: any, value: any) {
    if(arr == null || arr.length == 0) return false;

    for(let i = 0; i < arr.length; i++) {
      if(arr[i] == value)
        return true;
    }

    return false;
  }

  findIndexByValue(arr: any, key: string, value: any){
    for (let i = 0; i < arr.length; i++) {
      if (arr[i][key].toLowerCase() === value.toLowerCase()) {
          return i;
      }
    }
    return -1;
  }

  getIndexByID(arr: any, key: string, value: any){
    for (let i = 0; i < arr.length; i++) {
      if (arr[i][key] === value) {
          return i;
      }
    }
    return -1;
  }

  findObjByValue(arr: any, key: string, value: any){
    for (let i = 0; i < arr.length; i++) {
      if (arr[i][key].toLowerCase() === value.toLowerCase()) {
          return arr[i];
      }
    }
    return null;
  }

  returnColByStringKey(arr: any, key: any, value: any, rtncol: string, def: string = "null"){
    for (let i = 0; i < arr.length; i++) {
      if (arr[i][key].toLowerCase() === value.toLowerCase()) {
          return arr[i][rtncol];
      }
    }

    return (def != "null") ? def : null;
  }

  searchArr(arr: any, value: any): number {
    for(let i = 0; i < arr.length; i++){
      if(arr[i] == value)
        return i;
    }

    return -1;
  }

   //  headleyt:  20200105  added additional encoding characters to be consistent with what is in the API
  customURLEncoder(str: string) {
    str = str.replace(/%/g, "{14}");
    str = str.replace(/^\s+|\s+$/gm,'');
    str = str.replace(/ /gi, "%20");
    str = str.replace(/\*/gi, "~");
    str = str.replace(/\* /gi, "!");
    str = str.replace(/\\/gi, "`");
    str = str.replace(/'/gi, "^");
    str = str.replace(/>/gi, "gt");
    str = str.replace(/</gi, "lt");

    return str;
  }

  //  headleyt:  20200105  added additional decoding characters to be consistent with what is in the API
  customURLDecoder(str: string) {
    str = str.replace(/%20/gi, " ");
    str = str.replace(/~/gi, "*");
    str = str.replace(/! /gi, "*");
    str = str.replace(/`/gi, "\\");
    str = str.replace(/\^/gi, "'");
    str = str.replace(/{14\}/g, "%");
    return str;
  }

  determineValueType(value: any, vartype: any)
  {
    return (this.dbNumericals.find(x => x == vartype) == undefined) ? "'" + value + "'" : value;
  }

  //  headleyt:  20210107 added this function to return the altername db name if it has one. | sam 20230212: Updated code to perform same task with less lines.
  getSelectedDBName(dbname: string)
  {
    const obj = this.system.databases.find(x => x.id == dbname && x.altname != null);
    return (obj == undefined) ? dbname : obj.altname;
  }

  getParamValueQueryString( paramName: string ): string | null {
    const url: string = window.location.href;
    let paramValue;
    if (url.includes('?')) {
      const httpParams: HttpParams | null = new HttpParams({ fromString: url.split('?')[1] });
      paramValue = httpParams.get(paramName);
      return paramValue;
    }
     return null;
  }

  generateToast(text: string,issuccess: boolean = true): void {
    this.conlog.log("Toast Generated: " + text + "(" + issuccess + ")");
    this.toaster.open({
      text: text,
      caption: 'Notification',
      type: (!issuccess) ? 'warning' : 'success',
      position: 'top-center'
    });
  }

  setCapitlization(str: string): string {
    return str.substr(0,1).toUpperCase() + str.substr(1).toLowerCase();
  }

  formatDateTime(dt: string): string {
    let dtpart = dt.split("T");
    let timepart = dtpart[1].split(".");

    return dtpart[0] + " " + timepart[0];
  }

  removeUnderscore(str: string) {
    return str.replace("_", " ");
  }

  sortArr(arr: any, col: string, desc: boolean = true){
    let wn: any;

    if (desc){
      wn =  arr.sort(
        (objA: any, objB: any) => {
          return <any>new Date(objB[col]) - <any>new Date(objA[col]);
        });
    } else {
      wn =  arr.sort(
        (objA: any, objB: any) => {
          return <any>new Date(objA[col]) - <any>new Date(objB[col]);
        }
      );
    }

    return wn;
  }

  checkStringForNullOrEmpty(str: any): boolean {
    if(str === null) return false;
    return str.trim().length == 0 || typeof str !== "string";
  }

  checkForNull(str:string): string {
    if(str !== null)
      return str.length == 0 ? "" : str;

    return "";
  }
}
