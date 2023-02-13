import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User } from 'src/app/models/User.model';
import { StorageService } from 'src/app/services/storage.service';
import {ConlogService} from '../../modules/conlog/conlog.service';

@Component({
  selector: 'app-options-dialog',
  templateUrl: './options-dialog.component.html',
  styleUrls: ['./options-dialog.component.css']
})
export class OptionsDialogComponent implements OnInit {

  servers: any[] = [];
  databases: any[] = [];
  formats: any[] = [];

  userServer: string = "0";
  userDB: string = "0";
  userFormat: string = "-1";
  userid: string = "";
  username: string = "";
  firstname: string = "";
  lastname: string = "";

  constructor(public dialogRef: MatDialogRef<OptionsDialogComponent>, @Inject(MAT_DIALOG_DATA) public user: User, private store: StorageService, private conlog: ConlogService) { }

  ngOnInit() {
    //Load the default options
    this.servers = this.store.getSystemValue('servers');
    this.databases = this.store.getSystemValue('databases');
    this.formats = this.store.displayFormats;

    this.userServer = (this.user.servername != undefined) ? this.user.servername : "0";
    this.userDB = (this.user.database != undefined) ? this.user.database : "0";

    this.userid = (this.user.userid == -9) ? "" : String(this.user.userid);
    this.username = this.user.username;
    this.firstname = this.user.fname;
    this.lastname = this.user.lname;
    this.userFormat = this.store.getUserValue("appdata").substr(0,1);
  }

  closeDialog() {
    this.dialogRef.close(this.user);
  }

  saveUpdatedOptions(){
    this.user.servername = this.userServer;
    this.user.datamodified = true;
    for(let i = 0; i < this.servers.length; i++) {
      if(this.servers[i].id == this.userServer) {
        this.user.server = this.servers[i].offName;
        break;
      }
    }

    this.user.database = this.userDB;
    this.store.setUserValue("appdata", this.userFormat + this.store.getUserValue("appdata").substring(1));
    this.user.appdata = this.store.getUserValue("appdata");
    this.user.network = this.user.servername + "|{0}#" + this.user.database;
    this.closeDialog();
    this.conlog.log("saveUpdatedOptions");
  }
}
