import {Component, OnInit, OnDestroy, Inject} from '@angular/core';
import {faSquare, faCheckSquare, faMinusSquare} from '@fortawesome/free-solid-svg-icons';
import {DataService} from "../../services/data.service";
import {ConlogService} from "../../modules/conlog/conlog.service";
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {CommService} from "../../services/comm.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {System} from "../../models/System.model";

@Component({
  selector: 'app-api-dialog',
  templateUrl: './api-dialog.component.html',
  styleUrls: ['./api-dialog.component.css']
})
export class ApiDialogComponent implements OnInit {

  faChecking: IconDefinition = faSquare;
  faSuccess: IconDefinition = faCheckSquare;
  faFailed: IconDefinition = faMinusSquare

  getIcon:any ;
  postIcon: any;
  postDBIcon: any;

  sysData: System = new System();

  constructor(public dialogRef: MatDialogRef<ApiDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: boolean, private ds: DataService, private conlog: ConlogService, private comm:CommService) { }

  ngOnInit(): void {
    this.getIcon = this.faChecking;
    this.postIcon = this.faChecking;
    this.postDBIcon = this.faChecking;

    console.log(this.data);

    // Perform both checks now.  They can be done asynchronously
    this.checkGetConnection();
    this.checkPostConnection();
    this.checkPostDBConnection();
  }

  checkGetConnection(){
    this.conlog.log("Performing API check. Checking GET");
    this.ds.apiGetCommsCheck()
      .subscribe((res)=> {
        this.sysData['apiGet'] = true;
        if(res["message"] == "You have successfully accessed the API using GET") {
          this.conlog.log("GET Comms check was SUCCESSFUL. API GET is accessible");
          this.getIcon = this.faSuccess;
        } else {
          alert(res["message"]);
          this.getIcon = this.faFailed;
        }
          this.isCheckCompleteClose();
      });
  }

  checkPostConnection() {
    this.conlog.log("Performing API check. Checking POST");
    this.ds.apiPostCommsCheck()
      .subscribe((res)=> {
        this.sysData['apiPost'] = true;
        if(res["message"].indexOf("successfully accessed the API using POST") > 0 && res["message"].indexOf("designated QT API") > 0) {
          this.conlog.log("POST Comms check was SUCCESSFUL. API POST is accessible.");
          this.postIcon = this.faSuccess;
        } else {
          alert(res["message"]);
          this.postIcon = this.faFailed;
        }
          this.isCheckCompleteClose();
      });
  }

  checkPostDBConnection() {
    this.conlog.log("Performing API to DB check. Checking POST");
    this.ds.apiPostDBCommsCheck()
      .subscribe({
          next:(res:any) => {
            this.sysData['apiDB'] = true;
            if(res["message"].indexOf("SUCCESSFUL") > -1 && res["message"].indexOf("Checking API to DB") > -1) {
              this.conlog.log("POST API to DB Comm check was SUCCESSFUL. POST to DB is accessible.");
              this.postDBIcon = this.faSuccess
            } else {
              alert("POST API to DB Comm check FAILED. DB is NOT accessible.\r" + res["message"]);
              this.postDBIcon = this.faFailed
            }
            this.isCheckCompleteClose();
          },
          error: (error) => {
            alert("checkPostDBConnection: " + error.message);
          }
        });
  }

  isCheckCompleteClose(){
    console.log("checking for complete.");

    if(this.sysData.apiGet && this.sysData.apiPost && this.sysData.apiDB)
    {
      console.log("Check is complete.");
      if(!this.data) this.dialogRef.close();
    }
  }
}
