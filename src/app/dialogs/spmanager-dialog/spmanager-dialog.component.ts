import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Tab} from "../../models/Tab.model";
import {StorageService} from "../../services/storage.service";
import {DataService} from "../../services/data.service";
import {ConlogService} from "../../modules/conlog/conlog.service";
import {faRefresh} from "@fortawesome/free-solid-svg-icons";
import {ColDef, GridApi} from "ag-grid-community";
import {ExcelService} from "../../services/excel.service";
import {CommService} from "../../services/comm.service";

interface IDictionary {
  [index:string] : string
}

@Component({
  selector: 'app-spmanager-dialog',
  templateUrl: './spmanager-dialog.component.html',
  styleUrls: ['./spmanager-dialog.component.css']
})
export class SpmanagerDialogComponent implements OnInit {

  protected readonly faRefresh = faRefresh;
  filterTerm: string = "";
  loadedStoredProcArr: any[]|null = null;
  loadedSPProperties: any[]|null = null;
  submittedPropValues: IDictionary = {};

  defColDefine: ColDef = { sortable: true, filter: true, resizable: true, autoHeaderHeight: true };
  gridHeaderHeight: number = 22;
  gridRowHeight: number = 22;
  controlledDataReturn: any;
  rtnColHeaders: any;
  rtnColDef: any;
  gridApi!: GridApi;

  constructor(public dialogRef: MatDialogRef<SpmanagerDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: Tab, private store: StorageService,
              private ws: DataService, private excel: ExcelService, private conlog: ConlogService, private comm: CommService) { }

  ngOnInit() {
    // Need to collect the list of stored procedures if not collected recently
    if(this.data.spListCollectDate == null || (new Date().getTime() - this.data.spListCollectDate > 300000)) {
      // We have exceeded five minutes since the data was pulled, so repull it.
      this.collectListOfStoredProcs();
    } else
      this.initForm();
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    //this.gridApi.hideOverlay();   // Hide the default overlay and use the one designed for the app.
  }

  collectListOfStoredProcs(){
    this.data.spManager = {action: 'list', database: this.data.database }
    this.ws.processSPManageRequest(this.data.spManager).subscribe((rtn: any) => {
      if(rtn != null) {
        this.data.spListCollectDate = new Date().getTime();
        this.data.storedProcArr = rtn;
        this.initForm();
      }
    });
  }

  initForm() {
    // When the initial and required data is loaded, then initialize the form.
    if(this.data.storedProcArr != null && this.data.storedProcArr.length > 0)
      this.loadedStoredProcArr = this.data.storedProcArr;
  }

  reloadStoredProcList() {

  }

  resetFilterTerm() {
    this.filterTerm = "";
  }

  storedProcSelected(spName: string):void {
    // Pull the list of properties for the selected stored procedure.
    this.data.selectedSPName = this.data.spManager.procname = spName;
    this.data.selectedSPProps = [];
    this.data.spManager.action = "properties";
    this.submittedPropValues = {};  // Reset each time a stored procedure is selected
    this.controlledDataReturn = this.data.selectedSPResults = null;
    this.rtnColDef = null;
    this.rtnColHeaders = null;

    this.ws.processSPManageRequest(this.data.spManager).subscribe((rtn: any) => {
      if(rtn.errmess != undefined) {
        this.conlog.log("Error at SPManager - storedProcSelected. " +rtn.errmess);
        alert("ERROR: Unable to collect the properties of the selected stored procedure. Refer to Console Log for Details");
      } else if(rtn.length > 0) {
        this.conlog.log("Property List Retrieved");
        this.data.selectedSPProps = this.loadedSPProperties = rtn;
      } else
        this.store.generateToast("Unable to retrieve property list for this stored procedure.", false);
    });

  }

  addPropValue(evt: any, para: string){
    para = para.replace("@","");

    // See if the key has been stored previously
    if(this.submittedPropValues[para] == undefined)
      this.submittedPropValues[para] = "";

    // Populate the value
    if(evt.target.value.length > 0)
      this.submittedPropValues[para] = evt.target.value;
    else
      delete this.submittedPropValues[para];    // Remove the property since it is no longer needed.
    console.log(this.submittedPropValues);
  }

  executeSelectedSP():void {
    // Generate the assignment variable into a single line
    this.data.spManager.action = "execute";

    // Reset the assignment string to an empty string
    let tempAssign = "";
    let colDef:any = [];

    // Iterate through the submittedProperties object
    for(const key in this.submittedPropValues)
    {
      tempAssign += (tempAssign.length > 5)? ", " : "";
      tempAssign += "@" + key + "=";
      tempAssign += this.checkForDataType(key,this.submittedPropValues[key]);

      //this.data.spManager.assignments += ((this.data.spManager.assignments.length > 5)? ", " : "") + "@"+key+"="+ this.checkForDataType(key,this.submittedPropValues[key]);
    }

    this.data.spManager.assignments = tempAssign;
    console.log(this.data.spManager.assignments);

    // Call the database a get the data
    this.ws.processSPManageRequest(this.data.spManager).subscribe((rtn: any) => {
      if(rtn != null)
      {
        this.data.selectedSPResults = rtn;    // To be stored incase we need to retrieve everything
        if(rtn.length > this.store.maximumRowReturnCnt)   // Only will store the first 1000 records. Anymore will be ignored.
          rtn = rtn.splice(0, this.store.maximumRowReturnCnt);

        this.controlledDataReturn = rtn;

        // Generate the Column Headers based on the return information
        this.rtnColHeaders = Object.keys(this.controlledDataReturn[0]);
        this.rtnColHeaders.forEach((key:any) => colDef.push({field: key, headerName: this.store.removeUnderscore(key)}));
        this.rtnColDef = colDef;
      }
    });
  }

  checkForDataType(key: string, value: string): string
  {
     this.loadedSPProperties?.forEach((obj) => {
      if(obj.NAME.replace("@","") == key){
        if(obj.COLTYPE != "int")
          value = "'" + value + "'"; // Return a quoted string
      }
    });

   return value;  // Return a number
  }

  exportAsXLSX():void {
    let jsondata = this.data.selectedSPResults;
    if(jsondata == null)
      this.store.generateToast("There is no visible data to export or the system failed to transfer the result to the export system. Export Failed");
    else
      this.excel.exportAsExcelFile(jsondata, 'storedProcResults', "excel");
  }

  resetProperties() {
    this.conlog.log("Well, I didn't fix that part yet, so no resetting of the properties for you.");
  }

  closeDialog(){
    this.controlledDataReturn = this.data.selectedSPResults = null;
    this.rtnColHeaders = null;
    this.rtnColDef = null;
    this.loadedStoredProcArr = null;
    this.loadedSPProperties = null;
    this.submittedPropValues = {};
    this.comm.deleteSPDialog.emit();

    this.dialogRef.close(false);
  }
}
