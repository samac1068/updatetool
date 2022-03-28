import { Component, OnInit } from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {FormBuilder} from '@angular/forms';
import {StorageService} from '../../services/storage.service';
import {DataService} from '../../services/data.service';
import {ConlogService} from '../../modules/conlog/conlog.service';
import {CommService} from '../../services/comm.service';
import {SelectionModel} from '@angular/cdk/collections';
import {Session} from '../../models/Session.model';

@Component({
  selector: 'app-session-dialog',
  templateUrl: './session-dialog.component.html',
  styleUrls: ['./session-dialog.component.css']
})
export class SessionDialogComponent implements OnInit {

  cutidArr: any = [];
  activeSessionArr: any = new Session();
  listLoaded: boolean = false;
  selection = new SelectionModel<Session>(true, []);
  displayedColumns: string[] = ['select', 'CUTID', 'FirstName', 'Username', 'LastName', 'ActiveSessionDate'];
  selectedUsers: any = [];

  constructor(private dialogRef: MatDialogRef<SessionDialogComponent>, private fb: FormBuilder, public store: StorageService, private data: DataService, private conlog: ConlogService,
              private comm: CommService) {

    dialogRef.disableClose = true;
  }

  ngOnInit(): void {
    // Need to go out and get a list of all currently open sessions for the Portal
    this.data.getResetPortalSession('get', null)
      .subscribe((results: Session[]) => {
        if(results != null)
          this.activeSessionArr = results;

        this.listLoaded = true;
      });
  }

  isAllSelected() {
    const numSelected = (this.selection.selected != undefined) ? this.selection.selected.length : 0;
    const numRows = (this.activeSessionArr.filteredData != undefined) ? this.activeSessionArr.filteredData.length : 0;
    return (numSelected === numRows) && numSelected > 0;
  }

  checkboxLabel(row?: Session): string {
    if (!row) return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.CUTID + 1}`;
  }

  resetSelectedSession() {
    let uid: string = "";

    if(this.selection.selected.length > 0) {
      for (let i = 0; i < this.selection.selected.length; i++) {
        uid += ((i > 0) ? "," : "") + this.selection.selected[i].CUTID;
      }

      this.conlog.log("List CUTID: " + uid);

      // Call for a reset for the selected users
      this.data.getResetPortalSession('reset', uid)
        .subscribe((results: Session[]) => {
          if(results != null)
            this.activeSessionArr = results;
            this.store.generateToast("The selected user's MOBCOP Portal session has been reset.");
        });
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
