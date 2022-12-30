import { Build } from '../../models/Build.model';
import { CommService } from '../../services/comm.service';
import { DataService } from '../../services/data.service';
import { Component, OnInit } from '@angular/core';

import { User } from '../../models/User.model';
import { StorageService } from '../../services/storage.service';
import { OptionsDialogComponent } from 'src/app/dialogs/options-dialog/options-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { WhatsnewDialogComponent } from '../../dialogs/whatsnew-dialog/whatsnew-dialog.component';
import {UsermgrDialogComponent} from '../../dialogs/usermgr-dialog/usermgr-dialog.component';
import {ConlogService} from '../../modules/conlog/conlog.service';
import {SessionDialogComponent} from '../../dialogs/session-dialog/session-dialog.component';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.css']
})
export class BannerComponent implements OnInit {
  user!: User; // There can only be one user at a time
  build!: Build;
  version!: string;
  isAdmin: boolean = false;
  network!: string;
  onSipr!: boolean;


  constructor(private data: DataService, public store: StorageService, private comm: CommService, public dialog: MatDialog, private conlog: ConlogService) { }

  ngOnInit() {
    //Listing listeners and services
    this.network = this.store.system['webservice']['network'];

    this.comm.userInfoLoaded.subscribe(() => {
      this.user = this.store.getUser();
      this.isAdmin = this.user.priv == 1;
      this.setupVersion();
      this.confirmDisplayWhatsNew();
    });

    this.comm.noToolUserInfoFound.subscribe(() => {
      //We need to collect more information before the user will be allowed to use the tool
      this.user = this.store.getUser();
      this.openOptionsDialog();
    });

    this.comm.resetPortalSessionClicked.subscribe(() => {
      this.openPortalSessionDialog();
    });

    this.onSipr = this.store.getSystemValue('webservice').network == "sipr";
  }

  returnToOrders() {
    window.history.back();
  }

  openOptionsDialog() {
    const dialogRef = this.dialog.open(OptionsDialogComponent, { width: '500px', height: '390px', autoFocus: true, data: this.user });
    dialogRef.afterClosed().subscribe((rtn) => {
      if(rtn.datamodified) {
        this.user.datamodified = false;
        this.data.addEditUpdateUserInfo(this.user)
          .subscribe((results) => {
          if(results[0].UserID > 0) {
            this.comm.userUpdatedReloadSys.emit();
            this.store.generateToast("Your options have been updated.");
          } else
            this.store.generateToast("Possible issue while attempting to save the option information.", false);
        });
      }
    });
  }

  openUserManagerDialog() {
    const dialogUserMgrRef = this.dialog.open(UsermgrDialogComponent, { width: '750px', height: '500px', autoFocus: true, data: this.user });
    dialogUserMgrRef.afterClosed()
      .subscribe((rtn) => {
        this.conlog.log(rtn);
    });
  }

  openPortalSessionDialog() {
    const dialogSessionMgrRef = this.dialog.open(SessionDialogComponent, { width: '750px', height: '500px', autoFocus: true, data: this.user });
    dialogSessionMgrRef.afterClosed()
      .subscribe((rtn) => {
        this.conlog.log(rtn);
      });
  }

  setupVersion() {
    this.build = this.store.getSystemValue("build");
    this.version = "Version " + this.store.getVersion();
  }

  confirmDisplayWhatsNew() {
    if((this.store.getVersion() > this.user.lastversion))
      this.displayWhatsNew();
  }

  displayWhatsNew(requested: boolean = false) {
    // Only display if the stored build version is greater than the user version
    let builds: any = this.store.getSystemValue('build');
    if(builds != undefined) { // Ignore this entire process if the build information is not retrieved.
      if (builds[0].BuildVersion > this.user.lastversion || requested) {

        //Display the What's new page if there is something new since the last time it was checked.
        const dialogBannerRef = this.dialog.open(WhatsnewDialogComponent, {
          width: '700px', height: '550px', autoFocus: true, data: this.user
        });
        dialogBannerRef.afterClosed().subscribe((u) => {
          if (u != null) this.user = u;
        });
      }
    }
  }
}
