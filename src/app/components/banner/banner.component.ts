import { Build } from '../../models/Build.model';
import { CommService } from '../../services/comm.service';
import { DataService } from '../../services/data.service';
import { Component, OnInit, Inject } from '@angular/core';

import { User } from '../../models/User.model';
import { StorageService } from '../../services/storage.service';
import { OptionsDialogComponent } from 'src/app/dialogs/options-dialog/options-dialog.component';
import { MatDialog } from '@angular/material';
import { WhatsnewDialogComponent } from '../../dialogs/whatsnew-dialog/whatsnew-dialog.component';
import {UsermgrDialogComponent} from '../../dialogs/usermgr-dialog/usermgr-dialog.component';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.css']
})
export class BannerComponent implements OnInit {
  user: User; // There can only be one user at a time
  build: Build;
  version: string;
  isAdmin: boolean = false;

  constructor(private data: DataService, private store: StorageService, private comm: CommService, public dialog: MatDialog) { }

  ngOnInit() {
    //Listing listeners and services
    this.comm.userInfoLoaded.subscribe(() => {
      this.user = this.store.getUser();
      this.isAdmin = this.user.priv == 1;
      this.setupVersion();
      //this.confirmDisplayWhatsNew();
    });

    this.comm.noToolUserInfoFound.subscribe(() => {
      //We need to collect more information before the user will allowed to use the tool
      this.user = this.store.getUser();
      this.openOptionsDialog();
    });
  }

  returnToOrders() {
    window.history.back();
  }

  openOptionsDialog() {
    const dialogRef = this.dialog.open(OptionsDialogComponent, { width: '500px', height: '340px', autoFocus: true, data: this.user });
    dialogRef.afterClosed().subscribe((rtn) => {
      if(rtn.datamodified) {
        this.user.datamodified = false;
        let network: string = this.user.servername + "|" + this.user.server + "#" + this.user.database;
        this.data.addEditUpdateUserInfo(this.user.username, this.user.fname, this.user.lname, network, this.user.userid).subscribe((results) => {
          if(results[0].UserID > 0) {
            this.comm.userUpdatedReloadSys.emit();
            alert("Your options have been updated.");
          } else
            alert("Possible issue when save the option information.");
        });
      }
    });
  }

  openUserManagerDialog() {
    const dialogUserMgrRef = this.dialog.open(UsermgrDialogComponent, { width: '750px', height: '500px', autoFocus: true, data: this.user });
    dialogUserMgrRef.afterClosed().subscribe((rtn) => {
      console.log(rtn);
    });
  }

  setupVersion() {
    this.build = this.store.getSystemValue("build");
    this.version = "Version " + this.store.getVersion();
  }

  confirmDisplayWhatsNew() {
    if((this.store.getVersion() > this.user.lastversion) && this.build[0].BuildVersion == this.store.getVersion())
      this.displayWhatsNew();
  }

  displayWhatsNew() {
    //Display the What's new page if there is something new since the last time it was checked.
    const dialogBannerRef = this.dialog.open(WhatsnewDialogComponent, { width: '700px', height: '550px', autoFocus: true, data: this.user });
    dialogBannerRef.afterClosed().subscribe((u) => {
      this.user = u;
    });
  }
}
