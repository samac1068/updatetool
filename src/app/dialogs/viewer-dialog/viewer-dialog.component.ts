import {Component, OnInit, Inject, ViewChild} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Tab } from 'src/app/models/Tab.model';
import { StorageService } from 'src/app/services/storage.service';
import { DataService } from 'src/app/services/data.service';
import {CdkAccordion} from "@angular/cdk/accordion";

@Component({
  selector: 'app-viewer-dialog',
  templateUrl: './viewer-dialog.component.html',
  styleUrls: ['./viewer-dialog.component.css']
})

export class ViewerDialogComponent implements OnInit {
  @ViewChild('accordionItem') accordionItem!: CdkAccordion;

  storedArrs: {title: string, stype: string, data: any}[] = [
    {title: 'Stored Procedures', stype: 'proc', data: []},
    {title: 'Stored Views', stype: 'view', data: []},
    {title: 'Stored Functions', stype: 'func', data: []}
  ];
  returnType: string = "";
  procViewText: string = "Select a Stored Proc, View, or Function";
  newLine:RegExp = /\n/gi;
  /* tabs:RegExp = /\t/gi;
  dspace:RegExp = /  +/g; */
  expandedIndex = 1;
  subtitle: string  = "";

  constructor(public dialogRef: MatDialogRef<ViewerDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: Tab, private store: StorageService, private ws: DataService) { }

  ngOnInit() {
    //Go grab all the lists now
    this.storedArrs.forEach((row: any, index) => {
      this.ws.getStoredObjectList(this.data.server.replace('{0}', this.data.database), this.data.database, row.stype)
        .subscribe((results) => {
          this.storedArrs[index].data = results;
        });
    });
  }

  selectedTabIndex(ind: number, isOpen: boolean){
    console.log(ind, isOpen);
    if(isOpen){
      this.subtitle = "- " + this.storedArrs[ind].title;
    } else this.subtitle = "";

  }

  openSelectedItem(type: string, name: string) {
    this.returnType = type;

    this.ws.getStoredValues(this.data.server.replace('{0}', this.data.database), this.data.database, name)
    .subscribe((results) => {
      this.procViewText = "";

      // There are two possible return types of a stored procedure.  One will have multiple rows with a column of Text, the second will be a single row under DefText
      if(results.length > 1) {  //sp_helptext
        for(let i=0; i < results.length; i++) {
          this.procViewText += results[i].Text;
          this.procViewText = this.procViewText.replace(this.newLine, "\n");
          //this.procViewText = this.procViewText.replace(this.newLine, "\r");
        }
      } else {
        this.procViewText = results[0].DefText + "\r";
        this.procViewText = this.procViewText.replace(this.newLine, "");
      }
    });
  }

  closeDialog() {
    this.dialogRef.close(this.data);
  }
}
