import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogConsoleDialogComponent } from './log-console-dialog/log-console-dialog.component';
import { ConlogService } from './conlog.service';

@NgModule({
  declarations: [
    LogConsoleDialogComponent
  ],
  imports: [
    CommonModule
  ],
  entryComponents: [
    LogConsoleDialogComponent
  ],
  providers: [
    ConlogService
    ],
  exports: [
    LogConsoleDialogComponent
  ]
})
export class ConlogModule { }
