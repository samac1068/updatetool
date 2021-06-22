import { StorageService } from '../../services/storage.service';
import { Column } from '../../models/Column.model';
import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Tab } from 'src/app/models/Tab.model';
import { SortItem } from 'src/app/models/SortItem.model';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-orderby-dialog',
  templateUrl: './orderby-dialog.component.html',
  styleUrls: ['./orderby-dialog.component.css']
})
export class OrderbyDialogComponent implements OnInit {

  selOrderBy: SortItem[];

  constructor(public dialogRef: MatDialogRef<OrderbyDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: Tab, private store: StorageService) { }

  ngOnInit() {
    this.selOrderBy = [];

    if(this.data.orderarr.length > 0)
      this.selOrderBy = this.data.orderarr;
  }

  columnSelected(col: Column){
    //Add or remove the column from the selected order by list
    if(!col.orderby){
      // Recently added
      col.orderbysort = 'DESC';
      this.selOrderBy.push({name: col.columnname.toUpperCase(), sort: 'DESC'});
    } else {
      // Recently removed
      this.selOrderBy.splice(this.store.findIndexByValue(this.selOrderBy, 'name', col.columnname), 1);
    }
  }

  updateSortSelection(col: any){
    col.sort = (col.sort === 'DESC') ? 'ASC' : 'DESC';
    let obj = this.store.findObjByValue(this.data.columns, 'columnname', col.name);

    //Modify the parent info
    if(obj != null)
      obj.orderbysort = col.sort;
  }

  closeDialog() {
    this.dialogRef.close(this.data);
  }

  resetAllColumns(){
    this.selOrderBy = [];

    for(var i=0; i < this.data.columns.length; i++){
      this.data.columns[i].orderby = false;
    }
  }

  saveOrderByColumns(){
     this.data.orderarr = [];
     this.data.orderarr = this.selOrderBy;

     this.closeDialog();
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.selOrderBy, event.previousIndex, event.currentIndex);
  }
}
