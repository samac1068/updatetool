import { CommService } from '../../services/comm.service';
import { Component, OnInit, Input } from '@angular/core';
import { Tab } from 'src/app/models/Tab.model';
import { PrimkeyDialogComponent } from '../../dialogs/primkey-dialog/primkey-dialog.component';
import { MatSort, MatTableDataSource, MatDialog } from '@angular/material';

@Component({
  selector: 'app-query-btns',
  templateUrl: './query-btns.component.html',
  styleUrls: ['./query-btns.component.css']
})
export class QueryBtnsComponent implements OnInit {

  @Input() tabinfo: Tab;
  constructor(private comm: CommService, public dialog: MatDialog) { }

  ngOnInit() {
  }

  openColumnWindow() {
    this.comm.columnBtnClicked.emit();
  }

  openOrderByWindow() {
    this.comm.orderByBtnClicked.emit();
  }

  openJoinWindow() {
    this.comm.joinBtnClicked.emit();
  }

  /*openDataModifier() {
    this.comm.dataModifierClicked.emit();
  }*/

  openViewerWindow() {
    this.comm.viewerBtnClicked.emit();
  }

  openTempPrimaryKey() {
    // Used to reopen the selected primary key for this table
    let tabdata: any = {col: null, tabinfo: this.tabinfo };
    const dialogPrimeKey = this.dialog.open(PrimkeyDialogComponent, { width: '350px', height: '430px', autoFocus: true, data: tabdata });
    dialogPrimeKey.afterClosed().subscribe((ids) => {

      // Store the potentially multiple IDs in a variable
      this.tabinfo.tempPrimKey = ids;

      // Account for all of the primary keys
      if(this.tabinfo.tempPrimKey != null) {
        if (this.tabinfo.tempPrimKey.length > 0) {
          // Need to update our local variable with the information
          for (let c = 0; c < ids.length; c++) {
            let selCol = this.tabinfo.availcolarr.find(x => x.columnid == ids[c]);
            if (selCol != undefined)
              selCol.primarykey = true;
          }
          this.tabinfo.hasPrimKey = true;
        }
      }
    });
  }

  exportToExcelHandler(type: string) {
    if(this.tabinfo.table != undefined)
      this.comm.exportToExcelClicked.emit(type);
    else
      alert("You must select table and have results to export data.");
  }

  copyToClipboard() {
    if(this.tabinfo.table != undefined){
      this.comm.copyToClipboardClicked.emit();
      console.log("copy to clipboard");
    }
    else
      alert("You must select table and have results to export data.");
  }
}
