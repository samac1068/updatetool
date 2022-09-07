import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConlogService {
  logConsoleArr:any = [];

  constructor() { }

  // Used to store the information on both the console and application log.
  log(value: any): void {
    if (Array.isArray(value)) {
      // Need to reformat the information before we push it to the log array
      this.logConsoleArr.push({ txt: 'Array(' + value.length + ')', arr: value });
    } else
      this.logConsoleArr.push({ txt: value, arr: null });

    // Regardless of what comes in, push it to the standard console.
    if(value != undefined)
      console.log(value);
    else
      console.log("Value was undefined.");
  }

  getLogs(): any {
    return this.logConsoleArr;
  }
}
