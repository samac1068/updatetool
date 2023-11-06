import { JoinDialogComponent } from '../../dialogs/join-dialog/join-dialog.component';
import { CommService } from '../../services/comm.service';
import { DataService } from '../../services/data.service';
import { StorageService } from '../../services/storage.service';
import { Tab } from '../../models/Tab.model';
import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Column } from '../../models/Column.model';

import { ColumnsDialogComponent } from '../../dialogs/columns-dialog/columns-dialog.component';
import { OrderbyDialogComponent } from 'src/app/dialogs/orderby-dialog/orderby-dialog.component';
import { ViewerDialogComponent } from 'src/app/dialogs/viewer-dialog/viewer-dialog.component';

@Component({
  selector: 'app-tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.css']
})
export class TabComponent implements OnInit {

  @Input() tabinfo!: Tab;
  tabid: string = "";

  constructor(private store: StorageService, private data: DataService, private comm: CommService, public dialog: MatDialog) { }

  ngOnInit() {
    //Table was selected
    this.comm.tableSelected
      .subscribe((data) => {
        //Need to pull all the columns for the selected table
        //  headleyt:  20210120  Added a condition so this action will only take place on the active tab
        if (data) {
          if (this.tabinfo === this.store.selectedTab) {
            this.data.getTableProperties(this.tabinfo.server.replace('{0}', this.tabinfo.database), this.tabinfo.database, this.tabinfo.table.name)
              .subscribe((results) => {
                this.tabinfo.columns = [];
                this.tabinfo.availcolarr = [];

                for (let row of results) {
                  var r: Column = new Column();
                  r.tablename = row.TableName;
                  r.columnid = row.ColumnID;
                  r.columnname = row.ColumnName;
                  r.vartype = row.VarType;
                  r.maxlength = row.MaxLength;
                  r.primarykey = row.PrimaryKey;
                  r.precise = row.Precise;
                  r.scale = row.Scale;
                  r.charfulllength = row.CharFullLength;
                  r.selected = this.tabinfo.colfilterarr.indexOf(r.columnname) > -1;
                  r.colSelected = false;

                  this.tabinfo.columns.push(r);
                  this.tabinfo.availcolarr.push(r);
                  if (r.primarykey) this.tabinfo.hasPrimKey = true;
                }

                this.comm.columnsUpdated.emit(this.tabinfo);
              });
          }
        }
      });

    //Custom Column button selected
    this.comm.columnBtnClicked.subscribe(() => {
      if(this.tabinfo === this.store.selectedTab) {
        //Now open the dialog with the information
        const dialogRef = this.dialog.open(ColumnsDialogComponent, { width: '600px', height: '355px', autoFocus: true, data: this.tabinfo });
        dialogRef.afterClosed().subscribe(() => {
          this.comm.runQueryChange.emit();
        });
      }
    });

    //Order By button clicked
    this.comm.orderByBtnClicked.subscribe(() => {
      if(this.tabinfo === this.store.selectedTab) {
        //Open a dialog window
        const dialogRef = this.dialog.open(OrderbyDialogComponent, {width: '600px', height: '450px', autoFocus: true, data: this.tabinfo });
        dialogRef.afterClosed().subscribe(() => {
          this.comm.runQueryChange.emit();
        });
      }
    });

    //Join button clicked
    this.comm.joinBtnClicked.subscribe(() => {
      if(this.tabinfo === this.store.selectedTab) {
        //Open a dialog window
        const dialogRef = this.dialog.open(JoinDialogComponent, {width: '700px', height: '580px', autoFocus: true, data: this.tabinfo, disableClose: true });
        dialogRef.afterClosed().subscribe(() => {
          this.comm.runQueryChange.emit();
        });
      }
    });

    // Proc Viewer clicked
    this.comm.viewerBtnClicked.subscribe(() => {
      if(this.tabinfo === this.store.selectedTab) {
        //Open a dialog window
        this.dialog.open(ViewerDialogComponent, {width: '1000px', height: '730px', autoFocus: true, data: this.tabinfo });
      }
    });

    // A stored query was requested
    if(this.tabinfo.isstoredquery) {
      setTimeout(() => {    // This delay is added to wait until the tab is completely generated before we execute the stored query, otherwise it will appear on the wrong tab.
        if(this.tabinfo === this.store.selectedTab) {
          this.comm.runStoredQuery.emit(this.tabinfo);
        }
      }, 500);
    }
  }

}
