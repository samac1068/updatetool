import { Component, OnInit } from '@angular/core';
import { Tab } from '../../models/Tab.model';
import { StorageService } from '../../services/storage.service';
import { CommService } from '../../services/comm.service';
import {ConlogService} from '../../modules/conlog/conlog.service';
import {Query} from '../../models/Query.model';
import { faWindowClose } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.css']
})
export class TabsComponent implements OnInit {
  faWindowClose = faWindowClose;
  tabs: Tab[] = [];
  selectedTab: number = -1;
  selectedTabID: string = "";

  constructor(private store: StorageService, private comm: CommService, private conlog: ConlogService) { }

  ngOnInit() {
    this.comm.userInfoLoaded.subscribe(() => {
      //Need to load up the default selected tab for this user
      if(this.store.getUserValue("server") != ""){
        this.store.setSystemValue('server', this.store.getUserValue("server"));
        this.store.setSystemValue('servername', this.store.getUserValue("servername"));
        this.store.setSystemValue('database', this.store.getUserValue("database"));
        this.addTab();
      }
    });

    this.comm.addNewTabClicked.subscribe((data) => {
      this.validateActiveOpen();
      if(data != undefined) {
        this.addTab(data);
      } else
        this.addTab();
    });

    this.comm.deleteSPDialog.subscribe( ()=> {
      this.store.selectedTab.spManager = null;
      this.store.selectedTab.storedProcArr = null;
      this.store.selectedTab.selectedSPName = null;
      this.store.selectedTab.selectedSPProps = null;
      this.store.selectedTab.selectedSPResults = null;
      this.store.selectedTab.spListCollectDate = null;
    });
  }

  validateActiveOpen()
  {
    // This will close any tab that doesn't have a table assignment yet. This is used prior to adding a new tab only
    for(let t: number = 0; t < this.tabs.length; t++)
    {
      if(this.tabs[t].table == undefined)
        this.tabs.splice(t, 1); // Table assigned made for this existing table, so let's delete it before we add
    }
  }

  addTab(queryid?: string) {
    //Create a new tab
    let tabCont:Tab = new Tab();
    tabCont.tabid = "tab0" + (this.tabs.length + 1);
    tabCont.tabindex = this.tabs.length;

    if(queryid != undefined) {
      //The user has selected a stored query, so feed the info.
      let queries: Query[] = this.store.getUserValue('storedqueries');

      for(let i=0; i < queries.length; i++) {
        if(queries[i].id === parseInt(queryid))
        {
          tabCont.isstoredquery = true;
          tabCont.sqid = parseInt(queryid);
          tabCont.server = this.store.getSystemValue("server");
          tabCont.servername = this.store.getSystemValue("servername"); //this.store.returnColByStringKey(this.store.system['servers'], 'offName', tabCont.server, 'id');
          tabCont.database = queries[i].database;
          tabCont.sqbody = queries[i].querybody;
          tabCont.rawquerystr = this.store.customURLDecoder(queries[i].querybody);
          tabCont.querystr = (queries[i].displayquery == "") ? this.store.customURLDecoder(queries[i].querybody) : this.store.customURLDecoder(queries[i].displayquery);
          tabCont.sqcolumns = (queries[i].columnlist != null) ? queries[i].columnlist.split(",") : null;

          this.conlog.log("QueryBody: " + queries[i].querybody + " - " + this.store.customURLDecoder(queries[i].querybody));
         break;
        }
      }
    } else {
      tabCont.server = this.store.getSystemValue("server");
      tabCont.servername = this.store.getSystemValue("servername");
      tabCont.database = this.store.getSelectedDBName(this.store.getSystemValue("database"));
    }

    tabCont.tabtitle = tabCont.database.toUpperCase() + ((queryid != undefined) ? " - [SVD QRY]" : "");
    tabCont.tabAltText = tabCont.servername + " - " + tabCont.database;
    tabCont.databasearr = [];
    tabCont.databasearr.push({id: tabCont.databasearr.length + 1, name: tabCont.database });
    tabCont.tablearr = [];
    tabCont.availcolarr = [];
    tabCont.active = false;

    this.tabs.push(tabCont);
    this.selectTab(this.tabs[this.tabs.length - 1]);
  }

   selectTab(tab: Tab)
   {
    if(this.selectedTab != this.tabs.length) {  // Only the concern if a tab was added.
      for (let i: number = 0; i < this.tabs.length; i++)
        this.tabs[i].active = false;

      tab.active = true;

      this.selectedTab = tab.tabindex;
      this.selectedTabID = tab.tabid;
      this.store.selectedTabID = tab.tabid;
      this.store.selectedTab = tab;

      if(this.store.selectedTab.tablearr.length > 0 || this.store.selectedTab.isstoredquery) {
        if (this.store.selectedTab.isstoredquery)
          this.comm.runStoredQuery.emit(this.store.selectedTab);
        else {
          this.comm.newTabClicked.emit();
          this.comm.selectTab.emit();
        }
      }
    }
  }

  updateActiveTabID(evt: any)
  {
    if(this.tabs.length > 0)
        this.selectTab(this.tabs[evt.index]);
  }

  removeTab(index: number)
  {
    if(this.selectedTab == index){ // Is the tab to be deleted currently selected?
      if((this.tabs.length - 1) > 0) { // Make sure we have a tab to the left, if not then ignore.
        this.selectTab(this.tabs[index - 1]);
      }
    }

    this.tabs.splice(index, 1);
  }
}
