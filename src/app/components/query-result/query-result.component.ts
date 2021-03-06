import { ExcelService } from '../../services/excel.service';
import { DataService } from '../../services/data.service';
import { StorageService } from '../../services/storage.service';
import { CommService } from '../../services/comm.service';
import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Tab } from 'src/app/models/Tab.model';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { QueryDialogComponent } from 'src/app/dialogs/query-dialog/query-dialog.component';
import { UpdaterDialogComponent } from '../../dialogs/updater-dialog/updater-dialog.component';
import { PrimkeyDialogComponent } from '../../dialogs/primkey-dialog/primkey-dialog.component';
import { ModifierDialogComponent } from '../../dialogs/modifier-dialog/modifier-dialog.component';
import {ConlogService} from '../../modules/conlog/conlog.service';


@Component({
  selector: 'app-query-result',
  templateUrl: './query-result.component.html',
  styleUrls: ['./query-result.component.css']
})
export class QueryResultComponent implements OnInit {

  @Input() tabinfo: Tab;
  @ViewChild(MatSort) sort: MatSort;

  colHeader: string[];
  dataSource: any;
  rowsReturned: string;
  loadingQuery: boolean = false;
  queryid: number = -1;
  userSqlDisplay: number = 1;

  constructor(private comm: CommService, private data: DataService, private store: StorageService, private excel: ExcelService, public dialog: MatDialog, private conlog: ConlogService) { }

  ngOnInit() {
    //Listner
    this.comm.tableSelected.subscribe(() => {
      this.newTableSelected();
    });

    this.comm.runQueryChange.subscribe(() => {
      this.constructSQLString();
    });

    this.comm.runStoredQuery.subscribe((data) => {
      this.executeStoredQuery(data);
    });

    this.comm.exportToExcelClicked.subscribe((data) => {
      this.exportAsXLSX(data);
    });

    this.comm.saveNewQuery.subscribe(() => {
      this.saveCurrentQuery();
    });

    this.comm.copyToClipboardClicked.subscribe(() => {
      alert("Clipboard coding has not been completed.");
      this.conlog.log("clipboard copy subscription but nothing is coded");
    });

    this.comm.dataModifierClicked.subscribe(() => {
      this.processDataModifyClicked();
    });

    this.comm.validatePrimKey.subscribe((tabdata) => {
      this.validateTempPrimKey(tabdata);  //Line 587
    })
  }

  newTableSelected(){
    //  headleyt:  20210120  Added condition so this will be performed only on the active tab
    if (this.tabinfo === this.store.selectedTab){
      this.initializeTheQuery();
      this.preloadUserSelectedColumns();
      this.constructSQLString();
      this.tabinfo.limitRows = false;
    }
  }

  initializeTheQuery() {
    this.tabinfo.colfilterarr = [];
    this.tabinfo.colfilterarr.push("*");
    this.tabinfo.wherearr = [];
    this.tabinfo.wherearrcomp = []; //{wid: 0, str: "", condition: "", type: "", name: "", operator: "", value: ""}
    this.tabinfo.joinarr = [];
    this.tabinfo.orderarr = [];
    this.tabinfo.getcount = false;
    this.tabinfo.limitRows = false;
    this.tabinfo.selectcnt = "0";
    this.tabinfo.distinctcol = "";
    this.colHeader = [];
  }

