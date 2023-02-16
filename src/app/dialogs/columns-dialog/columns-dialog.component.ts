import { Column } from '../../models/Column.model';
import { Component, OnInit, Inject } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA, MatDialog} from '@angular/material/dialog';
import { Tab } from 'src/app/models/Tab.model';
import {ConfirmationDialogService} from '../../services/confirm-dialog.service';
import {StorageService} from '../../services/storage.service';
import {DataService} from '../../services/data.service';
import {CommService} from '../../services/comm.service';
import {ColumnOrderDialogComponent} from "../column-order-dialog/column-order-dialog.component";

@Component({
  selector: 'app-columns-dialog',
  templateUrl: './columns-dialog.component.html',
  styleUrls: ['./columns-dialog.component.css']
})
export class ColumnsDialogComponent implements OnInit {

  columnArr!: string[];
  distinctCol: string = "";
  chgMade: boolean = false;
  columnListArr: any;
  _searchTerm!: string;
  filteredColumns!: any[];

  get searchTerm(){
    return this._searchTerm;
  }

  set searchTerm(value: string) {
    this._searchTerm = value;
    this.filteredColumns = this.filterColumns(value);
  }

  constructor(public dialogRef: MatDialogRef<ColumnsDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: Tab, private dialogBox: ConfirmationDialogService, private store: StorageService, private api: DataService, private comm: CommService, public dialog: MatDialog) {
    dialogRef.disableClose = true;
  }

  ngOnInit() {
    this.columnArr = [];

    let storedColumns: any = this.store.getUserValue('storedcolumns');
    if(storedColumns != null) {
      this.columnListArr = storedColumns.filter((row: any) => row.TableName.toUpperCase() == this.data.table.name.toUpperCase() && row.RType == "C");
    }

    //Make sure to initialize this variable EACH time we come to this window
    if(this.data.columns.length > 0) {
      for (let i = 0; i < this.data.columns.length; i++) {
        let isDefCol: boolean = false;
        if(this.columnListArr.length > 0)
          isDefCol = this.columnListArr[0].ColumnNames.indexOf(this.data.columns[i].columnname) > -1;

        if (this.data.columns[i].selected || isDefCol) {
          this.data.columns[i].selected = true;
          this.columnArr.push(this.data.columns[i].tablename.toUpperCase() + "." + this.data.columns[i].columnname.toUpperCase());
        }
      }
    } else this.store.generateToast("Application Error: No columns available.", false);

    // Load the filtered array with the available data.column information
    this.filteredColumns = this.data.columns;

    // Initialize the distinct column operator
    this.distinctCol = this.data.distinctcol;
  }

  columnSelected(col: Column){
    if(!col.selected){
      if(this.columnArr.indexOf(col.tablename + "." + col.columnname) == -1)
        this.columnArr.push(col.tablename + "." + col.columnname);
    }else{
      for(let i=0; i < this.columnArr.length; i++){
        if(this.columnArr[i] == col.tablename + "." + col.columnname){
          this.columnArr.splice(i, 1);
          break;
        }
      }
    }

    this.chgMade = true;

    /*TODO - This is being removed as it bypasses the force database exchange: 08/30/2021 - Let make sure before it is removed. */
    //if(this.columnArr.length == 0) this.resetAllColumns();

    // If nothing is selected, execute reset to set to defaults
    /*if(this.columnArr.length == 0) {
      this.resetStoredColFilterArr();
      this.chgMade = false;
    } else
      this.chgMade = true;*/
  }

  /*resetStoredColFilterArr() {
    this.recordSelectedValues('remove');
  }*/

  recordDistinctCol() {
    this.data.distinctcol = this.distinctCol;
  }

  resetAllColumns(){
    this.columnArr = [];
    this.distinctCol = "";

    for(let i=0; i < this.data.columns.length; i++){
      this.data.columns[i].selected = false;
    }

    this.recordSelectedValues('remove');

    // Reset the values to default column selection
    this.data.colfilterarr = [];
    this.data.colfilterarr.push("*");
    this.data.distinctcol = "";
  }

