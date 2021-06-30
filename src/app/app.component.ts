import { CommService } from './services/comm.service';
import {Component, ElementRef, OnInit} from '@angular/core';

import { ConfigService } from './services/config.service';
import { StorageService } from './services/storage.service';
import { DataService } from './services/data.service';

// using the new environment files to determine the dev mode and the url to the api
import {environment} from '../environments/environment';

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

  constructor(private config: ConfigService, private store: StorageService, private data: DataService, private comm: CommService) { }

  ngOnInit() {
    // Get the query string parameter for key
    this.urlToken = this.store.getParamValueQueryString('key');

    this.getSystemConfig();
    this.getServerConfig();
    this.identifyLocale();

    // Get and manage the user access token
    if(this.store.isDevMode()) {
      // Manually set the necessary variables

      this.store.setUserValue("token", null);
      this.store.setUserValue("username", 'sean.mcgill');
      this.store.setUserValue("initalapp", 'UPDATETOOL');
      this.store.setUserValue("tokencreatedate", null);
      this.getUserInformation();

      // If we can get this working in the future, cool otherwise use the lines above
      // Problem is I could never get the GUID string to store in the urlToken variable.
      /* TODO - incorporate authorization bearer tokens */
      /*if (this.urlToken == "" || this.urlToken == "undefined") {
        this.data.getLocalToken("sean.mcgill")  // Generate a token at this point and introduce it into the application.
          .subscribe(result => {
            this.urlToken += result["token"];
            console.log(this.urlToken);
          });
      }*/
    } else {
      // Process the token sent to the app component
      this.continueInitialization();
    }
  }

  continueInitialization(){
    if(this.urlToken != undefined){
      this.validateCapturedToken();
      this.getApplicationBuild();
    } else {
      alert("Your access cannot be validated.  Returning to previous application.");
    }
  }

  getSystemConfig() {
    // Collect the information from the config.xml file and set the appropriate database location
    const results = this.config.getSystemConfig();
    this.store.setSystemValue('webservice', results);
    this.store.setSystemValue('window', { minHeight: this.minHeightDefault, minWidth: this.minWidthDefault });
    this.store.setDevMode(results.type == "local");
  }

  getServerConfig() {
    const results = this.config.getServerConfig();
    this.store.setSystemValue('servers', results.servers);
    this.store.setSystemValue('databases', results.databases);
  }

  getApplicationBuild() {
    this.data.getAppUpdates().subscribe((results) => {
      this.store.setSystemValue('build', results);
    });
  }

  identifyLocale(){
    switch(this.store.system['webservice']['type'].toUpperCase())
    {
        case 'LOCAL':
          this.store.system['webservice']['locale'] = 'herndon';
          console.log("local webservice - devmode is " + this.store.isDevMode());
          break;
        case 'DEV':
        case 'DEMO':
          this.store.system['webservice']['locale'] = 'development';
          console.log('development (herndon) webservice - devmode is ' + this.store.isDevMode());
          break;
        case 'PROD':
          this.store.system['webservice']['locale'] = 'production';
          this.store.shutOffDev();
          console.log('production webservice - devmode is ' + this.store.isDevMode());
          break;
    }
  }

  //Validate the token
  validateCapturedToken() {
    this.data.validateUserToken(this.urlToken)
    .subscribe(result => {
      this.store.setUserValue("token", this.urlToken);
      this.store.setUserValue("username", result[0]["Username"]);
      this.store.setUserValue("initalapp", result[0]["InitalApp"]);
      this.store.setUserValue("tokencreatedate", result[0]["CreateDate"]);

      //Signal that user has been validated - They should be able to use the tool at this point.
      this.getUserInformation();
    });
  }

  getUserInformation() {
    this.data.getUserInfo().subscribe((results) => {
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

          let n: any = row["Network"].split("|");
          this.store.setUserValue("servername", n[0]);

          if(n[1] == undefined) n[1]=n[0];

          let p: any = n[1].split("#");
          this.store.setUserValue("server", p[0]);
          this.store.setUserValue("database", p[1]);

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
    });
  }
}