  preloadUserSelectedColumns() {
    // This is used to return any previously selected column list for the selected table
    let storedColumns: any = this.store.getUserValue('storedcolumns');

    // Identify all preselected preferred columns for this table
    if(storedColumns != null) {
      let columnListArr: any = storedColumns.filter(row => row.TableName.toUpperCase() == this.tabinfo.table.name.toUpperCase() && row.RType == 'C');

      // If there is a return, then populate the associated variable, otherwise, leave as is
      if (columnListArr.length == 1) {
        this.tabinfo.colfilterarr = columnListArr[0].ColumnNames.split();
        if (columnListArr[0].DistinctCol != null) this.tabinfo.distinctcol = columnListArr[0].DistinctCol;
      }
    }

    // Identify and updated all primary keys for this table
    if(storedColumns != null) {
      let primaryKeyList: any = storedColumns.filter(row => row.TableName.toUpperCase() == this.tabinfo.table.name.toUpperCase() && row.RType == 'P');
      if(primaryKeyList.length == 1) {
        this.tabinfo.tempPrimKey = primaryKeyList[0].ColumnNames.split();
        this.tabinfo.primKeyID = primaryKeyList[0].ID;

        // Account for all the primary keys
        if (this.tabinfo.tempPrimKey != null) {
          if (this.tabinfo.tempPrimKey.length > 0) {
            for (let c = 0; c < this.tabinfo.tempPrimKey.length; c++) {
              let selCol = this.tabinfo.availcolarr.find(x => x.columnid == this.tabinfo.tempPrimKey[c]);
              if (selCol != undefined)
                selCol.primarykey = true;
            }
            this.tabinfo.hasPrimKey = true;
          }
        }
      }
    }
  }

  constructSQLString() {
    if (this.tabinfo === this.store.selectedTab) {
      this.loadingQuery = true;   // Display the loading indicator, so they know something is going on.
      this.colHeader = [];        // Clear out the current displayed results

      this.tabinfo.querystr = "";

      //Build the string exactly like the web service
      let strSQL = "SELECT ";
      let displayStrSQL = "Select ";

      //How many records are we pulling for this select
      if (this.tabinfo.getcount) {
        strSQL += "COUNT (*) AS [Count] ";
        displayStrSQL += "the total number of records ";
      }

      if (this.tabinfo.wherearrcomp.length == 0 && this.tabinfo.distinctcol == "") {
        if (this.tabinfo.selectcnt == "0") this.tabinfo.selectcnt = "10";

        if (this.tabinfo.selectcnt == "-9") {
          strSQL += " ";
          displayStrSQL += "all record(s) ";
        } else {
          strSQL += "TOP " + this.tabinfo.selectcnt + " ";
          displayStrSQL += "the first " + this.tabinfo.selectcnt + " record(s) ";
        }
      } else if (this.tabinfo.wherearrcomp.length > 0 && this.tabinfo.distinctcol == "") {
        displayStrSQL += "all records ";
      }

      // Specific columns or all columns
      if (!this.tabinfo.getcount) {
        // Do we have multiple columns selected? Is there a distinct column selected?
        if (this.tabinfo.colfilterarr.length > 1 || this.tabinfo.colfilterarr[0] != "*") {

          // If the distinct option is used, then reorder the list based on that alone
          if (this.tabinfo.distinctcol != "")
            this.tabinfo.colfilterarr[0] = this.reorderColListBasedOnDistinct(this.tabinfo.colfilterarr[0].split(","), this.tabinfo.distinctcol);

          strSQL += ((this.tabinfo.distinctcol != "") ? "DISTINCT " : "") + this.tabinfo.colfilterarr[0] + " ";
          displayStrSQL += ((this.tabinfo.distinctcol != "") ? "distinct " : "") + this.improveDisplayColumnReadability(this.tabinfo.colfilterarr[0]) + " ";
        }

        if (this.tabinfo.colfilterarr[0] == "*" && this.tabinfo.distinctcol == "") {
          strSQL += "* ";
          displayStrSQL += "of all columns ";
        }
      }

      //Include the FROM
      strSQL += "FROM ";
      displayStrSQL += "from "

      //Add the database and table info
      strSQL += "[" + this.tabinfo.database + "]..[" + this.tabinfo.table.name + "] ";
      displayStrSQL += "table " + this.tabinfo.table.name + " in the " + this.tabinfo.database + " database ";

      //Add Join statement
      if (this.tabinfo.joinarr.length > 0) {
        strSQL += this.constructJoin();
        displayStrSQL = this.constructJoinSentence(displayStrSQL);
      }

      //Where Clause
      if (this.tabinfo.wherearrcomp.length > 0) {
        strSQL += this.constructWhereClause(true);
        displayStrSQL += this.constructWhereClauseSentence();
        //console.log("after where clause, after join:  " + strSQL);
      }

      // Order By
      if (this.tabinfo.orderarr.length > 0)
        strSQL += this.constructOrderBy();

      //Display the information
      this.tabinfo.rawquerystr = strSQL;
      this.tabinfo.querystr = displayStrSQL;

      //Run the string based on this information (it won't be a direct run)
      this.conlog.log("SQL: " + strSQL);
      this.conlog.log("DISPLAY: " + displayStrSQL);

      this.userSqlDisplay = parseInt(this.store.getUserValue("appdata").substr(0,1));

      this.executeSQL();
    }
  }

