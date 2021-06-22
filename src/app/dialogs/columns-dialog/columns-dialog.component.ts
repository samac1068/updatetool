import { Column } from './../../models/Column.model';
import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Tab } from 'src/app/models/Tab.model';

@Component({
  selector: 'app-columns-dialog',
  templateUrl: './columns-dialog.component.html',
  styleUrls: ['./columns-dialog.component.css']
})
export class ColumnsDialogComponent implements OnInit {

  columnArr: string[];
  constructor(public dialogRef: MatDialogRef<ColumnsDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: Tab) { }

  ngOnInit() {
    this.columnArr = [];

    //Make sure to initialize this variable EACH time we come to this window
    for(var i = 0; i < this.data.columns.length; i++){
      if(this.data.columns[i].selected)
        this.columnArr.push(this.data.columns[i].columnname.toUpperCase());
    }
  }

  columnSelected(col: Column){
    if(!col.selected){
      if(this.columnArr.indexOf(col.columnname) == -1)
        this.columnArr.push(col.columnname);
    }else{
      for(var i=0; i < this.columnArr.length; i++){
        if(this.columnArr[i] == col.columnname){
          this.columnArr.splice(i, 1);
          break;    
        }
      }
    }
  }

  resetAllColumns(){
    this.columnArr = [];

    for(var i=0; i < this.data.columns.length; i++){
      this.data.columns[i].selected = false;
    }
  }

  closeDialog() {
    this.dialogRef.close(this.data);
  }

  saveSelectColumns(){
    this.data.colfilterarr = [];
    this.data.colfilterarr = this.columnArr;

    //We also need to make sure the list of items are marked as selected
    for(var i=0; i < this.data.columns.length; i++)
    {
      if(this.columnArr.indexOf(this.data.columns[i].columnname) > -1)
        this.data.columns[i].selected = true; //This one was marked
    }
    
    //Finally close the window
    this.closeDialog();
  }
}