  filterColumns(filterTerm: string): any {
    if(this.data.columns.length == 0 || this.searchTerm === '')
      return this.data.columns;
    else {
      return this.data.columns.filter((col) => {
        return col.columnname.toLowerCase().indexOf(filterTerm.toLowerCase()) > -1;
      });
    }
  }
  resetSearchTerm() {
    this.searchTerm = "";
  }

  closeDialog() {
    // Make sure they want to close if they haven't applied the selection
    if(this.chgMade && this.columnArr.length > 0) {
      this.dialogBox.confirm('Cancel Confirmation', 'Do you want to save the selected column selections?','Yes','No')
        .then((confirmed) => {
          if(confirmed)
            this.storeSelectedColumns();
          else
            this.resetAllColumns();

          this.dialogRef.close(this.data);
        });
    } else this.dialogRef.close(this.data);
  }

  saveSelectColumns(){
    this.storeSelectedColumns();
    this.closeDialog();
  }

  storeSelectedColumns() {
    //If a distinct column is selected, then we need to make sure it falls first in the list followed by the rest of the selected columns
    if(this.distinctCol != "") {
      for (let d = 0; d < this.columnArr.length; d++) {
        if(this.columnArr[d] == this.distinctCol) {
          this.columnArr.splice(d,1);
          break;
        }
      }

      // Now move the distinct column to the beginning of the list
      this.columnArr.unshift(this.distinctCol);
    }

    this.data.colfilterarr = [];
    this.data.colfilterarr = this.columnArr;
    this.data.distinctcol = this.distinctCol; //Store the selected distinct column name
    this.chgMade = false;

    //We also need to make sure the list of items are marked as selected
    for(let i=0; i < this.data.columns.length; i++)
    {
      if(this.columnArr.indexOf(this.data.columns[i].tablename + "." + this.data.columns[i].columnname) > -1)
        this.data.columns[i].selected = true; //This one was marked
    }

    if(this.columnArr.length > 0)
      this.recordSelectedValues((this.columnListArr.length > 0) ? 'update' : 'insert');
  }

  recordSelectedValues(action: string) {
    // Need to update or insert the values into the appropriate database
    let colSto:any = {};

    if((action == 'update' || action == 'remove') && this.columnListArr.length > 0) {
      colSto.action = action;
      colSto.tablename = this.data.table.name;
      colSto.columnnames = (action == 'remove') ? 'null' : this.columnArr.join();
      colSto.distinctcol = (action == 'remove') ? 'null' : this.distinctCol;
      colSto.id = (action == 'update' || action == 'remove') ? this.columnListArr[0].ID : null;
      colSto.rtype = "C";

      // Call the database service
      this.api.updateUserColumnSelection(colSto)
        .subscribe(results => {
            if (results) {
              this.comm.reloadStoredColumnData.emit();

              this.store.getUserValue('storedcolumns').forEach((row: any, index: number) => {
                if (row.TableName.toUpperCase() == this.data.table.name.toUpperCase() && row.Rtype == "C") {
                  this.store.getUserValue('storedcolumns').splice(index, 1);
                  return;
                }
              });

              this.store.generateToast('Your selection(s) have been stored.');
            }
          },
          error => {
            alert("There was an error while attempt to store your column selection. [" + error + "]");
          });
    }
  }

  orderColumns() {
    // Used to allow users to reorder the display columns of only the selected customized columns - Open a new dialog
    if(this.columnArr.length > 1) {
      const dialogColOrder = this.dialog.open(ColumnOrderDialogComponent, {
        width: '410px',
        height: '500px',
        autoFocus: true,
        data: this.columnArr
      });

      dialogColOrder.afterClosed()
        .subscribe((newColOrder) => {   // We received a new column list
          if(newColOrder != null) {
            this.columnArr = newColOrder;
          }

      });
    }
  }
}