  reorderColListBasedOnDistinct(colArr: any, distinctList: string): string {
    if (distinctList != "") {
      for(let i = 0; i < colArr.length; i++) {
        if (colArr[i] === distinctList) {
          colArr.splice(i, 1);
          break;
        }
      }

      colArr.unshift(distinctList);     // Now we have identified and remove, reinsert in the front of the column selection list
    }

    return colArr.join();
  }

  improveDisplayColumnReadability(str: string): string {
    let cols: any = str.split(",");

    for(let i = 0; i < cols.length; i++) {
      let index = cols[i].indexOf(".");
      cols[i] = this.store.setCapitlization(cols[i].substr(index + 1));
    }

    return cols.join();
  }

  //headley:  20210115  Integrating Sean's fixes for suspicious code; added parameter
  constructWhereClause(forDisplay: boolean){
    //Manually join the where clause adding in the appropriate conditioning statements
    let wStr: string = "WHERE ";
    for(let i = 0; i < this.tabinfo.wherearrcomp.length; i++){
      let row: any = this.tabinfo.wherearrcomp[i];

      //Add in the condition for the second + where item
      if(i > 0) wStr += " " + (row.condition.length == 0 ? " AND " : " " + row.condition + " ") + " ";

      //Add the column and operator
      //  headleyt:  20210115  modifications integrated from Sean
      if(forDisplay)
        wStr += row.name + " " + row.operator + " ";
      else
        wStr += "[" + row.table + "].[" + row.name + "] {" + this.store.operators.indexOf(row.operator) + "} ";

      if (row.operator.toUpperCase() != "IS NULL" && row.operator.toUpperCase() != "IS NOT NULL"){
      //Add the value (quote if type requires)
        switch (row.type) {
          case "char":
	  			case "varchar":
		  		case "datetime":
			  	case "date":
				  case "time":
  				case "xml":
	  			case "nvarchar":
		  		case "nchar":
			  	case "ntext":
				  case "text":
  				case "uniqueidentifier":
    //headleyt:  20210205  added a check to parse/build the proper string for the IN operator
            {
              if (row.operator.toUpperCase() != "IN")
                wStr += "'" + this.checkForWildcards(row.value, forDisplay) + "'";
              else
                wStr += this.checkValidINString(this.checkForWildcards(row.value, forDisplay));
            }
		  			break;
			  	case "float":
				  case "bigint":
  				case "int":
	  			case "bit":
		  		case "decimal":
          wStr += this.checkValidINString(row.value);
				  	break;
        }
      } else {
        wStr = wStr.substr(0, wStr.length - 1);
      }
    }

    return wStr;
  }

  constructWhereClauseSentence(){
    //Manually join the where clause adding in the appropriate conditioning statements
    let wStr: string = "where ";
    for(let i = 0; i < this.tabinfo.wherearrcomp.length; i++){
      let row: any = this.tabinfo.wherearrcomp[i];

      //Add in the condition for the second + where item
      //if(i > 0) wStr += " " + (row.condition == 'IS NOT NULL' || row.condition == 'IS NULL') ? row.condition.toUpperCase() : row.condition + " ";
      if(i > 0) wStr += " " + (row.condition.length == 0 ? " and " : " " + row.condition.toUpperCase() + " ") ;

      //Add the column and operator
      //  headleyt:  20210115  modifications integrated from Sean
      wStr += this.TitleCase(row.name) + " " + this.getTextOperator(this.store.operators.indexOf(row.operator)) + " ";

      if (row.operator.toUpperCase() != "IS NULL" && row.operator.toUpperCase() != "IS NOT NULL"){
      //Add the value (quote if type requires)
        switch (row.type) {
          case "char":
	  			case "varchar":
		  		case "datetime":
			  	case "date":
				  case "time":
  				case "xml":
	  			case "nvarchar":
		  		case "nchar":
			  	case "ntext":
				  case "text":
  				case "uniqueidentifier":
          //  headleyt:  20210205  added a check to parse/build the proper string for the IN operator
            {
              if (row.operator.toUpperCase() != "IN")
                wStr += "'" + this.checkForWildcards(row.value, true) + "'";
              else
                wStr += this.checkValidINString(this.checkForWildcards(row.value, true));
            }
		  			break;
			  	case "float":
				  case "bigint":
  				case "int":
	  			case "bit":
		  		case "decimal":
          wStr += this.checkValidINString(row.value);
				  	break;
        }
      }
    }

    return wStr;
  }

