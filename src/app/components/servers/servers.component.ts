import { User } from '../../models/User.model';
import { CommService } from '../../services/comm.service';
import { Component, OnInit, Input } from '@angular/core';

import { Database } from '../../models/Database.model';
import { Server } from '../../models/Server.model';
import { StorageService } from '../../services/storage.service';
import { Query } from 'src/app/models/Query.model';
import { DataService } from 'src/app/services/data.service';
import { ConfigService} from 'src/app/services/config.service';
import { Tab } from 'src/app/models/Tab.model';

@Component({
  selector: 'app-servers',
  templateUrl: './servers.component.html',
  styleUrls: ['./servers.component.css']
})
export class ServersComponent implements OnInit {
  servers: Server[];
  databases: Database[];
  queries: Query[];
  user: User;
  tabinfo: Tab;

  defaultServer: string = "";
  defaultDB: string = "";

  selectedQueryID: number = -1;
  isTableSelected:  boolean = false;  //  headleyt:  20210113  added new property for the Save Current Query button


  //  headleyt:  20210108  added config.service in order to reset the database list if a different server is selected
  constructor(private store: StorageService, private comm: CommService, private data: DataService, private config: ConfigService) { }

  ngOnInit() {
      //Listeners
//  headleyt:  20210113  Added subscribe so the servers.component knows when the following three functions have been emitted
      this.comm.setQueryButton.subscribe(() => {this.setQueryButton()});  //  enable/disable the Save Current Query when table is selected
//  headleyt:  20210129  Commenting out temporarily until we can add this function back in
//      this.comm.populateQueryList.subscribe(() => {this.populateStoredQueryList()});  //  Repopulate the Your Saved Queries dropdown after query is saved
      this.comm.selectTab.subscribe(() => {this.setSettingsByTab()});  //  enable/disable the Save Current Query button when tabs are changed

      this.comm.userInfoLoaded.subscribe(() => {
      //Now we can load and set the default selections for this user
      this.user = this.store.getUser();

      //set default selections
      this.defaultServer = this.store.getUserValue("servername");
      this.defaultDB = this.store.getUserValue("database");

/*       //Need to grab a list of the queries for this user
      this.queries = [];
      this.data.getUserSavedQueries().subscribe((results) => {
        // this.populateStoredQueryList(results);
        for(var i=0; i < results.length; i++) {
          var q:Query = new Query();
          q.id = results[i].ID;
          q.title = this.store.customURLDecoder(results[i].QueryTitle);
          q.database = results[i].DatabaseName;
          q.server = results[i].ServerName;
          q.querybody = this.store.customURLDecoder(results[i].QueryBody);
          //  headleyt:  20210106  added qtype as a parameter
          q.qtype = results[i].Qtype;

          //console.log(q.querybody);

          this.queries.push(q);
        };
      }); */


      //  headleyt:  20210113  Replaced code above with this function so it can be called to repopulate the Your Saved Queries list
      //  headleyt:  20210129  Commented out until we can add back in
      // this.populateStoredQueryList();

      //Now load the selection fields.
      this.store.setUserValue('storedqueries', this.queries);
      this.servers = this.store.system['servers'];
      this.databases = this.store.system['databases'];
//  headleyt:  20210108  resetting database list based on the specific user value for the server.  When the databases are initially
//  loaded the default server is unknown until the user data is retrieved
      this.resetDatabaseList(this.defaultServer);
    });
  }

  onServerChanges() {
    this.store.setSystemValue("server", this.store.returnColByStringKey(this.servers, 'id', this.defaultServer, 'offName'));  //returnColByStringKey
    this.store.setSystemValue("servername", this.defaultServer);
    //  headleyt:  20210108  Added a call to pull the original database list and then resetdatabaselist to update the database list
    const results = this.config.getServerConfig();
    this.store.setSystemValue('databases', results.databases);
    this.databases = this.store.system['databases'];
    this.resetDatabaseList(this.store.getSystemValue("servername"));
  }

  onDatabaseChange() {
    this.store.setSystemValue("database", this.defaultDB);
  }

  executeSelectedStoredQuery() {
    this.comm.addNewTabClicked.emit(this.selectedQueryID);
    console.log('after the executeSelectedStoredQuery:  ' + this.store.selectedTab.database);
//    this.defaultDB = this.store.selectedTab.database;
    console.log("database array length:  " + this.databases.length);
  }

  createNewTab() {
    this.comm.addNewTabClicked.emit();
  //  headleyt:  20210112 reset selectedQueryID to minus one for the new tab to reset the buttons
    this.selectedQueryID = -1;
    this.isTableSelected = false;
  }

  saveCurrentQuery() {
    this.comm.saveNewQuery.emit();
  }

  //  headleyt:  20210107  added function to remove databases that don't have the servername identified in the system parameter
  resetDatabaseList(servername)  {
    var found: number;
    var numdatabases: number;
    var dbsystem: string;

    numdatabases = this.databases.length;
    servername = servername.toLowerCase();
    for (let x = numdatabases - 1; x >= 0; x--){
        let obj = this.databases[x];
        dbsystem = obj.system.toLowerCase();
        found = dbsystem.indexOf(servername);
         if (found < 0){
          this.databases.splice(x,1);
        }
    }
    return;
  }

//  headleyt:  20210113  Added function to enable/disable the Save Current Query button after a table has been selected
  setQueryButton(){
    this.isTableSelected = this.store.selectedTab.table.isSelected;
  }

// headley:  20210114  Function after a tab has been selected to determine if there is a table selected on the tab
  setSettingsByTab(){
     if (this.store.selectedTab.table != undefined){
      this.isTableSelected = true;
    }
    else {
      this.isTableSelected = false;
    }
    if (this.store.selectedTab.isstoredquery){
      this.selectedQueryID = this.store.selectedTab.sqid;
    }
    else{
      this.selectedQueryID = -1;
    }

    //  headleyt:  20210122  Changing the value of the default server and database to reflect the values for the selected tab
    //  Currently, this is not the desired action, but I am leaving it here in case it is requested later on.  Changing these values
    //  does not appear to have any effect on the functionality
    // this.defaultDB = this.store.selectedTab.database;
    // this.defaultServer = this.store.selectedTab.servername;
 }

  //  headley:  20210113  Moved this to a function so it can be called to repopulate the list of queries after additiona or subtractions
  populateStoredQueryList(){
//Need to grab a list of the queries for this user
    this.queries = [];
    console.log("populateStoredQueryList");
    this.data.getUserSavedQueries().subscribe((results) => {
      console.log('results:   ' + results.length);
    for(var i=0; i < results.length; i++) {
      var q:Query = new Query();
      q.id = results[i].ID;
      q.title = this.store.customURLDecoder(results[i].QueryTitle);
      q.database = results[i].DatabaseName;
      q.server = results[i].ServerName;
      q.querybody = this.store.customURLDecoder(results[i].QueryBody);
    //  headleyt:  20210106  added qtype as a parameter
      q.qtype = results[i].Qtype;

    //console.log(q.querybody);
       this.queries.push(q);
       console.log("bottom of populatestorequerylist");
      };
    });
  }
}
