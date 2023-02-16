import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {CdkDragDrop, moveItemInArray} from "@angular/cdk/drag-drop";

@Component({
  selector: 'app-column-order-dialog',
  templateUrl: './column-order-dialog.component.html',
  styleUrls: ['./column-order-dialog.component.css']
})
export class ColumnOrderDialogComponent implements OnInit {

  selectColumnList: any = [];

  constructor(public dialogRef: MatDialogRef<ColumnOrderDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    //Copy the currently selected list of columns
    this.selectColumnList = [...this.data];

    //console.log("On entry: " + this.selectColumnList);

    // Update the text and add * to the left and right of column name
    /*this.selectColumnList.forEach((col: string) => {
      col = this.boldColNameOnly(col);
    });*/
  }

  boldColNameOnly(col: string): string {
    let colparts: string[] = col.split(".");
    return colparts[0] + ".*" + colparts[1] + "*";
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.selectColumnList, event.previousIndex, event.currentIndex);
  }

  acceptChanges() {
    this.closeDialog(this.selectColumnList);
  }

  closeDialog(list: any = null) {
    this.dialogRef.close(list);
  }

}
