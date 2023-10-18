import { User } from '../../models/User.model';
import { CommService } from '../../services/comm.service';
import { Component, OnInit } from '@angular/core';

import { Database } from '../../models/Database.model';
import { Server } from '../../models/Server.model';
import { StorageService } from '../../services/storage.service';
import { Query } from 'src/app/models/Query.model';
import { DataService } from 'src/app/services/data.service';
import { Tab } from 'src/app/models/Tab.model';

@Component({
  selector: 'app-servers',
  templateUrl: './servers.component.html',
  styleUrls: ['./servers.component.css']
})
export class ServersComponent implements OnInit {
  servers!: Server[];
  databases!: Database[];
  queries!: Query[];
  user!: User;
  tabinfo!: Tab;
  defaultServer: string = "";
  defaultDB: string = "";
  selectedQueryID: number = -1;
  isTableSelected:  boolean = false;
  network!: string;
  isLocalhost: string = "";

  constructor(private store: StorageService, private comm: CommService, private data: DataService) { }

  ngOnInit() {
    this.network = this.store.system['webservice']['network'];

    //Listeners
      this.comm.setQueryButton.subscribe(() => { this.setQueryButton() });  //  enable/disable the Save Current Query when table is selected
      this.comm.populateQueryList.subscribe(() => { this.selectedQueryID = -1; this.populateStoredQueryList() });  //  Repopulate 'Your Saved Queries' dropdown after query is saved
      this.comm.selectTab.subscribe(() => { this.setSettingsByTab() });  //  enable/disable the Save Current Query button when tabs are changed

      this.comm.userInfoLoaded.subscribe(() => {
        //Now we can load and set the default selections for this user
        this.user = this.store.getUser();

        //set default selections
        this.defaultServer = this.store.getUserValue("servername");
        this.defaultDB = this.store.getUserValue("database");

        //Need to grab a list of the queries for this user
        this.populateStoredQueryList();

        // Grab any stored column selection for the user
        this.getUserStoredColumnSelection();

        //Now load the selection fields.
        this.store.setUserValue('storedqueries', this.queries);
        this.servers = this.store.getSystemValue('servers');
        this.databases = this.store.getSystemValue('databases');
        this.isLocalhost = (this.store.system['webservice']['type'] == 'development' && this.store.system['webservice']['path'] == undefined) ? "[LOCALHOST]" : "";
    });

    this.comm.reloadStoredColumnData.subscribe(() => {
      this.getUserStoredColumnSelection();
    });
  }

  onDatabaseChange() {
    this.store.setSystemValue("database", this.defaultDB);
  }

  executeSelectedStoredQuery() {
    this.comm.addNewTabClicked.emit(this.selectedQueryID);
  }

  createNewTab() {
    this.comm.addNewTabClicked.emit();
    this.selectedQueryID = -1;
    this.isTableSelected = false;
  }

  saveCurrentQuery() {
    this.comm.saveNewQuery.emit();
  }

  deleteSelectedQuery() {
    this.comm.deleteSavedQueryClicked.emit(this.selectedQueryID);
  }
  setQueryButton(){
    this.isTableSelected = this.store.selectedTab.table.isSelected;
  }

  setSettingsByTab(){
     this.isTableSelected = this.store.selectedTab.table != undefined;

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

  populateStoredQueryList(){
    this.queries = [];

    this.data.getUserSavedQueries()
      .subscribe((results) => {
        for(let i=0; i < results.length; i++) {
          let q:Query = new Query();
          q.id = results[i].ID;
          q.title = this.store.customURLDecoder(results[i].QueryTitle).toUpperCase();
          q.database = results[i].DatabaseName;
          q.server = results[i].ServerName;
          q.querybody = this.store.customURLDecoder(results[i].QueryBody);
          q.displayquery = this.store.customURLDecoder(results[i].DisplayQuery);
          q.qtype = results[i].Qtype;
          q.columnlist = results[i].ColumnList;

           this.queries.push(q);
        }

        this.store.setUserValue('storedqueries', this.queries);
    });
  }

  getUserStoredColumnSelection() {
    this.data.getUserColumnSelection(this.user.userid)
      .subscribe((results) => {
        this.store.setUserValue('storedcolumns', results);
      });
  }

  cleanUpString(value: string) {
    return value.replace("_", " ");
  }
}
