import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Tab } from 'src/app/models/Tab.model';
import { StorageService } from 'src/app/services/storage.service';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-viewer-dialog',
  templateUrl: './viewer-dialog.component.html',
  styleUrls: ['./viewer-dialog.component.css']
})
export class ViewerDialogComponent implements OnInit {

  procArr: any[] = [];
  viewArr: any[] = [];
  funcArr: any[] = [];

  returnType: string = "";

  procViewText: string = "Select a Stored Proc, View, or Function";
  newLine:RegExp = /\n/gi;
  /* tabs:RegExp = /\t/gi;
  dspace:RegExp = /  +/g; */
  
          
  constructor(public dialogRef: MatDialogRef<ViewerDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: Tab, private store: StorageService, 
  private ws: DataService) { }

  ngOnInit() {
    //Go grab all of the lists now
    this.ws.getStoreProcList(this.data.server.replace('{0}', this.data.database), this.data.database)
    .subscribe((results) => {
      this.procArr = results;
    });

    this.ws.getStoredViewList(this.data.server.replace('{0}', this.data.database), this.data.database)
    .subscribe((results) => {
      this.viewArr = results;
    });

    this.ws.getStoredFunctionsList(this.data.server.replace('{0}', this.data.database), this.data.database)
    .subscribe((results) => {
      this.funcArr = results;
    });
  }

  openSelectedItem(type: string, name: string) {
    this.returnType = type;  

    this.ws.getStoredValues(this.data.server.replace('{0}', this.data.database), this.data.database, name)
    .subscribe((results) => {
      this.procViewText = "";

      for(var i=0; i < results.length; i++) {
        this.procViewText += results[i].Definition + "\r";
        this.procViewText = this.procViewText.replace(this.newLine, "");
      }
    });
  }

  closeDialog() {
    this.dialogRef.close(this.data);
  }
}
