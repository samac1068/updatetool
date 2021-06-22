import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { User } from 'src/app/models/User.model';
import { StorageService } from 'src/app/services/storage.service';

@Component({
  selector: 'app-options-dialog',
  templateUrl: './options-dialog.component.html',
  styleUrls: ['./options-dialog.component.css']
})
export class OptionsDialogComponent implements OnInit {

  servers: any[] = [];
  databases: any[] = [];

  userServer: string = "0";
  userDB: string = "0";
  
  userid: string = "";
  username: string = "";
  firstname: string = "";
  lastname: string = "";

  constructor(public dialogRef: MatDialogRef<OptionsDialogComponent>, @Inject(MAT_DIALOG_DATA) public user: User, private store: StorageService) { }

  ngOnInit() {
    //Load the default options
    this.servers = this.store.getSystemValue('servers');
    this.databases = this.store.getSystemValue('databases');

    this.userServer = (this.user.servername != undefined) ? this.user.servername : "0";
    this.userDB = (this.user.database != undefined) ? this.user.database : "0";

    this.userid = (this.user.userid == -9) ? "" : String(this.user.userid);
    this.username = this.user.username;
    this.firstname = this.user.fname;
    this.lastname = this.user.lname;
  }

  closeDialog() {
    this.dialogRef.close(this.user);
  }

  saveUpdatedOptions(){
    this.user.servername = this.userServer;
    this.user.datamodified = true;
    for(var i = 0; i < this.servers.length; i++) {
      if(this.servers[i].id == this.userServer) {
        this.user.server = this.servers[i].offName;
        break;
      }
    }
 
    this.user.database = this.userDB;
    this.closeDialog();
    console.log("saveUpdatedOptions");
  }
}