  //  headleyt:  20210204  Added new function to check the string entered for the IN operator
  checkValidINString(rowValue: string)  {
    let filterValueStr = "";
    rowValue = rowValue.replace("(","").replace(")","");  //  stripping out parentheses if they are part of the statement and then adding back in
    let arrInStr = rowValue.split(/[, ]/);
    for(let i = 0; i < arrInStr.length; i++){
      let filterValue: any =  arrInStr[i].trim();
      if (filterValue != "") {
        if (filterValue.indexOf("'") < 0)
          filterValueStr += "'" + filterValue + "'";
        else
          filterValueStr += filterValue;
        if (i < (arrInStr.length -1))
          filterValueStr += ',';
      }
    }
    filterValueStr = "(" + filterValueStr + ")";
    return filterValueStr;
  }

  //  headleyt:  20210115  Integrated new function from Sean to check for wildcards
  checkForWildcards(rowValue: string, forDisplay: boolean) {
    return (forDisplay) ? rowValue: rowValue.replace(/%/g, "{14}");
  }

  //  headleyt:  20210129  Get the text equivalent of the operartor such as equals instead of ==
  getTextOperator(operator: any){
    return (operator == 'IS NULL' || operator == 'IS NOT NULL') ? this.store.operatorsText[operator].toUpperCase() : this.store.operatorsText[operator];
  }

