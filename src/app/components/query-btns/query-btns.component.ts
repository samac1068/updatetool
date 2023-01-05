import { CommService } from '../../services/comm.service';
import { Component, OnInit, Input } from '@angular/core';
import { Tab } from 'src/app/models/Tab.model';
import { MatDialog } from '@angular/material/dialog';
import {DataService} from '../../services/data.service';
import {StorageService} from '../../services/storage.service';
import {User} from '../../models/User.model';
import {ConlogService} from '../../modules/conlog/conlog.service';
import { faColumns, faList, faCompress, faFileText, faFileExcel, faFileClipboard, faKey, faEye } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-query-btns',
  templateUrl: './query-btns.component.html',
  styleUrls: ['./query-btns.component.css']
})
export class QueryBtnsComponent implements OnInit {
  // Font Awesome
  faColumns = faColumns
  faList = faList
  faCompress = faCompress
  faFileText = faFileText
  faFileExcel = faFileExcel
  faFileClipboard = faFileClipboard
  faKey = faKey
  faEye = faEye

  @Input() tabinfo!: Tab;

  user!: User;

  constructor(private comm: CommService, public dialog: MatDialog, private data: DataService, private store: StorageService, private conlog: ConlogService) { }

  ngOnInit() {
    this.comm.columnsUpdated.subscribe((seltab) => {
      this.tabinfo = seltab;
    });
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
    this.comm.validatePrimKey.emit(tabdata);
  }

  exportToExcelHandler(type: string) {
    if(this.tabinfo.table != undefined)
      this.comm.exportToExcelClicked.emit(type);
    else
      alert("You must select a table and have results to export data.");
  }

  copyToClipboard() {
    if(this.tabinfo.table != undefined){
      this.comm.copyToClipboardClicked.emit();
      this.conlog.log("copy to clipboard");
    }
    else
      alert("You must select table and have results to export data.");
  }
}
