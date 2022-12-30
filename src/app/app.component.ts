import { CommService } from './services/comm.service';
import {Component, HostListener, OnInit} from '@angular/core';

import { ConfigService } from './services/config.service';
import { StorageService } from './services/storage.service';
import { DataService } from './services/data.service';
import {ConlogService} from './modules/conlog/conlog.service';
import {MatDialog} from '@angular/material/dialog';
import {LogConsoleDialogComponent} from './modules/conlog/log-console-dialog/log-console-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';
  minHeightDefault: number = 943;
  minWidthDefault: number = 1322;
  urlToken: any = "";
  invalidLoad: boolean = false;

  isConsoleOpen: boolean = false;
  dialogQuery: any;


  constructor(private config: ConfigService, private store: StorageService, private data: DataService, private comm: CommService, public dialog: MatDialog,
              private conlog: ConlogService) { }  //

  // Adding global host listener for single global keyboard command of CTRL+\
  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if(event.ctrlKey && event.code == "KeyY") {
      // A request to open the logging console has been executed
      if(!this.isConsoleOpen) {
        this.isConsoleOpen = true;
        this.dialogQuery = this.dialog.open(LogConsoleDialogComponent, {
          width: '650px',
          height: '870px',
          autoFocus: false,
          position: { right: '20px', top: '10px'}
        });

        this.dialogQuery.afterClosed().subscribe(() => {
          this.isConsoleOpen = false;
        });
      } else {
        // close the window, but keep the information.
        this.dialogQuery.close();
      }
    }
  }

  ngOnInit() {
    // Get the query string parameter for key
    this.urlToken = this.store.getParamValueQueryString('key');

    this.getSystemConfig();
    this.getServerConfig();
    this.identifyLocale();
    this.getApplicationBuild();

    // Get and manage the user access token
    this.conlog.log("urlToken: " + this.urlToken);
    this.conlog.log("Development Mode: " + this.store.isDevMode());
    this.conlog.log("Network: " + this.store.system['webservice']['network']);

    if(this.store.isDevMode() || this.store.system['webservice']['network'] == 'sipr') {
      this.conlog.log("Executing in DevMode or on a SIPR Network, attempting to generate local token");

      if (this.urlToken == "" || this.urlToken == undefined) {
        this.data.getLocalToken("sean.mcgill")  // Generate a token at this point and introduce it into the application.
          .subscribe(result => {
            this.urlToken = result["token"];  // This is a newly created token that contains all the information needed for me to identify the user

            //In the event the urlToken was not properly saved, let's note it but move on locally by manually setting the necessary variables
            if(this.urlToken == "" || this.urlToken == undefined) {
              this.conlog.log("Unable to properly set the urlToken variable. Setting manually.")
              this.store.setUserValue("token", null);
              this.store.setUserValue("username", 'sean.mcgill');
              this.store.setUserValue("initalapp", 'UpdateTool');
              this.store.setUserValue("tokencreatedate", null);
              this.getUserInformation();
            } else {
              this.conlog.log("Successfully populated urlToken. Getting user info.");
              this.continueInitialization();
            }
          });
      }
    } else {
      // Process the token sent to the app component
      this.continueInitialization();
    }
  }

  continueInitialization(){
    if(this.urlToken != undefined){
      this.validateCapturedToken();
    } else {
      alert("Your access cannot be validated.  Returning to previous application.");
    }
  }

  getSystemConfig() {
    // Collect the information from the config.xml file and set the appropriate database location
    this.conlog.log("getSystemConfig");
    const results = this.config.getSystemConfig();
    this.store.setSystemValue('webservice', results);
    this.store.setSystemValue('window', { minHeight: this.minHeightDefault, minWidth: this.minWidthDefault });
    this.store.setDevMode(results!.type == "development");
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
  }

  getApplicationBuild() {
    this.data.getAppUpdates().subscribe((results) => {
      this.store.setSystemValue('build', results);
    },
      error => {
        alert("getApplicationBuild: " + error.message);
      });
  }

  identifyLocale(){
    switch(this.store.system['webservice']['type'].toUpperCase())
    {
      case 'DEVELOPMENT':
        this.store.system['webservice']['locale'] = 'development';
        //this.conlog.log("development webservice - devmode is " + this.store.isDevMode());
        break;
      case 'PRODUCTION':
        this.store.system['webservice']['locale'] = 'production';
        this.store.shutOffDev();
        //this.conlog.log('production webservice - devmode is ' + this.store.isDevMode());
        break;
    }
  }

  //Validate the token
  validateCapturedToken() {
    this.conlog.log("validateCaptureToken:");
    this.data.validateUserToken(this.urlToken)
    .subscribe(result => {
      this.conlog.log("validateCaptureToken: (return)" + result[0]);
        if(result[0] != null) {
        this.store.setUserValue("token", this.urlToken);
        this.store.setUserValue("username", result[0]["Username"]);
        this.store.setUserValue("initalapp", result[0]["InitalApp"]);
        this.store.setUserValue("tokencreatedate", result[0]["CreateDate"]);

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
        let row: any = results[0];
        if(results[0].UserID != -9) {
          this.store.setUserValue("fname", row["FirstName"]);
          this.store.setUserValue("lname", row["LastName"]);
          this.store.setUserValue("appdata", row["AppData"]);
          this.store.setUserValue("lastversion", row["UpdateVersion"]);
          this.store.setUserValue("lastversiondt", row["UpdateDate"]);
          this.store.setUserValue("lastlogin", row["LastLogIn"]);
          this.store.setUserValue("curlogin", row["CurrentLogIn"]);
          this.store.setUserValue("userid", row["UserID"]);
          this.store.setUserValue("priv", row["Priv"]);

          this.store.setUserValue("servername", this.store.system['webservice']['type'].toUpperCase());
          this.store.setUserValue("server", '{0}');

          // In many cases, the network information will be the old version, but instead of modifying it, we are now just ignoring everything but the preferred database
          if(row["Network"].indexOf("|") > -1 && row["Network"].indexOf("#") > -1) {
            let n: any = row["Network"].split("|");
            if (n[1] == undefined) n[1] = n[0];
            let p: any = n[1].split("#");
            this.store.setUserValue("database", p[1]);
          } else {
            // Use the new network system information
            this.store.setUserValue("database", row["Network"]);
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
