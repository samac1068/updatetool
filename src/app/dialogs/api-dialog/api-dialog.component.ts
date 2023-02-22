import { Component, OnInit } from '@angular/core';
import { faCloud, faCloudDownload } from '@fortawesome/free-solid-svg-icons';
import {DataService} from "../../services/data.service";
import {ConlogService} from "../../modules/conlog/conlog.service";

@Component({
  selector: 'app-api-dialog',
  templateUrl: './api-dialog.component.html',
  styleUrls: ['./api-dialog.component.css']
})
export class ApiDialogComponent implements OnInit {

  faChecking = faCloud;
  faSuccess = faCloudDownload;

  getIcon:any ;
  postIcon: any;

  constructor(private data: DataService, private conlog: ConlogService) { }

  ngOnInit(): void {
    this.getIcon = this.faChecking;
    this.postIcon = this.faChecking;

    // Perform both checks now.  They can be done asynchronously
    this.checkGetConnection();
    this.checkPostConnection();
  }

  checkGetConnection(){
    this.conlog.log("Manually performing API check. Checking GET");
    this.data.apiGetCommsCheck()
      .subscribe((res)=> {
        if(res["message"] == "You have successfully accessed the API using GET") {
          this.conlog.log("GET Comms check was successful.");
          this.getIcon = this.faSuccess;
        }
      });
  }

  checkPostConnection() {
    this.conlog.log("Manually performing API check. Checking POST");
    this.data.apiPostCommsCheck()
      .subscribe((res)=> {
        if(res["message"].indexOf("accessed the API using POST") > 0 && res["message"].indexOf("designated QT API") > 0) {
          this.conlog.log("POST Comms check was successful. API is accessible.");
          this.postIcon = this.faSuccess;
        } else {
          alert(res["message"]);
        }
      });
  }

}
