import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material';
import {CommService} from '../../services/comm.service';
import {DataService} from '../../services/data.service';
import {StorageService} from '../../services/storage.service';

@Component({
  selector: 'app-primkey-dialog',
  templateUrl: './primkey-dialog.component.html',
  styleUrls: ['./primkey-dialog.component.css']
})
export class PrimkeyDialogComponent implements OnInit {

  tabs: any;
  selectcol: string = "";
  availcol: any = [];
  selectCols: any = [];

  constructor(public dialogRef: MatDialogRef<PrimkeyDialogComponent>, @Inject(MAT_DIALOG_DATA) private data: any, private store: StorageService) { }

  ngOnInit() {
    // Getting the information in for this pop means we should populate the dropdown with all the columns except
    this.tabs = this.data.tabinfo.availcolarr;
    this.selectCols = this.data.tabinfo.tempPrimKey;

    // Only need to be concerned if a column to be altered has been selected.  If null, this make available all columns.
    this.selectcol = this.data.col;
    if(this.selectcol != null) {
      for (let i = 0; i < this.tabs.length; i++) {
        if (this.tabs[i].columnname != this.selectcol) {
          this.availcol.push(this.tabs[i]);
        }
      }
    } else this.availcol = this.tabs;
  }

  isItemSelected(colid){
     return this.store.isInArray(this.data.tabinfo.tempPrimKey, colid);
  }

  submitHandler() {
    let colnamestr: string = "";
    for(let c = 0; c < this.selectCols.length; c++){
        if(c > 0 ) colnamestr+= ' and ';
        colnamestr+= this.availcol.find(x => x.columnid == this.selectCols[c]).columnname;
    }

    if(confirm("Are you sure you want to make " + colnamestr + " the temporary unique " + ((this.selectCols.length > 1) ? "keys" : "key") + "?"))
      this.cancelHandler();
  }

  cancelHandler() {
    this.dialogRef.close(this.selectCols);
  }
}
