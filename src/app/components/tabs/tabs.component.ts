import { Component, OnInit, ViewChild} from '@angular/core';
import { Tab } from '../../models/Tab.model';
import { StorageService } from '../../services/storage.service';
import { CommService } from '../../services/comm.service';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.css']
})
export class TabsComponent implements OnInit {

  tabs: Tab[] = [];
  selectedTab: number = -1;
  selectedTabID: string = "";

  constructor(private store: StorageService, private comm: CommService) { }

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
      if(data != undefined) {
        this.addTab(data);
      } else
        this.addTab();
    });
  }

  addTab(queryid?: string) {
    //Create a new tab
    let tabCont:Tab = new Tab();
    tabCont.tabid = "tab0" + (this.tabs.length + 1);
    tabCont.tabindex = this.tabs.length;

    if(queryid != undefined) {
      //The user has selected a stored query, so feed the info.
      let queries: any[] = this.store.getUserValue('storedqueries');

      for(let i=0; i < queries.length; i++) {
        if(queries[i].id === parseInt(queryid))
        {
          tabCont.isstoredquery = true;
          tabCont.sqid = parseInt(queryid);
          tabCont.server = queries[i].server;
          tabCont.servername = this.store.returnColByStringKey(this.store.system['servers'], 'offName', tabCont.server, 'id');
          tabCont.database = queries[i].database;
          tabCont.sqbody = queries[i].querybody;
          tabCont.rawquerystr = queries[i].querybody;
          tabCont.querystr = (queries[i].displayquery == "") ? queries[i].querybody : queries[i].displayquery;
         break;
        }
      }
    } else {
      tabCont.server = this.store.getSystemValue("server");
      tabCont.servername = this.store.getSystemValue("servername");
      tabCont.database = this.store.getSelectedDBName(this.store.getSystemValue("database"));
    }

    tabCont.databasearr = [];
    tabCont.databasearr.push({id: tabCont.databasearr.length + 1, name: tabCont.database });
    tabCont.tabtitle = tabCont.servername.toUpperCase() + " - " + tabCont.database.toUpperCase() + " ";
    tabCont.tablearr = [];
    tabCont.availcolarr = [];

    tabCont.active = false;

    this.tabs.push(tabCont);

    this.selectTab(this.tabs[this.tabs.length - 1]);

  }

   selectTab(tab: Tab) {
    for(let i =0; i < this.tabs.length; i++)
      this.tabs[i].active = false;

    tab.active = true;

    this.selectedTab = tab.tabindex;
    this.selectedTabID = tab.tabid;
    this.store.selectedTabID = tab.tabid;
    this.store.selectedTab = tab;

    //headleyt:  20210121  Raise event when a tab has been selected so the Save Current Query button will turn enable/disable based on whether a table has been selected
    this.comm.selectTab.emit();
  }

  updateActiveTabID(evt: any) {
    if(this.tabs.length > 0)
      this.selectTab(this.tabs[evt.index]);
  }

  removeTab(index: number) {
    this.tabs.splice(index, 1);
  }
}
