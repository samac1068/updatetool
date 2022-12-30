import {Component, EventEmitter, Inject, OnInit} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {StorageService} from '../../services/storage.service';

@Component({
  selector: 'app-primkey-dialog',
  templateUrl: './primkey-dialog.component.html',
  styleUrls: ['./primkey-dialog.component.css']
})
export class PrimkeyDialogComponent implements OnInit {

  tabs: any;
  selectedcol: string = "";
  availcol: any = [];
  selectCols: any = [];
  onClear = new EventEmitter();

  constructor(public dialogRef: MatDialogRef<PrimkeyDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any, private store: StorageService) { }

  ngOnInit() {
    // Getting the information in for this pop means we should populate the dropdown with all the columns except
    this.tabs = this.data.tabinfo.availcolarr;
    this.selectCols = this.data.tabinfo.tempPrimKey == null ? [] : this.data.tabinfo.tempPrimKey;
    this.selectedcol = this.data.col;

    // Only need to be concerned if a column to be altered has been selected to modify its data.  If null, then make available all columns.
    if(this.selectedcol != null) {
      for (let i = 0; i < this.tabs.length; i++) {
        if (this.tabs[i].columnname != this.selectedcol) {
          this.availcol.push(this.tabs[i]);
        }
      }
    } else this.availcol = this.tabs;
  }

  // Has the current column been selected as a primary key?
  isItemSelected(colid: number){
    return this.store.isInArray(this.selectCols, colid);
  }

  // Clear all previously selected columns and remove from the database
  clearHandler() {
    this.selectCols = [];
    this.onClear.emit();
  }

  // A column has been selected, so temporarily store in selectCols variable
  columnClickedHandler(col: any) {
    // adjust the values in the selectCols array.  If it exists, then remove it.  If it doesn't, then add it
    if(this.store.isInArray(this.selectCols, col.columnid))
      this.selectCols = this.selectCols.filter((x:number) => x != col.columnid); // Item was in the array, so remove it
    else
      this.selectCols.push(col.columnid.toString()); // Item was NOT in the array, so add it
  }

  // Submit the selected primary key columns to the database to be used later
  submitHandler() {
    let colnamestr: string = "";
    for(let c = 0; c < this.selectCols.length; c++) {
        if(c > 0 ) colnamestr+= ' and ';
        colnamestr+= this.availcol.find((x: any) => x.columnid == this.selectCols[c]).columnname.toUpperCase();
    }

    if(confirm("Are you sure you want to make " + colnamestr + " the temporary unique " + ((this.selectCols.length > 1) ? "keys" : "key") + "?"))
      this.dialogRef.close(this.selectCols);
  }

  // Close out the dialog window with no follow-on actions whatsoever
  cancelHandler() {
    this.dialogRef.close();
  }
}
