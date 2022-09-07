import { Component, OnInit } from '@angular/core';
import {ConlogService} from '../conlog.service';

@Component({
  selector: 'app-log-console-dialog',
  templateUrl: './log-console-dialog.component.html',
  styleUrls: ['./log-console-dialog.component.css']
})
export class LogConsoleDialogComponent implements OnInit {
  constructor(public conlog: ConlogService) { }

  ngOnInit() { }

  generateStringFromArrObj(arrObj: any): string {
    let str = "{ ";

    for (let item in arrObj) {
      str += item + ": " + this.isString(arrObj[item]) + ", "
    }

    return str.substring(0, str.length-2) + " }";
  }

  isString(value: any): string {
    if(typeof value === "string")
      return "'" + value + "'";
    else
      return value;
  }
}
