import { Join } from '../../models/Join.model';
import { StorageService } from '../../services/storage.service';
import { Column } from '../../models/Column.model';
import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Tab } from 'src/app/models/Tab.model';
import { DataService } from 'src/app/services/data.service';
import { ConfirmationDialogService } from 'src/app/services/confirm-dialog.service';
import {CommService} from '../../services/comm.service';
import {ConlogService} from '../../modules/conlog/conlog.service';
import {faPencil, faTrash} from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: 'app-join-dialog',
  templateUrl: './join-dialog.component.html',
  styleUrls: ['./join-dialog.component.css']
})
export class JoinDialogComponent implements OnInit {

  serverfull: string = "";
  server: string = "";

  //Local Global Variables
  operators: string[] = [];
  msgarr: string = "";
  joinclausearr: Join[] = [];    //Maintains the various joins for this tab

  // List of temporary holding variables
  tleftdbarr: any[] = [];
  tleftdb: string = "";
  tlefttable: string = "";
  tleftcolumn: string = "";
  tlefttblarr: any[] = [];
  tleftcolarr: Column[] = [];
  tleftalias: string = "";

  trightdbarr: any[] = [];
  trightdb: string = "";
  trighttable: string = "";
  trightcolumn: string = "";
  trighttblarr: any[] = [];
  trightcolarr: Column[] = [];
  trightalias: string = "";

  tjtype: string = "LEFT JOIN";
  tjop: string = "=";
  tjoinid: number = -1;

  useDefault: boolean = false;

  constructor(public dialogRef: MatDialogRef<JoinDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: Tab, private store: StorageService,
              private ws: DataService, private dialogBox: ConfirmationDialogService, private comm: CommService, private conlog: ConlogService) { }

  ngOnInit() {
      // Get the stored information from the tab
      this.server = this.store.system['webservice']['type'];
      this.serverfull = this.store.getSystemValue("server");
      this.tleftdbarr = this.trightdbarr = this.store.getSystemValue('databases')
      this.operators = this.store.operators;
      this.joinclausearr = this.data.joinarr;

      // If we don't have any other joins, then disable the left side with the primary db and table
      this.checkForDefaults();
  }

  findIndexByID(id: number){
    for(let k: number = 0; k < this.joinclausearr.length; k++){
      if(this.joinclausearr[k].jid == id){
        return k;
      }
    }

    return -1;
  }

  checkForDefaults(){
    if(this.joinclausearr.length == 0) {
      this.useDefault = true;
      this.tleftdb = this.data.database;
      this.tlefttable = this.data.table.name;

      this.getAvailableTables("left");
      this.getAvailableColumns('left');
    }
  }

  //Handler when a Database is selected
  getAvailableTables(side: string){
    this.msgarr = "";

    const serverinfo = (side == "left") ? this.store.getSelectedDBName(this.tleftdb) : this.store.getSelectedDBName(this.trightdb);
    const dbinfo = (side == "left") ? this.store.getSelectedDBName(this.tleftdb) : this.store.getSelectedDBName(this.trightdb);

    this.ws.getTableDBList( this.serverfull.replace('{0}', serverinfo), dbinfo)
    .subscribe((results) => {
        let arr: any = [];
        for(let i = 0; i < results.length; i++) {
            arr.push(results[i]);
        }

        //Now add to the appropriate side
        if(side == "left")
          this.tlefttblarr = arr;
        else
          this.trighttblarr = arr;
    });
  }

  //Handler when table is selected
  getAvailableColumns(side: string) {
    //A table was selected, so we must also limit the opposing side or identify this side as the limited one - only if the other side is blank
    this.msgarr = "";
    if(this.tlefttable === this.trighttable) {
      this.msgarr = "You cannot have the same table on both sides of the join statement. Please try again.";
      setTimeout(() => {
        if(side === "left")
          this.tlefttable = "";
        else
          this.trighttable = "";
      });
    }
    else {
      /* headleyt:  20210218  Based on what side is being populated, clearing out the table array before to prevent the previous table selection
      columns from being available in the column list */
      (side == "left") ? this.tleftcolarr = [] : this.trightcolarr = [];

      this.ws.getTableProperties(this.serverfull.replace('{0}',
        (side == "left") ? this.store.getSelectedDBName(this.tleftdb) : this.store.getSelectedDBName(this.trightdb)),
        (side == "left") ? this.store.getSelectedDBName(this.tleftdb) : this.store.getSelectedDBName(this.trightdb),
        (side == "left") ? this.tlefttable : this.trighttable)
        .subscribe((results) => {
          for(let row of results)
          {
            let r: Column = new Column();
            r.tablename = row.TableName;
            r.columnid = row.ColumnID;
            r.columnname = row.ColumnName;
            r.vartype = row.VarType;
            r.maxlength = row.MaxLength;
            r.primarykey = row.PrimaryKey;
            r.precise = row.Precise;
            r.scale = row.Scale;
            r.charfulllength = row.CharFullLength;

            //Shove into the appropriate columns side
            (side == "left") ? this.tleftcolarr.push(r) : this.trightcolarr.push(r);
          }
        });
    }
  }

