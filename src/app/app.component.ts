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
import {User} from "./models/User.model";
import {Tab} from "./models/Tab.model";

export interface WhatNew {
  BuildDate: string
  BuildVersion: string
  BuildChanges: string
}


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
  isDialogApiOpen: boolean = false;
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
      if(!this.isDialogApiOpen) {
        this.isDialogApiOpen = true;
          this.dialogApi = this.dialog.open(ApiDialogComponent, {
          width: '350px',
          height: '140px',
          autoFocus: false,
          position: {left: '20px', top: '200px'},
          data: true
        });

        this.dialogApi.afterClosed()
          .subscribe(() => {
            this.isDialogApiOpen = false;
          });
      } else
      {
        this.isDialogApiOpen = false;
        this.dialogApi.close();
      }
    }
  }

  ngOnInit() {
    this.commsListener();
    this.getSystemConfig();
    this.getServerConfig();
    this.getApplicationBuild();

    // Get the query string parameter for key
    if(this.store.system['webservice']['network'] == "sipr"){
      this.store.setUserValue("username", this.store.getParamValueQueryString('key'));
    } else
      this.urlToken = this.store.getParamValueQueryString('key');

    // Only continue when the three areas above have finished processing
    this.appInit["id"] = setInterval(() => {
      if(this.appInit["server"] && this.appInit["system"] && this.appInit["build"])
        clearInterval(this.appInit["id"]);
        this.conlog.log("initializeApp");
        this.conlog.log("API path: " + this.data.getWSPath());

        // Get and manage the user access token
        this.conlog.log("urlToken: " + this.urlToken);
        this.conlog.log("In Development Mode: " + this.store.isDevMode());
        this.conlog.log("Network: " + this.store.system['webservice']['network']);
        //this.conlog.log(this.store.system['webservice']['type'] + ' webservice - devmode is ' + this.store.isDevMode());
        this.confirmEstablishedComms();
    }, 300);
  }

  commsListener():void {
    // Place all listeners in here
    this.comm.impersonateClicked.subscribe((user: User) => {
      this.impersonateUser(user);
    });

    this.comm.killImpersonateClicked.subscribe(() => {
      this.killImperasonation();
    });
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
    /*TODO - would like to stop using the data service to pull in the JSON file. It produces an uncaught promise error but does not impact the function of the application. */
    /*this.conlog.log('getAppUpdates - From local JSON file');
    this.store.setSystemValue('build', this.store.sortArr(<WhatNew[]> whatsnew, "BuildDate"));
    this.conlog.log("Retrieved all update items listed in locally stored JSON file.");
    this.appInit['build'] = true;
    */

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

  confirmEstablishedComms(){
    // Open a small communications window to confirm the connection
    if(this.dialogApi != null || this.isDialogApiOpen) {
      this.dialogApi.close();
    }
      this.dialogApi = this.dialog.open(ApiDialogComponent, {
        width: '350px',
        height: '140px',
        autoFocus: false,
        position: {left: '20px', top: '200px'},
        data: false
    });

      this.dialogApi.afterClosed().subscribe( ()=> {
          this.userAuthenticate();
      });
  }
  userAuthenticate() {    // Used to create and store a JWT for communications during the established session
    this.conlog.log("userAuthenticate");

    if(this.urlToken == undefined && this.store.system['webservice']['network'] != "sipr" && !this.store.isDevMode())
    {
      alert("No Application Token Found - Your access cannot be validated, therefore, you are not permitted to use this application. Application Aborted. Returning to previous application.");
    }
    else {
      if (this.store.system['webservice']['network'] == "sipr") {
        if (this.store.isDevMode())
          this.store.setUserValue("username", "sean.mcgill");

        this.validateCapturedSiprInfo();
      } else // Then it is NIPR and we will act accordingly
      {
        if (this.urlToken != undefined)
          this.validateCapturedToken();
        if (this.urlToken == undefined && this.store.isDevMode()) {
          this.data.getLocalToken("sean.mcgill")
            .subscribe({
              next: (result: string) => {
                this.urlToken = result["tokensid"];
                this.validateCapturedToken();
              }
            });
        }
      }
    }
  }

  validateCapturedSiprInfo() {
    // Need to pull in the username and then get the user information
    this.data.getLocalToken(this.store.getUserValue("username"))
      .subscribe({
        next: (result: any) => {

          this.conlog.log((this.store.system['webservice']['network'] == "sipr") ? "Creating a SIPR Bridge Token" : "Creating a local token for development user only");
          if(result["tokensid"] != null)
          {
            this.urlToken = result["tokensid"];
            this.validateCapturedToken();
          }
        }
      });
  }

  //Validate the token
  validateCapturedToken() {
    this.conlog.log("validateCaptureToken");
    this.data.validateUserToken(this.urlToken)
      .subscribe({
        next: (result: any) => {
          this.conlog.log("value returned from token validation is " + (result[0] != null));
          if(result[0] != null) {
            this.conlog.log("assigned returned userinfo: " + result[0]["Username"] + " / " + result[0]["sKey"]);
            this.store.setUserValue("token", this.urlToken);
            this.store.setUserValue("username", result[0]["Username"]);
            this.store.setUserValue("initalapp", result[0]["InitalApp"]);
            this.store.setUserValue("tokencreatedate", result[0]["CreateDate"]);
            this.store.setUserValue("skey", result[0]["sKey"]);

            //Signal that user has been validated - They should be able to use the tool at this point.
            this.generateBearerToken();
          } else {
            // Need to account for people hitting the refresh or back buttons - The entry key needs to be regenerated to access the application again.
            alert("The access entry key is now invalid. It is not recommended to use the refresh page at anytime while using this application.  You must close this tab and open from DAMPS-Orders.");
          }
        },
        error: (err: any) => {
          alert("validateCaptureToken: " + err.message);
        }
      });
  }

  generateBearerToken(){
    this.data.getBearerToken(this.store.user.username)
      .subscribe((bearer:any) => {
        this.store.setBearerToken(bearer.data);

        // If we don't have authorization to even user the API, there is no sense going forward.
        if(this.store.getBearerToken() == "") {
          this.conlog.log("No Authorization Token Received. User is not Authorized Access.");
          window.alert("No Authorization Token Received. User is not Authorized Access.");
        } else {
          //Make sure the API is available before we start attempting to load anything
          this.conlog.log("authorizationTokenValid");
          this.getUserInformation();
        }
      });
  }

  impersonateUser(user: User): void {
    // Need to properly store the current user's information, so it is easy to return when done.
    if(!this.store.imperStorage.activeImpersonation) {
      this.store.imperStorage = {
        activeImpersonation: true,
        adminUser: {...this.store.user},
        adminTabArr: [...this.store.tabsArr],    // Only thing that is being removed.  Don't need the original tabs from the previous user.
        adminSelectedTab: {...this.store.selectedTab},
        adminSelectedTabID: (' ' + this.store.selectedTabID).slice(1),
        imperUser: user
      };

      // Clear out the original information
      this.store.tabsArr = [];
      this.store.selectedTab = new Tab;
      this.store.selectedTabID = "-1";
      this.store.setUserValue("username", user.username); // Need to reassign the new user's information to key variables

      // Run data service
      this.data.processImpersonateRequest("enable").subscribe(() => {
        this.getUserInformation(); // Okay, now run it like normal
      });
    }
  }

  killImperasonation(): void {
    console.log("what we are with is", this.store.imperStorage);
    // Run data service
    this.data.processImpersonateRequest("disable").subscribe(() => {
      this.store.tabsArr = [];
      this.store.selectedTab = new Tab;
      this.store.selectedTabID = "-1";

      this.store.user = {...this.store.imperStorage.adminUser};
      this.store.tabsArr = [...this.store.imperStorage.adminTabArr];
      this.store.selectedTabID = (' ' + this.store.imperStorage.adminSelectedTabID).slice(1);
      this.store.selectedTab = {...this.store.imperStorage.adminSelectedTab};
      this.store.setUserValue("username", this.store.user.username);

      this.store.imperStorage = {
        activeImpersonation: false,
        adminUser: null,
        adminTabArr: null,
        imperUser: null
      };

      this.getUserInformation();
    });
  }

  getUserInformation() {
    this.data.getUserInfo()
      .subscribe({
        next: (results: any) => {
          if(results[0] != undefined) {
            let row: any = results[0];
            this.conlog.log("userinfo was successfully retrieved. [UID: " + row["UserID"] + "]");
            if(row["UserID"] != -9) {
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
        error: (err: any) => {
          alert("getUserInformation: " + err.message);
        }
      });
  }
}
