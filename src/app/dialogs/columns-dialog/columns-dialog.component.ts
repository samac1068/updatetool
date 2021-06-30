import { Column } from '../../models/Column.model';
import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Tab } from 'src/app/models/Tab.model';
import {ConfirmationDialogService} from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-columns-dialog',
  templateUrl: './columns-dialog.component.html',
  styleUrls: ['./columns-dialog.component.css']
})
export class ColumnsDialogComponent implements OnInit {

  columnArr: string[];
  distinctCol: string = "";
  chgMade: boolean = false;

  constructor(public dialogRef: MatDialogRef<ColumnsDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: Tab, private dialogBox: ConfirmationDialogService) {
    dialogRef.disableClose = true;
  }

  ngOnInit() {
    this.columnArr = [];

    //Make sure to initialize this variable EACH time we come to this window
    for(let i = 0; i < this.data.columns.length; i++){
      if(this.data.columns[i].selected)
        this.columnArr.push(this.data.columns[i].tablename.toUpperCase() + "." + this.data.columns[i].columnname.toUpperCase());
    }

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

    // If nothing is selected, execute reset to set to defaults
    if(this.columnArr.length == 0) {
      this.resetColFilterArr();
      this.chgMade = false;
    } else
      this.chgMade = true;
  }

  recordDistinctCol() {
    this.data.distinctcol = this.distinctCol;
  }

  resetAllColumns(){
    this.columnArr = [];
    this.distinctCol = "";

    for(let i=0; i < this.data.columns.length; i++){
      this.data.columns[i].selected = false;
    }

    this.resetColFilterArr();
  }

  resetColFilterArr() {
    this.data.colfilterarr = [];
    this.data.colfilterarr.push("*");
  }

  closeDialog() {
    // Make sure they want to close if they haven't apply the selection
    if(this.chgMade) {
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
    this.data.colfilterarr = [];
    this.data.colfilterarr = this.columnArr;
    this.data.distinctcol = this.distinctCol; //Store the selected distinct column name
    this.chgMade = false;

    //We also need to make sure the list of items are marked as selected
    for(let i=0; i < this.data.columns.length; i++)
    {
      if(this.columnArr.indexOf(this.data.columns[i].columnname) > -1)
        this.data.columns[i].selected = true; //This one was marked
    }
  }
}