  resetAllFields() {
    this.tleftdb = "";
    this.tlefttable = "";
    this.tleftcolumn = "";
    this.tlefttblarr = [];
    this.tleftcolarr = [];

    this.trightdb = "";
    this.trighttable = "";
    this.trightcolumn = "";
    this.trighttblarr = [];
    this.trightcolarr = [];

    this.tjtype = "LEFT JOIN";
    this.tjop = "=";
    this.tjoinid = -1;

    this.useDefault = false;

    this.checkForDefaults();
  }

  closeDialog() {
    this.dialogRef.close(this.data);
  }

  saveJoinClause() {
    this.data.joinarr = this.joinclausearr;

    // Full Value View
    console.log(this.data.joinarr);
    this.data.joinarr.forEach((r) => {
      let len:number = 0;
      len += r.joinclausestr.length;
      console.log("join string length: " + len);
    });

    this.comm.runQueryChange.emit();
  }

  addJoin() {
    let temp: Join = new Join();
    temp.jid = this.joinclausearr.length + 1;
    temp.type = this.tjtype;

    temp.dbleft = this.tleftdb;
    temp.tableleft = this.tlefttable;
    temp.columnleft = this.tleftcolumn;
    temp.aliasleft = "";

    temp.dbright = this.trightdb;
    temp.tableright = this.trighttable;
    temp.columnright = this.trightcolumn;
    temp.aliasright = "";

    temp.operator = this.tjop;

    this.msgarr = "";

    // We are currently only going to allow to have 8 join statements at this time
    if(this.data.joinarr.length <= 7) {
      // Need to verify that left table is either primary or in the collection, and right table is NOT primary.  The right table can appear in the collection without a problem
      if (this.searchForTable(temp.tableleft) || temp.tableleft == this.data.table.name) {
        // Search for an alias for the left table
        this.joinclausearr.forEach((j: Join): any => {
          if ((j["tableleft"] == temp.tableleft) && j["aliasleft"] != "")
            temp.aliasleft = j["aliasleft"];
        });

        // If the right table was used previous, then we need to auto add an alias.  First two charcters of the table name + a number representing the number of additional tables.
        if (this.store.rtnCountTimesFoundInArr(this.joinclausearr, "tableright", temp.tableright) > 0)
          temp.aliasright = temp.tableright.substring(0, 1) + (this.store.rtnCountTimesFoundInArr(this.joinclausearr, "tableright", temp.tableright) + 1);

        // Build the statement
        temp.joinclausestr = temp.type;   // JOIN TYPE
        temp.joinclausestr += " [" + temp.dbright + "]..[" + temp.tableright + "]"   // RIGHT TABLE
        temp.joinclausestr += temp.aliasright // RIGHT ALIAS
        temp.joinclausestr += " ON ";
        temp.joinclausestr += (temp.aliasleft.length > 0) ? temp.aliasleft + ".[" + temp.columnleft + "] " : "[" + temp.tableleft + "].[" + temp.columnleft + "] ";  // LEFT TABLE
        temp.joinclausestr += temp.operator   // Operator
        temp.joinclausestr += (temp.aliasright.length > 0) ? temp.aliasright + ".[" + temp.columnright + "]" : "[" + temp.tableright + "].[" + temp.columnright + "]";  // RIGHT TABLE
      } else
        this.msgarr = "You are attempting to join to a table not previously used. This is an invalid join request.";

      // Store the newly constructed join information
      this.conlog.log("add join:" + temp);
      this.joinclausearr.push(temp);
      this.data.columns = this.data.columns.concat(this.trightcolarr); // Need to add the joined table's column to the list of available columns, so they can be limited using the column limiter.
    } else {
      this.msgarr = "You can only have a maximum of 8 individual join statements. You need to remove one to add a new statement.";
    }

    this.resetAllFields();
  }

  removeJoinItem(itemid: number) {
    this.dialogBox.confirm('Confirm Deletion', 'Are you sure you want to delete this item?')
    .then(() => {
      // Remove the join columns from the available column array
      this.data.columns = this.data.columns.filter(item => item.tablename != this.joinclausearr[this.findIndexByID(itemid)].tableright);
      this.joinclausearr.splice(this.findIndexByID(itemid),1);
      this.resetAllFields();
    });
  }

  editJoinItem(itemid: number = -1) {
    //Populate these items which will update the select fields
    let temp: Join = this.joinclausearr[this.findIndexByID(itemid)];

    this.tleftdb = temp.dbleft;
    this.tlefttable = temp.tableleft;
    this.tleftcolumn = temp.columnleft;

    this.trightdb = temp.dbright;
    this.trighttable = temp.tableright;
    this.trightcolumn = temp.columnright;

    this.tjtype = temp.type;
    this.tjop = temp.operator;
    this.tjoinid = temp.jid;

    //Need to populate these items automatically
    this.getAvailableTables('left');
    this.getAvailableColumns('left');
    this.getAvailableTables('right');
    this.getAvailableColumns('right');
  }

  searchForTable(tblName: string, side: string = "r"): boolean {
    let count: number = 0;

    if(side == "l") {
      this.joinclausearr.forEach((join: Join) => {
        (join["tlefttable"] == tblName && count++)
      });
    } else {
      this.joinclausearr.forEach((join: Join) => {
        (join["trighttable"] == tblName && count++)
      });
    }

    return count > 0;
  }

  protected readonly faTrash = faTrash;
  protected readonly faPencil = faPencil;
}
