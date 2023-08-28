import { CommService } from './services/comm.service';
import {Component, HostListener, OnInit} from '@angular/core';

import { ConfigService } from './services/config.service';
import { StorageService } from './services/storage.service';
import { DataService } from './services/data.service';
import {ConlogService} from './modules/conlog/conlog.service';
import {MatDialog} from '@angular/material/dialog';
import {LogConsoleDialogComponent} from './modules/conlog/log-console-dialog/log-console-dialog.component';
import {ApiDialogComponent} from "./dialogs/api-dialog/api-dialog.component";
import {System} from "./models/System.model";
import {Token} from "./models/Token.model";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';
  minHeightDefault: number = 943;
  minWidthDefault: number = 1322;
  urlToken: string | null  = null;
  invalidLoad: boolean = false;
  isConsoleOpen: boolean = false;
  isApiOpen: boolean = false;
  dialogQuery: any;
  dialogApi: any;
  appInit: any = {id: null, system: false, server: false, build: false};

  constructor(private config: ConfigService, private store: StorageService, private data: DataService, private comm: CommService, public dialog: MatDialog,
              private conlog: ConlogService) { }  //

  // Adding global host listener for single global keyboard command of CTRL+\
  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if(event.ctrlKey && event.code == "KeyY") {  // Display Associated Application Console
      // A request to open the logging console has been executed
      if(!this.isConsoleOpen) {
        this.isConsoleOpen = true;
        this.dialogQuery = this.dialog.open(LogConsoleDialogComponent, {
          width: '650px',
          height: '870px',
          autoFocus: false,
          position: { right: '20px', top: '10px'}
        });

        this.dialogQuery.afterClosed()
          .subscribe(() => {
            this.isConsoleOpen = false;
        });
      } else {
        // close the window, but keep the information.
        this.isConsoleOpen = false;
        this.dialogQuery.close();
      }
    } else if (event.ctrlKey && event.code =="KeyI") {  // Perform API Test
      if(!this.isApiOpen) {
        this.isApiOpen = true;
        this.dialogApi = this.dialog.open(ApiDialogComponent, {
          width: '350px',
          height: '120px',
          autoFocus: false,
          position: {left: '20px', top: '200px'}
        });

        this.dialogApi.afterClose()
          .subscribe(() => {
            this.isApiOpen = false;
          });
      } else
      {
        this.isApiOpen = false;
        this.dialogApi.close();
      }
    }
  }

  ngOnInit() {
    // Get the query string parameter for key
    this.urlToken = this.store.getParamValueQueryString('key');
    this.getSystemConfig();
    this.getServerConfig();
    this.getApplicationBuild();

    // Only continue when the three areas above have finished processing
    this.appInit["id"] = setInterval(() => {
      if(this.appInit["server"] && this.appInit["system"] && this.appInit["build"])
        clearInterval(this.appInit["id"]);
        this.userAuthenticate();
    }, 300);
  }

  getSystemConfig() {
    // Collect the information from the config.xml file and set the appropriate database location
    this.conlog.log("getSystemConfig");
    // @ts-ignore
    const results: System = this.config.getSystemConfig();
    this.store.setSystemValue('webservice', results);
    this.store.setSystemValue('window', { minHeight: this.minHeightDefault, minWidth: this.minWidthDefault });
    this.store.setDevMode(results!.type == "development");
    this.appInit['system'] = true;
  }

  getServerConfig() {
    this.conlog.log('getServerConfig');
    const results = this.config.getServerConfig();

    this.store.setSystemValue('servers', results.servers);
    this.store.setSystemValue('databases', results.databases.sort((a,b) => {
      if(a.id < b.id) return -1;
      if(a.id > b.id) return 1;
      return 0;
    }));
    this.appInit['server'] = true;
  }

  getApplicationBuild() {
    /*TODO - Modify exisiting data subscriber with new signature as done before. */
    // Using new subscriber signature change
    this.data.getAppUpdates()
      .subscribe({
        next: (results) => {
          // Organize as single dim array instead of the multi dim array from JSON and Sort in descending order based on BuildDate column and finally sort in System Variable
          this.store.setSystemValue('build', this.store.sortArr(results["whatsnew"], "BuildDate"));
          this.conlog.log("Retrieved all update items listed in locally stored JSON file.");
          this.appInit['build'] = true;
        },
        error: (error) => {
          alert("getApplicationBuild: " + error.message);
        }
      });
  }

  userAuthenticate() {    // Used to create and store a JWT for communications during the established session
    this.conlog.log("userAuthenticate");
    if(this.urlToken != undefined) {      // in production mode with url token from Orders
      this.validateCapturedToken();       //this.getToken();
    } else if (this.urlToken == undefined && this.store.isDevMode()) {  // in development mode without url token from anywhere
      this.data.getLocalToken('sean.mcgill')
        .subscribe({
          next: (result: string) => {
            // Take the new fake and temporary token and push in variable.  Will be used as if received from Orders.
            this.urlToken = result["tokensid"];
            this.validateCapturedToken();
          }
        });
    } else if (this.urlToken == undefined && !this.store.isDevMode()) { // in production mode without url token from anywhere
      alert("No Application Token Found - Your access cannot be validated, therefore, you are not permitted to use this application. Application Aborted. Returning to previous application.");
    }
  }

  //Validate the token
  validateCapturedToken() {
    this.conlog.log("validateCaptureToken");
    this.data.validateUserToken(this.urlToken)
      .subscribe( result => {
          this.conlog.log("value returned from token validation is " + (result[0] != null));
          if(result[0] != null) {
            this.conlog.log("assigned returned userinfo: " + result[0]["Username"] + " / " + result[0]["sKey"]);
            this.store.setUserValue("token", this.urlToken);
            this.store.setUserValue("username", result[0]["Username"]);
            this.store.setUserValue("initalapp", result[0]["InitalApp"]);
            this.store.setUserValue("tokencreatedate", result[0]["CreateDate"]);
            this.store.setUserValue("skey", result[0]["sKey"]);

            //Signal that user has been validated - They should be able to use the tool at this point.
            this.getUserInformation();
          } else {
            // Need to account for people hitting the refresh or back buttons - The entry key needs to be regenerated to access the application again.
            alert("The access entry key is now invalid. It is not recommended to use the refresh page at anytime while using this application.  You must close this tab and open from DAMPS-Orders.");
          }
        },
        error => {
          alert("validateCaptureToken: " + error.message);
        });
  }

  getUserInformation() {
    this.data.getUserInfo()
      .subscribe((results) => {
          if(results[0] != undefined) {
            this.conlog.log("userinfo was successfully retrieved. [UID: " + results[0].UserID + "]");
            let row: any = results[0];
            if(results[0].UserID != -9) {
              this.store.setUserValue("fname", this.store.checkForNull(row["FirstName"]));
              this.store.setUserValue("lname", this.store.checkForNull(row["LastName"]));
              this.store.setUserValue("appdata", this.store.checkForNull(row["AppData"]));
              this.store.setUserValue("lastversion", this.store.checkForNull(row["UpdateVersion"]));
              this.store.setUserValue("lastversiondt", this.store.checkForNull(row["UpdateDate"]));
              this.store.setUserValue("lastlogin", this.store.checkForNull(row["LastLogIn"]));
              this.store.setUserValue("curlogin", this.store.checkForNull(row["CurrentLogIn"]));
              this.store.setUserValue("userid", this.store.checkForNull(row["UserID"]));
              this.store.setUserValue("priv", this.store.checkForNull(row["Priv"]));

              this.store.setUserValue("servername", this.store.system['webservice']['type'].toUpperCase());
              this.store.setUserValue("server", '{0}');

              // In many cases, the network information will be the old version, but instead of modifying it, we are now just ignoring everything but the preferred database
              if(this.store.checkForNull(row["Network"]).length > 0) {
                if (row["Network"].indexOf("|") > -1 && row["Network"].indexOf("#") > -1) {
                  let n: any = row["Network"].split("|");
                  if (n[1] == undefined) n[1] = n[0];
                  let p: any = n[1].split("#");
                  this.store.setUserValue("database", p[1]);
                } else {
                  // Use the new network system information
                  this.store.setUserValue("database", row["Network"]);
                }
              }

              //Signal that user data has been loaded
              this.comm.userInfoLoaded.emit(true);
            } else {
              this.store.setUserValue("userid", row["UserID"]);
              this.store.setUserValue("fname", row["FirstName"]);
              this.store.setUserValue("lname", row["LastName"]);
              this.store.setUserValue("appdata", row["AppData"]);

              this.comm.noToolUserInfoFound.emit();  //Signaling that only part or none of the data was found
            }
          } else {
            this.comm.noToolUserInfoFound.emit();
          }
        },
        error=> {
          alert("getUserInformation: " + error.message);
        });
  }

}
