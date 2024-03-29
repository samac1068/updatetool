import {Component, EventEmitter, Inject, OnInit} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {StorageService} from '../../services/storage.service';
import {Column} from "../../models/Column.model";

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
  chgRequested: boolean = false;
  onClear = new EventEmitter();
  _searchTerm!: string;
  filPrimColumns!: any[];
  colnamearr: string[] = [];
  primKeyPopulated: boolean = false;

  get searchTerm(){
    return this._searchTerm;
  }

  set searchTerm(value: string) {
    this._searchTerm = value;
    this.filPrimColumns = this.filterColumns(value);
  }
  constructor(public dialogRef: MatDialogRef<PrimkeyDialogComponent>, @Inject(MAT_DIALOG_DATA) public tabinfo: any, private store: StorageService) { }

  ngOnInit() {
    // Getting the information in for this pop means we should populate the dropdown with all the columns except
    this.tabs = this.tabinfo.availcolarr;
    this.selectCols = (this.tabinfo.tempPrimKey == null || this.tabinfo.tempPrimKey[0] == undefined) ? [] : this.tabinfo.tempPrimKey;
    this.selectedcol = this.tabinfo.col;
    this.primKeyPopulated = this.selectCols.length > 0;

    // Only need to be concerned if a column to be altered has been selected to modify its data.  If null, then make available all columns.
    if(this.selectedcol != null) {
      for (let i: number = 0; i < this.tabs.length; i++) {
        if (this.tabs[i].columnname != this.selectedcol) {
          this.availcol.push(this.tabs[i]);
        }
      }
    } else this.availcol = this.tabs;


    // Now pass the list of available columns to the filterable array
    this.filPrimColumns = this.availcol;
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

  filterColumns(filterTerm: string): any {
    if(this.availcol.length == 0 || this.searchTerm === '')
      return this.availcol;
    else {
      return this.availcol.filter((col: Column) => {
        return col.columnname.toLowerCase().indexOf(filterTerm.toLowerCase()) > -1;
      });
    }
  }

  resetSearchTerm() {
    this.searchTerm = "";
  }

  // A column has been selected, so temporarily store in selectCols variable
  columnClickedHandler(col: any) {
    // adjust the values in the selectCols array.  If it exists, then remove it.  If it doesn't, then add it
    if(this.store.isInArray(this.selectCols, col.columnname))
      this.selectCols = this.selectCols.filter((x:string) => x != col.columnname); // Item was in the array, so remove it
    else
      this.selectCols.push(col.columnname.toString()); // Item was NOT in the array, so add it
  }

  // Submit the selected primary key columns to the database to be used later
  submitHandler() {
    let colnamestr: string = "";

    // If at one point there was something there, and now it was removed, we need to just perform the reset and not the normal steps.
    if(this.selectCols.length == 0){
      if(this.primKeyPopulated)    // At one point something was selected, but now all have been removed
        this.clearHandler();
      else
        this.cancelHandler();
    } else {
      // Used to just build the defining message string for the confirmation.  This columnname are not stored.
      this.selectCols.forEach((sc: any) => {
        if (colnamestr.length > 0) colnamestr += ' and ';
        let colname = this.availcol.find((x: any) => x.columnname == sc).columnname.toUpperCase();
        colnamestr += colname;     // This is storing the column ID
        this.colnamearr.push(colname);  // This is storing the column name
      });

      if (confirm("Are you sure you want to make " + colnamestr + " the temporary unique " + ((this.selectCols.length > 1) ? "keys" : "key") + "?"))
        this.dialogRef.close({colids: this.selectCols, colnames: this.colnamearr});
    }
  }

  // Close out the dialog window with no follow-on actions whatsoever
  cancelHandler() {
    this.dialogRef.close();
  }
}
