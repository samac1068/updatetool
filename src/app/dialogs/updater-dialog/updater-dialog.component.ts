import {Component, Inject, OnInit} from '@angular/core';
import {Tab} from '../../models/Tab.model';
import {StorageService} from '../../services/storage.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

@Component({
  selector: 'app-updater-dialog',
  templateUrl: './updater-dialog.component.html',
  styleUrls: ['./updater-dialog.component.css']
})
export class UpdaterDialogComponent implements OnInit {

  strQuery: string = "";
  curValue: string = "";
  newValue: string = "";
  selcol: any;
  genSentence: boolean = true;

  constructor(public dialogRef: MatDialogRef<UpdaterDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any, private store: StorageService) { }

  ngOnInit() {
    // Generate the query for display
    this.selcol = this.data.tabinfo.availcolarr.find(x => x.columnname == this.data.tabinfo.table["selectedColumn"]);
    this.curValue = this.data.tabinfo.table["curvalue"];

    // Do we already have a permanent primary key? If so we will use this in the tempPrimKey variable
    if(this.data.tabinfo.tempPrimKey == null) {
      this.data.tabinfo.tempPrimKey = [];
      this.data.tabinfo.tempPrimKey.push(this.data.tabinfo.availcolarr.find(x => x.primarykey == true).columnid);
    }

    if(this.genSentence)
      this.updaterSentenceGenerator();
    else
      this.setTheQueryText();
  }

  setTheQueryText() {
    // Create the update statement
    this.strQuery = "UPDATE [" + this.data.tabinfo.database + "]..[" + this.data.tabinfo.table.name + "] SET " + this.data.tabinfo.table["selectedColumn"] + " = ";
    this.strQuery += this.store.determineValueType(((this.newValue.length > 0) ? this.newValue : this.data.tabinfo.table["curvalue"]), this.selcol.vartype);
    this.strQuery += " WHERE " + this.generateWhereClause();
  }

  updaterSentenceGenerator() {
    // Basically we are replacing sql statement with a common sentence
    this.strQuery = "Update " + this.data.tabinfo.table.name;
    this.strQuery += " change " + this.data.tabinfo.table["selectedColumn"] + " to ";
    this.strQuery += (this.newValue.length > 0) ? this.newValue : this.data.tabinfo.table["curvalue"];
    this.strQuery += " where " + this.generateWhereClause();
  }

  generateWhereClause() {
    let wStatement: string = "";
    if(this.data.tabinfo.tempPrimKey != null) {
      for (let c = 0; c < this.data.tabinfo.tempPrimKey.length; c++) {
        let primecol = this.data.tabinfo.availcolarr.find(x => x.columnid == this.data.tabinfo.tempPrimKey[c]);

        // If more than one limiter needs to be separated by the phrase 'AND'
        if (c > 0) wStatement += (this.genSentence) ? " and " : " AND ";

        // Depending on if a sentence or SQL statement add the number of where items now.
        if (this.genSentence)
          wStatement += primecol.columnname + " equals " + this.data.tabinfo.selectedrow[primecol.columnname];
        else
          wStatement += primecol.columnname + " = " + this.store.determineValueType(this.data.tabinfo.selectedrow[primecol.columnname], primecol.vartype);
      }
    }
    return wStatement;
  }

  closeHandler() {
    this.dialogRef.close(this.data.tabinfo);
  }

  submitHandler() {
    console.log("submitHandler");
    if(this.newValue != null) {
      if(this.newValue.length > 0)
      this.data.tabinfo.table["setvalue"] = this.newValue;
    } else
      alert("No value updated; operation canceled.");

    this.closeHandler();
  }
}
