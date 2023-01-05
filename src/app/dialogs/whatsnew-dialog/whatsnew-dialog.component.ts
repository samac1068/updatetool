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
      let prechanges: any = this.store.getSystemValue('build');
      let changes: any = [];

      for(let p:number = 0; p < prechanges.length; p++)
      {
        let values = prechanges[p];
        let index = this.store.findIndexByValue(changes, "BuildVersion", values.BuildVersion)
        if( index == -1) // Does Build Version appear in the changes
          changes.push(values);
        else
          changes[index].BuildChanges = changes[index].BuildChanges + " - " + values.BuildChanges.replace("-","").trim();
      }


      this.latestBuild = changes[0].BuildVersion;
      this.curVersion = this.store.getVersion();

      for (let i = 0; i < changes.length; i++) {
        if (changes[i].BuildVersion <= this.curVersion) {
          if (changes[i].BuildVersion > this.user.lastversion) {
            if (this.newchange[changes[i].BuildVersion] == undefined) this.newchange[changes[i].BuildVersion] = [];
            this.newchange[changes[i].BuildVersion].push({ver: changes[i].BuildVersion, txt: this.formatBuildChanges(changes[i].BuildChanges)});
          } else {
            if (this.history[changes[i].BuildVersion] == undefined) this.history[changes[i].BuildVersion] = [];
            this.history[changes[i].BuildVersion].push({ver: changes[i].BuildVersion, txt: this.formatBuildChanges(changes[i].BuildChanges)});
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

  // Format the build changes info, so it falls within the expected display format
  formatBuildChanges(subsection: string) {
    let sublist = subsection.split("-");
    let newlist:any = [];

    sublist.forEach((value) => {
      if(value.length > 0)
        newlist.push(value.replace("-","").trim());
    });

    return newlist;
  }

  processAcknowledge() {
    if(this.buttonTitle == "Acknowledge"){
      this.data.updateUserVersion(this.latestBuild).subscribe(() => {
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
