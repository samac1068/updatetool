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

  joinclausearr: Join[] = [];    //Maintains all of the various joins for this tab

  // List of temporary holding variables
  tleftdbarr: any[] = [];
  tleftdb: string = "";
  tlefttable: string = "";
  tleftcolumn: string = "";
  tlefttblarr: any[] = [];
  tleftcolarr: Column[] = [];

  trightdbarr: any[] = [];
  trightdb: string = "";
  trighttable: string = "";
  trightcolumn: string = "";
  trighttblarr: any[] = [];
  trightcolarr: Column[] = [];

  tjtype: string = "LEFT JOIN";
  tjop: string = "=";
  tjoinid: number = -1;

  useDefault: boolean = false;

  constructor(public dialogRef: MatDialogRef<JoinDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: Tab, private store: StorageService,
  private ws: DataService, private dialogBox: ConfirmationDialogService, private comm: CommService, private conlog: ConlogService) { }

  ngOnInit() {
      // Get the stored information from the tab
      this.server = this.store.system['webservice']['locale'];
      this.serverfull = this.store.returnColByStringKey(this.store.system['servers'], 'id', this.server, 'offName');
      this.tleftdbarr = this.trightdbarr = this.store.getSystemValue('databases')
      this.operators = this.store.operators;
      this.joinclausearr = this.data.joinarr;

      // If we don't have any other joins, then disable the left side with the primary db and table
      this.checkForDefaults();
  }

  findIndexByID(id: number){
    for(let k=0; k < this.joinclausearr.length; k++){
      if(this.joinclausearr[k].jid == id){
        return k;
      }
    }

    return -1;
  }

  identifyLimitSide(side: string){
    let tbl = (side === "left") ? this.tlefttable : this.trighttable;
    let i: number;
    let found: boolean = false;

    if(this.joinclausearr.length > 0) {
      // Search for the table
      for(i = 0; i < this.joinclausearr.length; i++) {
        if(this.joinclausearr[i].tableleft == tbl || this.joinclausearr[i].tableright == tbl) {
          found = true;
          break;
        }
      }

      if(!found) {
        //We need to limit the database and tables on the remaining side - Only display those items currently available in the join
        let dbarr = [];
        let tblarr = [];

        for(i = 0; i < this.joinclausearr.length; i++) {

          // Add the databases to the temp arr
          if(this.store.findIndexByValue(dbarr, 'id', this.joinclausearr[i].dbleft) == -1)
            dbarr.push({id: this.joinclausearr[i].dbleft});

          if(this.store.findIndexByValue(dbarr, 'id', this.joinclausearr[i].dbright) == -1)
            dbarr.push({id: this.joinclausearr[i].dbright});

          // Add the table to the temp arr
          //console.log('tblarr length - before:  ' + tblarr.length);
          if(this.store.findIndexByValue(tblarr, 'id', this.joinclausearr[i].tableleft) == -1)
            tblarr.push({Name: this.joinclausearr[i].tableleft});

          //console.log("tblarr length - after:  " + tblarr.length);
          if(this.store.findIndexByValue(tblarr, 'id', this.joinclausearr[i].tableright) == -1)
            tblarr.push({Name: this.joinclausearr[i].tableright});
        }

        // With the list created, now assign them to the appropriate dropdown
        if(side == 'left') {
          this.tleftdbarr = dbarr;
          this.tlefttblarr = tblarr;
        } else {
          this.trightdbarr = dbarr;
          this.trighttblarr = tblarr;
        }
      }
    }
  }

  checkForDefaults(){
    if(this.joinclausearr.length == 0) {
      this.useDefault = true;
      this.tleftdb = this.data.database;
      this.tlefttable = this.data.table.name;
      this.getAvailableTables('left');
      this.getAvailableColumns('left');
    }
  }

  //Handler when a Database is selected
  getAvailableTables(side: string){
    this.msgarr = "";

    this.ws.getTableDBList(
      this.serverfull.replace('{0}',
        (side == "left") ? this.store.getSelectedDBName(this.tleftdb) : this.store.getSelectedDBName(this.trightdb)),
      (side == "left") ? this.store.getSelectedDBName(this.tleftdb) : this.store.getSelectedDBName(this.trightdb))
    .subscribe((results) => {
//  headleyt:  20210218  Added a check on the size of the joinclausearr to see if there are 5 rows already.  If there are 5 rows already, no more can be added
      if (this.joinclausearr.length >= 5){
        this.msgarr = "You cannot have more than 4 join statements. Please try again.";
      }
      else
      {
        let arr: any = [];
        for(let i = 0; i < results.length; i++) {
            arr.push(results[i]);
        }

        //Now add to the appropriate side
        if(side == "left")
          this.tlefttblarr = arr;
        else
          this.trighttblarr = arr;
      }
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

 //  headleyt:  20210218  Based on what side is being populated, clearing out the table array before to it to prevent the previous
 //     table selection columns from being available in the column list
      if (side === "left") this.tleftcolarr = []; else this.trightcolarr = [];

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
            if(side == "left")
              this.tleftcolarr.push(r);
            else
              this.trightcolarr.push(r);
          }
        });
    }
  }

  doesDatabaseExistInArr(db: string) {
    return (this.store.findObjByValue(this.data.databasearr, 'name', db) > -1);
  }

  doesTableExistInArr(tbl: string) {
    return (this.store.findObjByValue(this.data.tablearr,'Name', tbl) > -1);
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
    this.comm.runQueryChange.emit();
  }

  addJoin() {
    let temp: Join = new Join();
    temp.jid = this.joinclausearr.length + 1;
    temp.type = this.tjtype;

    temp.dbleft = this.tleftdb;
    temp.tableleft = this.tlefttable;
    temp.columnleft = this.tleftcolumn;

    temp.dbright = this.trightdb;
    temp.tableright = this.trighttable;
    temp.columnright = this.trightcolumn;

    temp.operator = this.tjop;

    //Properly construct the where clause.
    temp.joinclausestr = temp.type;

    this.msgarr = "";

//  headleyt:  20210224 Added a check to see

    if(temp.tableleft != this.data.table.name) {
      for (let i = 0; i < this.joinclausearr.length; i++){
        if (this.joinclausearr[i].joinclausestr.indexOf("[" + temp.dbleft + "]..[" + temp.tableleft + "]") > 0)
          temp.joinclausestr = temp.type + " [" + temp.dbright + "]..[" + temp.tableright + "] ON [" + temp.tableleft + "].[" + temp.columnleft + "] " + temp.operator +
                        " [" + temp.tableright + "].[" + temp.columnright + "]";
        else
          temp.joinclausestr = temp.type + " [" + temp.dbleft + "]..[" + temp.tableleft + "] ON [" + temp.tableleft + "].[" + temp.columnleft + "] " + temp.operator +
          " [" + temp.tableright + "].[" + temp.columnright + "]";
      }
    }
    else
      temp.joinclausestr = temp.type + " [" + temp.dbright + "]..[" + temp.tableright + "] ON [" + temp.tableleft + "].[" + temp.columnleft + "] " + temp.operator +
                        " [" + temp.tableright + "].[" + temp.columnright + "]";


    //  headleyt;  20210219  Added a check on the length of the join string.  It seems it is good with 260 but not good at 278 characters
    if ((this.checkJoinClauseLength() + temp.joinclausestr.length) > 260)
      this.msgarr = "The join string cannot be more than 260 characters. This join will not be added.";
    else {
      this.joinclausearr.push(temp);
      this.data.columns = this.data.columns.concat(this.trightcolarr); // Need to add the joined table's column to the list of available columns, so they can be limited using the column limiter.
    }

    this.resetAllFields();
  }

  //  headleyt:  20210219  Added function to check the length of the join string to be added.  Adding one to it to account for the spade that
  //   needs to be added between each join clause
  checkJoinClauseLength(){
    let iJoinLength: number = 0;
    for (let i = 0; i < this.joinclausearr.length; i++){
      iJoinLength += this.joinclausearr[i].joinclausestr.length;
    }
    return iJoinLength + 1;
  }

  removeJoinItem(itemid: number) {
    this.dialogBox.confirm('Confirm Deletion', 'Are you sure you want to delete this item?')
    .then((confirmed) => {
      // Remove the join columns from the available column array
      this.data.columns = this.data.columns.filter(item => item.tablename != this.joinclausearr[this.findIndexByID(itemid)].tableright);
      this.joinclausearr.splice(this.findIndexByID(itemid),1);
      this.resetAllFields();
    });
  }

  editJoinItem(itemid: number = -1) {
    //Populate this items which will update the select fields
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
}
