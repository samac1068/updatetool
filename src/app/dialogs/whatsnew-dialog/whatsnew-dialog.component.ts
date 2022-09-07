import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User } from 'src/app/models/User.model';
import { StorageService } from 'src/app/services/storage.service';
import { DataService } from 'src/app/services/data.service';
import {ConlogService} from '../../modules/conlog/conlog.service';

@Component({
  selector: 'app-whatsnew-dialog',
  templateUrl: './whatsnew-dialog.component.html',
  styleUrls: ['./whatsnew-dialog.component.css']
})
export class WhatsnewDialogComponent implements OnInit {

  newchange = {};
  history = {};
  objectKeys = Object.keys;
  classheight!: string;
  latestBuild!: string;
  buttonTitle: string = "Acknowledge";
  curVersion: string = "";

  constructor(public dialogRef: MatDialogRef<WhatsnewDialogComponent>, @Inject(MAT_DIALOG_DATA) public user: User, private store: StorageService,
  private data: DataService, private conlog: ConlogService) { }

  ngOnInit() {
    try {
      //Parse and organize the change history
      let changes: any = this.store.getSystemValue('build');

      this.latestBuild = changes[0].BuildVersion;
      this.curVersion = this.store.getVersion();

      for (let i = 0; i < changes.length; i++) {
        if (changes[i].BuildVersion <= this.curVersion) {
          if (changes[i].BuildVersion > this.user.lastversion) {
            if (this.newchange[changes[i].BuildVersion] == undefined) this.newchange[changes[i].BuildVersion] = [];
            this.newchange[changes[i].BuildVersion].push({ver: changes[i].BuildVersion, txt: changes[i].BuildChanges});
          } else {
            if (this.history[changes[i].BuildVersion] == undefined) this.history[changes[i].BuildVersion] = [];
            this.history[changes[i].BuildVersion].push({ver: changes[i].BuildVersion, txt: changes[i].BuildChanges});
          }
        }
      }

      this.buttonTitle = (this.objectKeys(this.newchange).length > 0) ? "Acknowledge" : "Close";

      //Adjust the height of the appropriate visible div
      if (this.objectKeys(this.newchange).length > 0 && this.objectKeys(this.history).length > 0) {
        this.classheight = "220px";
      } else if (this.objectKeys(this.newchange).length > 0 || this.objectKeys(this.history).length > 0) {
        this.classheight = "440px";
      }
    } catch(e) {
      this.conlog.log(e);
      this.closeDialog();
    }
  }

  processAcknowledge() {
    if(this.buttonTitle == "Acknowledge"){
      this.data.updateUserVersion(this.latestBuild).subscribe((rtn) => {
        this.user.lastversion = this.latestBuild;
        this.closeDialog();
      });
    } else
      this.closeDialog();
  }

  closeDialog() {
    this.dialogRef.close(this.user);
  }
}
