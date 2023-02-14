import { Component, OnInit } from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {FormBuilder} from '@angular/forms';
import {StorageService} from '../../services/storage.service';
import {DataService} from '../../services/data.service';
import {ConlogService} from '../../modules/conlog/conlog.service';
import {SelectionModel} from '@angular/cdk/collections';
import {Session} from '../../models/Session.model';
import {ColDef, GridApi } from 'ag-grid-community'

function dateFormatter(dt: any) {
  let dtpart = dt.split("T");
  let timepart = dtpart[1].split(".");
  return dtpart[0] + " " + timepart[0];
}

@Component({
  selector: 'app-session-dialog',
  templateUrl: './session-dialog.component.html',
  styleUrls: ['./session-dialog.component.css']
})
export class SessionDialogComponent implements OnInit {

  activeSessionArr: any = new Session();
  rawSessionArr: any = new Session();
  selectedUsers: any = [];
  columnDefs: any[] = [
    {field: 'CUTID', headerName: 'CUTID', width: 120},
    {field: 'Username', headerName: 'UserName'},
    {field: 'FirstName', headerName: 'First Name'},
    {field: 'LastName', headerName: 'Last Name'},
    {field: 'ActiveSessionDate', headerName: 'Session Date', valueFormatter: (params: any) => dateFormatter(params.data.ActiveSessionDate)}
  ];
  defColDefine: ColDef = { sortable: true, filter: true, resizable: true, autoHeaderHeight: true };
  gridHeaderHeight: number = 22;
  gridRowHeight: number = 22;
  gridApi!: GridApi;
  listLoaded: boolean = false;
  selection = new SelectionModel<Session>(true, []);
  txtSearch: string = "";

  constructor(private dialogRef: MatDialogRef<SessionDialogComponent>, private fb: FormBuilder, public store: StorageService, private data: DataService, private conlog: ConlogService) {
    dialogRef.disableClose = true;
  }

  ngOnInit(): void {
    // Need to go out and get a list of all currently open sessions for the Portal
    this.data.getResetPortalSession('get', '')
      .subscribe((results: Session[]) => {
        if(results != null)
          this.activeSessionArr = this.rawSessionArr = results;

        this.listLoaded = true;
      });
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
  }

  onSelectionChange() {  //event: SelectionChangedEvent
    this.selectedUsers = this.gridApi.getSelectedRows();
  }

  resetSelectedSession() {
    let uid: string = "";

    if(this.selectedUsers.length > 0) {
      for (let i = 0; i < this.selectedUsers.length; i++) {
        uid += ((i > 0) ? "," : "") + this.selectedUsers[i].CUTID;
      }

      this.conlog.log("List CUTID to be reset: " + uid);

      // Call for a reset for the selected users
      this.data.getResetPortalSession('reset', uid)
        .subscribe((results: Session[]) => {
          if(results != null)
            this.activeSessionArr = results;
            this.txtSearch = "";
            this.selection = new SelectionModel<Session>(true, []);
            this.store.generateToast("The selected user(s) Portal session has been reset.");
        });
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  evalSessionSearch() {
    // Used to filter out the search window for the active session dialog
    if(this.txtSearch.length > 0) {
      this.activeSessionArr = this.rawSessionArr.filter((row: any) => (row["Username"].toLowerCase().indexOf(this.txtSearch.toLowerCase()) > -1) ||
          (row["FirstName"].toLowerCase().indexOf(this.txtSearch.toLowerCase()) > -1) || (row["LastName"].toLowerCase().indexOf(this.txtSearch.toLowerCase()) > -1));
    } else
      this.resetSearch();
  }

  resetSearch(){
    this.activeSessionArr = this.rawSessionArr;
    this.txtSearch = "";
  }
}
