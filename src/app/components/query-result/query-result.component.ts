import { ExcelService } from '../../services/excel.service';
import { DataService } from '../../services/data.service';
import { StorageService } from '../../services/storage.service';
import { CommService } from '../../services/comm.service';
import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { Tab } from 'src/app/models/Tab.model';
import { MatSort, MatTableDataSource, MatDialog } from '@angular/material';
import { QueryDialogComponent } from 'src/app/dialogs/query-dialog/query-dialog.component';
import { UpdaterDialogComponent } from '../../dialogs/updater-dialog/updater-dialog.component';
import { PrimkeyDialogComponent } from '../../dialogs/primkey-dialog/primkey-dialog.component';
import { ModifierDialogComponent } from '../../dialogs/modifier-dialog/modifier-dialog.component';


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
  showEditCol: boolean = false;
  selRow: any;

  constructor(private comm: CommService, private data: DataService, private store: StorageService, private excel: ExcelService, public dialog: MatDialog) { }

  ngOnInit() {
    //Listner
    this.comm.tableSelected.subscribe(() => {
      this.newTableSelected();
    });

    //Change to the query has happened so run the query
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
      console.log("clipboard copy subscription but nothing is coded");
    });

    this.comm.dataModifierClicked.subscribe(() => {
      this.processDataModifyClicked();
    });
  }

  newTableSelected(){
    //  headleyt:  20210120  Added condition so this will be performed only on the active tab
    if (this.tabinfo === this.store.selectedTab){
      this.initializeTheQuery();
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
    this.colHeader = [];
  }

  constructSQLString() {
    this.tabinfo.querystr = "";

    //Build the string exactly like the web service
    let strSQL = "SELECT ";
    let displayStrSQL = "Select ";

    //Build the return
    if(this.tabinfo.getcount) {
      strSQL += "COUNT (*) AS [Count] FROM ";
      displayStrSQL += " the number of records ";
    }
    else if (parseInt(this.tabinfo.selectcnt) > 0) {
      strSQL += "TOP " + this.tabinfo.selectcnt + " ";
      displayStrSQL += " the top " + this.tabinfo.selectcnt + " records ";
    }
    else if (this.tabinfo.wherearrcomp.length == 0 && this.tabinfo.colfilterarr[0] == "*" && parseInt(this.tabinfo.selectcnt) != -9){
      strSQL += "TOP 10 ";
      displayStrSQL += " the top 10 records ";
    }
    else if (this.tabinfo.wherearrcomp.length == 0 && this.tabinfo.colfilterarr[0] == "*" && parseInt(this.tabinfo.selectcnt) == -9){
      displayStrSQL += " all records "
    }

    //What columns do we want
    //  headleyt:  20210129  adding the displayStrSQL variable for the text version of the query
    //  made the selectcnt == -9 it's own check to make it work correctly
    if(this.tabinfo.colfilterarr[0] == "*" /*|| parseInt(this.tabinfo.selectcnt) == -9*/)
    {
      strSQL += "* ";
//  headleyt:  20210201  Added this checkt to keep from having at top #n statement and the all records statement
      if (this.tabinfo.wherearrcomp.length > 0) {
        displayStrSQL += " all records ";
      }
    }
    else if (parseInt(this.tabinfo.selectcnt) == -9)
    {
      strSQL += "* ";
      displayStrSQL += " all records ";
    }
    else
    {
      strSQL += this.tabinfo.colfilterarr.join() + " ";
      displayStrSQL += this.tabinfo.colfilterarr.join() + " ";
    }

    //Include the FROM
    strSQL += "FROM ";
    displayStrSQL += "from "

    //Add the database and table info
    strSQL += "[" + this.tabinfo.database + "]..[" + this.tabinfo.table.name + "] ";
    displayStrSQL += "table " + this.tabinfo.table.name + " in the " + this.tabinfo.database + " database ";

    //Add Join statement
    if(this.tabinfo.joinarr.length > 0){
      strSQL += this.constructJoin();
      displayStrSQL = this.constructJoinSentence2(displayStrSQL);
    }

    //Where Clause
    if(this.tabinfo.wherearrcomp.length > 0){
      strSQL += this.constructWhereClause(true);
      displayStrSQL += this.constructWhereClauseSentence();
      console.log("after where clause, after join:  " + strSQL);
    }

    // Order By
    if(this.tabinfo.orderarr.length > 0)
      strSQL += this.constructOrderBy();

    //Display the information
//  headleyt:  20210129 displaying the text version of the query on the screen instead of the sql version
//    this.tabinfo.querystr = strSQL;
    this.tabinfo.querystr = displayStrSQL;

    //Run the string based on this information (it won't be a direct run)
    this.executeSQL();
  }

//  headley:  20210115  Integrating Sean's fixes for suspicious code; added parameter
  constructWhereClause(forDisplay: boolean){
    //Manually join the where clause adding in the appropriate conditioning statements
    let wStr: string = "WHERE ";
    for(let i = 0; i < this.tabinfo.wherearrcomp.length; i++){
      let row: any = this.tabinfo.wherearrcomp[i];

      //Add in the condition for the second + where item
      if(i > 0) wStr += " " + row.condition + " ";

      //Add the column and operator
      //  headleyt:  20210115  modifications integrated from Sean
      if(forDisplay)
        wStr += row.name + " " + row.operator + " ";
      else
        wStr += row.name + " {" + this.store.operators.indexOf(row.operator) + "} ";

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
                wStr += "'" + this.checkForWildcards(row.value, forDisplay) + "'";
              else
                wStr += this.checkValidINString(this.checkForWildcards(row.value, forDisplay), row.type);
            }
		  			break;
			  	case "float":
				  case "bigint":
  				case "int":
	  			case "bit":
		  		case "decimal":
          wStr += this.checkValidINString(row.value, row.type);
				  	break;
        }
      } else {
        wStr = wStr.substr(0, wStr.length - 1);
      }
    }

    return wStr;
  }

  //  headley:  20200129  Build the where clause to display as a sentence vice SQL syntax
  constructWhereClauseSentence(){
    //Manually join the where clause adding in the appropriate conditioning statements
    let wStr: string = "where ";
    for(let i = 0; i < this.tabinfo.wherearrcomp.length; i++){
      let row: any = this.tabinfo.wherearrcomp[i];

      //Add in the condition for the second + where item
      if(i > 0)
        wStr += " " + (row.condition == 'IS NOT NULL' || row.condition == 'IS NULL') ? row.condition.toUpperCase() : row.condition + " ";

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
                wStr += this.checkValidINString(this.checkForWildcards(row.value, true), row.type);
            }
		  			break;
			  	case "float":
				case "bigint":
  				case "int":
	  			case "bit":
		  		case "decimal":
          wStr += this.checkValidINString(row.value, row.type);
				  	break;
        }
      }
    }

    return wStr;
  }

  //  headleyt:  20210204  Added new function to check the string entered for the IN operator
  checkValidINString(rowValue: string, rowType: string)  {
    let filterValueStr = "";
    rowValue = rowValue.replace("(","").replace(")","");  //  stripping out parentheses if they are part of the statement and then adding back in
    let arrInStr = rowValue.split(/,| /);
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

  /* //  headleyt:  20210129  Added camelCase converter so the column names in sentence format are all the same
  camelCase(str: string) {
    // str = str.replace("_", "");
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index)
    {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
  }  */

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

constructJoinSentence2(sentence: string){
    let jStr: string = "";
    let tableString: string = sentence.substr(0, sentence.indexOf("table") + 6);
    let leftdb: string = "";

    for (let i = 0; i < this.tabinfo.joinarr.length; i++){
      leftdb = this.tabinfo.joinarr[i].dbleft;
      if (leftdb == this.tabinfo.joinarr[i].dbright){
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

  constructJoinSentence(sentence: string) {
    let jStr: string = "";
    let tableString: string = sentence.substr(0, sentence.indexOf("table") + 6);

    for (let i = 0; i < this.tabinfo.joinarr.length; i++){
      if (this.tabinfo.joinarr[i].dbleft == this.tabinfo.joinarr[i].dbright){
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
        if (this.lastDbReference(i + 1, this.tabinfo.joinarr[i].dbleft)){
          tableString += " in the " + this.tabinfo.joinarr[i].dbleft + " database ";
        }
        jStr = tableString;
      }
      else if (this.tabinfo.joinarr[i].dbleft != this.tabinfo.joinarr[i].dbright){
        if (i == 0){
          tableString = sentence + " and table " + this.tabinfo.joinarr[i].tableright + " in the " + this.tabinfo.joinarr[i].dbright + " database ";
        }
        else {
          if (tableString.indexOf(this.tabinfo.joinarr[i].tableleft) == -1){
            tableString += " and table " + this.tabinfo.joinarr[i].tableleft + " in the " + this.tabinfo.joinarr[i].dbleft + " database "
          }
          if (tableString.indexOf(this.tabinfo.joinarr[i].tableright) == -1){
            tableString += " and table " + this.tabinfo.joinarr[i].tableright + " in the " + this.tabinfo.joinarr[i].dbright + " database "
          }
        }
        jStr = tableString;
      }
    }
    return jStr;
  }

  //  headleyt:  20210226  Added this function to add the " in the <dbname> database" if there are multiple tables in the query
  lastDbReference(i: number, dbName: string){
    let bFound: boolean = true;

    for (let j = i; j < this.tabinfo.joinarr.length; j++){
      bFound = !(dbName == this.tabinfo.joinarr[j].dbleft && dbName == this.tabinfo.joinarr[j].dbright);
    }

    return bFound;
  }
  //  headleyt: 20210217  Added this function to build the sentence version of the join clause
  /*constructJoinSentence(sentence: string) {
    let jStr: string = "";
    let tableString: string = "";

    //console.log("sentence passed in:  " + sentence);
    //console.log("constructJoinSentece:  " + this.tabinfo.joinarr.length);
    for (let i = 0; i < this.tabinfo.joinarr.length; i++){
      if (this.tabinfo.joinarr[i].dbleft == this.tabinfo.joinarr[i].dbright){
        //console.log("looping through join rows (right table):  " + this.tabinfo.joinarr[i].tableright);
        if (tableString.indexOf(this.tabinfo.joinarr[i].tableleft) == -1){
          tableString += this.tabinfo.joinarr[i].tableleft;
        }
        if (tableString.indexOf(this.tabinfo.joinarr[i].tableright) == -1){
          if (i < this.tabinfo.joinarr.length - 1)
            tableString += ", " + this.tabinfo.joinarr[i].tableright;
          else
            tableString += ", and " + this.tabinfo.joinarr[i].tableright;
        }
        jStr = sentence.replace("table", "tables").replace(this.tabinfo.joinarr[i].tableleft, tableString);
 //       jStr = sentence.replace("table", "tables").replace(this.tabinfo.joinarr[i].tableleft, (this.tabinfo.joinarr[i].tableleft + " and " + this.tabinfo.joinarr[i].tableright));
      }
      else if (this.tabinfo.joinarr[i].dbleft != this.tabinfo.joinarr[i].dbright){
        jStr = sentence + " and table " + this.tabinfo.joinarr[i].tableright + " in the " + this.tabinfo.joinarr[i].dbright + " database ";
      }
    }

    return jStr;
  }*/

  executeSQL(){
    //Run out and get what we need
    let col: string = (this.tabinfo.colfilterarr[0] == "*") ? "" : this.tabinfo.colfilterarr.join();    //Separated by comma
    let where: string = (this.tabinfo.wherearrcomp.length > 0) ? this.constructWhereClause(false) : "";      // Separated by a space
    let join: string = (this.tabinfo.joinarr.length > 0) ? this.constructJoin() : "";                   //Separated by a space
    let order: string = (this.tabinfo.orderarr.length > 0) ? this.constructOrderBy() : "";              //Separated by a comma

    this.data.getQueryData(this.tabinfo.server.replace('{0}', this.tabinfo.database), this.tabinfo.database, this.tabinfo.table.name,
    (col.length == 0) ? '0' : col, (where.length == 0) ? '0' : where, (join.length == 0) ? '0' : join, (order.length == 0) ? '0' : order,
      this.tabinfo.getcount, this.tabinfo.limitRows, this.tabinfo.selectcnt).subscribe((results) => {
        this.processReturnedData(results);
      });
  }

  executeStoredQuery(tab: Tab) {
    //I need to confirm what tab I should be on
    if(tab.sqid != undefined){
      tab.querystr = this.tabinfo.sqbody;
      this.data.executeQStr(tab.sqid).subscribe((results) => {
        this.processReturnedData(results);
      });
    } else {
      alert("Current tab id doesn't match that for the selected stored query.  Execution aborted.");
    }
  }

  processReturnedData(results){
    //Need to collect the column headers first
    this.colHeader = [];

    for(let key in results[0]){
      this.colHeader.push(key);
    }

    //Load the data into the common variable
    this.dataSource = new MatTableDataSource(results);
    this.dataSource.sort = this.sort;
    this.rowsReturned = "Rows Returned: " + results.length;
  }

  exportAsXLSX(type: string):void {
    this.excel.exportAsExcelFile(this.dataSource.data, 'queryResults', type);
  }

  saveCurrentQuery() {
    //Only save if this query ISN'T a currently store query
    if(this.tabinfo.isstoredquery)
      alert("This query is already saved.");
    else {
      if (this.tabinfo === this.store.selectedTab) {
        const dialogQuery = this.dialog.open(QueryDialogComponent, {width: '500px', height: '175px', autoFocus: true, data: this.tabinfo });
        dialogQuery.afterClosed().subscribe(() => {
          if(this.tabinfo.querytitle != undefined) {
            this.data.storeNewQuery(this.tabinfo.querytitle.toUpperCase(), this.checkForWildcards(this.tabinfo.querystr, false), this.tabinfo.server, this.tabinfo.database, this.store.getUserValue("userid"), this.tabinfo.qtype)
            .subscribe(() => {
              this.comm.populateQueryList.emit();
              alert("The query has been stored under the title: " + this.tabinfo.querytitle.toUpperCase() + ".");
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
    let obj = this.tabinfo.availcolarr.find(x => col === x.columnname);
    obj.colSelected = true;

    //Does this table have a primary key (is required)
    if(!this.tabinfo.hasPrimKey) {
      // Doesn't have a primary key, so user must select a unique identifier to be used in the where clause
      let tabdata: any = {col: col, tabinfo: this.tabinfo };
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
              if (selCol != undefined) selCol.primarykey = true;
            }

            // All done with identifying the primary keys, so move forward with the process
            this.tabinfo.hasPrimKey = true;
            this.processCellClicked(obj);
          } else {
            this.tabinfo.tempPrimKey = null;
            alert("Unable to modify the selected value without a primary key. Operation canceled");
          }
        } else {
          this.tabinfo.tempPrimKey = null;
          alert("Unable to modify the selected value without a primary key. Operation canceled");
        }
      });
    } else
        this.processCellClicked(obj);
  }

  processCellClicked(obj){
    if(!obj.primarykey) {
      const dialogProcessChg = this.dialog.open(UpdaterDialogComponent, { width: '385px', height: '320px', autoFocus: true, data: {tabinfo: this.tabinfo, datasource: this.dataSource.filteredData }});
      dialogProcessChg.afterClosed()
        .subscribe((rtn) => {
        if (rtn.table["setvalue"] != undefined){
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
            .subscribe((result) => {
              this.comm.runQueryChange.emit();
              alert("Record updated.");
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

      });
  }
}