  //  headleyt:  20210201  Added TitleCase converter so the column names in sentence format are all the same
  TitleCase(str: string) {
    return str.toLowerCase().split('_').map(word => {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join('');
  }

  constructOrderBy() {
    let oStr: string = "ORDER BY ";

    for (let i = 0; i < this.tabinfo.orderarr.length; i++){
      if(i > 0)
        oStr += ", ";

      oStr += this.tabinfo.orderarr[i].name + " " + this.tabinfo.orderarr[i].sort
    }

    return oStr;
  }

  constructJoin() {
    let jStr: string = "";

    for (let i = 0; i < this.tabinfo.joinarr.length; i++){
      jStr += " " + this.tabinfo.joinarr[i].joinclausestr;
    }

    return jStr;
  }

  constructJoinSentence(sentence: string){
    let jStr: string = "";
    let tableString: string = sentence.substr(0, sentence.indexOf("table") + 6);
    let leftdb: string = "";

    for (let i = 0; i < this.tabinfo.joinarr.length; i++){
      leftdb = this.tabinfo.joinarr[i].dbleft;
      if (leftdb == this.tabinfo.joinarr[i].dbright){

        // Add the indicator that the tables are joined
        tableString = tableString.replace("from table", "from joined table");

        if (tableString.indexOf("tables") == -1){
          tableString = tableString.replace("table", "tables");
        }

        if (tableString.indexOf(this.tabinfo.joinarr[i].tableleft) == -1){
          tableString += this.tabinfo.joinarr[i].tableleft;
        }

        if (tableString.indexOf(this.tabinfo.joinarr[i].tableright) == -1){
          if (this.tabinfo.joinarr.length == 1)
            tableString += " and " + this.tabinfo.joinarr[i].tableright;
          else if (i < this.tabinfo.joinarr.length - 1)
            tableString += ", " + this.tabinfo.joinarr[i].tableright;
          else
            tableString += ", and " + this.tabinfo.joinarr[i].tableright;
        }

        for (let j = (i + 1); j < this.tabinfo.joinarr.length; j++){
          if (leftdb == this.tabinfo.joinarr[j].dbleft){
            if (tableString.indexOf(this.tabinfo.joinarr[j].tableleft) == -1){
              if (this.tabinfo.joinarr.length == 1)
                tableString += " and " + this.tabinfo.joinarr[i].tableleft;
              else if (j < this.tabinfo.joinarr.length - 1)
                tableString += ", " + this.tabinfo.joinarr[j].tableleft;
              else
                tableString += ", and " + this.tabinfo.joinarr[j].tableleft;
            }

            if (leftdb == this.tabinfo.joinarr[j].dbright){
              if (tableString.indexOf(this.tabinfo.joinarr[j].tableright) == -1){
                if (this.tabinfo.joinarr.length == 1)
                  tableString += " and " + this.tabinfo.joinarr[i].tableright;
                else if (j < this.tabinfo.joinarr.length - 1)
                  tableString += ", " + this.tabinfo.joinarr[j].tableright;
                else
                  tableString += ", and " + this.tabinfo.joinarr[j].tableright;
              }
            }
          }

          if ((j - 1) == this.tabinfo.joinarr.length) {
            tableString += " in the " + this.tabinfo.joinarr[i].dbleft + " database ";
          }
        }
      }

      if (leftdb != this.tabinfo.joinarr[i].dbright){
        tableString += " and table " + this.tabinfo.joinarr[i].tableright + " in the " + this.tabinfo.joinarr[i].dbright + " database ";
      }

      jStr = tableString;
    }
    return jStr;
  }

  executeSQL(){
    //Run out and get what we need
    let col: string = (this.tabinfo.colfilterarr[0] == "*") ? "" : this.tabinfo.colfilterarr.join();                  //Separated by comma
    let where: string = (this.tabinfo.wherearrcomp.length > 0) ? this.constructWhereClause(false) : "";     // Separated by a space
    let join: string = (this.tabinfo.joinarr.length > 0) ? this.constructJoin() : "";                                 //Separated by a space
    let order: string = (this.tabinfo.orderarr.length > 0) ? this.constructOrderBy() : "";                            //Separated by a comma
    let distinct: string = (this.tabinfo.distinctcol != "") ? "true" : "false";                                       // boolean converted to string

    this.data.getQueryData(this.tabinfo.server.replace('{0}', this.tabinfo.database), this.tabinfo.database, this.tabinfo.table.name,
    (col.length == 0) ? '0' : col, (where.length == 0) ? '0' : where, (join.length == 0) ? '0' : join, (order.length == 0) ? '0' : order,
      this.tabinfo.getcount, this.tabinfo.limitRows, this.tabinfo.selectcnt, this.store.user.username, distinct).subscribe((results) => {
        this.processReturnedData(results);
      });
  }

  executeStoredQuery(tab: Tab) {
    //I need to confirm what tab I should be on
    if(tab.sqid != undefined){
      this.data.executeQStr(tab.sqid).subscribe((results) => {
        this.processReturnedData(results);
        this.loadingQuery = false;
      });
    } else {
      alert("Current tab id doesn't match for the selected stored query.  Execution aborted.");
    }
  }

  processReturnedData(results){
    // Get all column headers for the returned information
    if(results.length > 0) {
      this.colHeader = Object.keys(results[0]);

      // Only display results less than 1001 rows
      results = results.splice(0, this.store.maximumRowReturnCnt);

      //Load the data into the common variable
      this.dataSource = new MatTableDataSource(results);
      this.dataSource.sort = this.sort;

      // If this was executed by the updater, then now send a response to display the update complete
      this.conlog.log(this.tabinfo.updateRecReq);
      if (this.tabinfo.updateRecReq) {
        this.tabinfo.updateRecReq = false;
        this.store.generateToast("Record Successfully Updated");
      }
    }

    this.rowsReturned = "Rows Returned: " + results.length;
    this.loadingQuery = false;
  }

  exportAsXLSX(type: string):void {
    this.excel.exportAsExcelFile(this.dataSource.data, 'queryResults', type);
  }

  saveCurrentQuery() {
    //Only save if this query ISN'T a currently store query
    if(this.tabinfo.isstoredquery)
      this.store.generateToast("This query is already saved.");
    else {
      if (this.tabinfo === this.store.selectedTab) {
        const dialogQuery = this.dialog.open(QueryDialogComponent, {width: '500px', height: '175px', autoFocus: true, data: this.tabinfo });
        dialogQuery.afterClosed().subscribe(() => {
          if(this.tabinfo.querytitle != undefined) {
            // Need to compile the list of columns used for this query.
            let colarr: any = [];
            this.tabinfo.availcolarr.forEach((col) => {
              colarr.push(col.columnname);
            });

            this.data.storeNewQuery(this.tabinfo.querytitle.toUpperCase(),
              this.tabinfo.rawquerystr,
              this.tabinfo.server,
              this.tabinfo.database,
              this.store.getUserValue("userid"),
              this.tabinfo.qtype,
              this.tabinfo.querystr)
            .subscribe(() => {
              this.comm.populateQueryList.emit();
              this.store.generateToast("The query has been stored under the title: " + this.tabinfo.querytitle.toUpperCase() + ".");
            });
          }
        });
      }
    }
  }

  rowClickedHandler(row) {
    this.tabinfo.selectedrow = row;
  }

  cellClickedHandler(col, value) {
    // Store the column that has been selected for modification
    this.tabinfo.table["selectedColumn"] = col;
    this.tabinfo.table["curvalue"] = value;

    // Identify the appropriate column to be modified
    let colObj = this.tabinfo.availcolarr.find(x => col === x.columnname);
    colObj.colSelected = true;

    //Does this table have a primary key or a temporary primary key (is required)
    if(!this.tabinfo.hasPrimKey) {
      let tabdata: any = {col: this.tabinfo.table["selectedColumn"], tabinfo: this.tabinfo };
      this.validateTempPrimKey(tabdata);   // Make sure a primary key get selected, since none is identified at this point

      if(this.tabinfo.tempPrimKey != null && this.tabinfo.tempPrimKey.length > 0)
        this.processCellClicked(colObj);
      else
        this.tabinfo.tempPrimKey = null;
    } else
      this.processCellClicked(this.tabinfo.availcolarr.find(x => col === x.columnname));
  }

  validateTempPrimKey(tabdata: any) {
    // Doesn't have a primary key, so user must select a unique identifier to be used in the where clause
    let dialogPrimeKey;
    if(!dialogPrimeKey) {
      dialogPrimeKey = this.dialog.open(PrimkeyDialogComponent, {width: '350px', height: '430px', autoFocus: true, data: tabdata});

      // Actions if the clear button is selected
      dialogPrimeKey.componentInstance.onClear.subscribe(() => {
        this.data.clearUserDefinedPK(this.tabinfo.table.name)
          .subscribe(() => {
              this.comm.reloadStoredColumnData.emit();
              this.store.generateToast("All primary keys have been cleared.");
            },
            error => {
              alert("There was an error while attempt to remove the stored primary key.");
            });
      });

      // Actions when the dialog is closed
      dialogPrimeKey.afterClosed().subscribe((ids) => {
        if (ids == undefined) {
          // Nothing was selected, so just close this bloody window
          this.store.generateToast('No primary key was altered or stored. Canceled by User.');
        } else {
          let pk: any = {}
          pk.tablename = this.tabinfo.table.name;
          pk.columnnames = ids.join();
          pk.distinctcol = 'null';
          pk.id = (this.tabinfo.primKeyID > 0) ? this.tabinfo.primKeyID : null;
          pk.rtype = "P";

          if (ids.length == 0) {
            pk.action = 'remove';
            this.tabinfo.hasPrimKey = false;
            this.tabinfo.primKeyID = 0;
            // Loop through and remove all selected primary keys from the selection
            for (let c = 0; c < this.tabinfo.availcolarr.length; c++) {
              this.tabinfo.availcolarr[c].primarykey = false;
            }
            this.executePrimaryKeyStore(pk, "removed.", "remove");
          } else if (ids.length > 0) {
            // Store the potentially multiple IDs in a variable
            this.tabinfo.tempPrimKey = ids;

            // Account for all selected primary keys
            if (this.tabinfo.tempPrimKey != null && this.tabinfo.tempPrimKey.length > 0) {
              // Need to update our local variable with the information
              for (let c = 0; c < ids.length; c++) {
                let selCol = this.tabinfo.availcolarr.find(x => x.columnid == ids[c]);
                if (selCol != undefined) selCol.primarykey = true;
              }

              // All done with identifying the primary keys, so move forward with the process
              this.tabinfo.hasPrimKey = true;

              // Make sure to save the information also in the database
              pk.action = (this.tabinfo.primKeyID > 0) ? 'update' : 'insert';
              this.executePrimaryKeyStore(pk, "stored.", "store");
            } else {
              this.tabinfo.tempPrimKey = null;
              if (tabdata.col != null)   // Only show this alert if a column was selected to open the dialog
                alert("Unable to modify the selected value without a primary key. Operation canceled.");
            }
          }
        }
      });
    }
  }

  executePrimaryKeyStore(pk: any, msg: string, errmsg: string) {
    this.data.updateUserColumnSelection(pk)
      .subscribe(() => {
          this.comm.reloadStoredColumnData.emit();
          this.store.generateToast("Your selected primary key(s) has been " + msg);
        },
        error => {
          alert("There was an error while attempt to " + errmsg + " the primary key.");
        });
  }

  processCellClicked(obj){
    if(!obj.primarykey) {
      const dialogProcessChg = this.dialog.open(UpdaterDialogComponent, { width: '385px', height: '320px', autoFocus: true, data: {tabinfo: this.tabinfo, datasource: this.dataSource.filteredData }});
      dialogProcessChg.afterClosed()
        .subscribe((rtn) => {
        if (rtn != undefined){
          //Value has been set to something new, so let's save it (//this.comm.runQueryChange.emit();)
          let selcol = this.tabinfo.availcolarr.find(x => x.columnname == this.tabinfo.table["selectedColumn"]);
          let updatekey = "SET [" + selcol.columnname + "] = " + this.store.determineValueType(this.tabinfo.table["setvalue"], selcol.vartype);

          // Generate the full where clause especially if there is more than one column used for the unique key
          let wheredata = " WHERE ";
          if(this.tabinfo.hasPrimKey) {  // If using permanent primary keys
            wheredata += this.generateLimiter(this.tabinfo.availcolarr.find(x => x.primarykey == true));
          } else if(!this.tabinfo.hasPrimKey && this.tabinfo.tempPrimKey != null) { // If using temporary primary keys
            for (let c = 0; c < this.tabinfo.tempPrimKey.length; c++) {
              if (c > 0) wheredata += " AND ";
              wheredata += this.generateLimiter(this.tabinfo.availcolarr.find(x => x.columnid == this.tabinfo.tempPrimKey[c]));
            }
          } else alert("Missing Primary Key.  Unable to update value");

          // Signal the DB to update the information
          this.data.updateRowInfo(this.tabinfo.server.replace('{0}', this.tabinfo.database), this.tabinfo.database, this.tabinfo.table["name"], updatekey + wheredata, this.tabinfo.wherearr.length > 0 ? this.tabinfo.wherearr.join(' and ') : "0")
            .subscribe(() => {
              this.comm.runQueryChange.emit();
            });
        }
      });
    }else
      alert("This column is a primary key and cannot be changed.");
  }

  generateLimiter(primecol) {
    // Based on the selected column, come up with the where clause to include the primary key value
    return primecol.columnname + " = " + this.store.determineValueType(this.tabinfo.selectedrow[primecol.columnname], primecol.vartype);
  }

  processDataModifyClicked() {
    // Open the respective dialog to allow for the addition or remove of data from the currently selected table
    const dialogModifier = this.dialog.open(ModifierDialogComponent, { width: '385px', height: '300px', autoFocus: true, data: {tabinfo: this.tabinfo}});
    dialogModifier.afterClosed()
      .subscribe((rtn) => {
          this.conlog.log(rtn);
      });
  }
}
