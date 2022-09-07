import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Tab } from 'src/app/models/Tab.model';
import { CommService } from 'src/app/services/comm.service';

@Component({
  selector: 'app-select-pnl',
  templateUrl: './select-pnl.component.html',
  styleUrls: ['./select-pnl.component.css']
})
export class SelectPnlComponent implements OnInit {
  @Input() tabinfo!: Tab;

  isStoredQuery: boolean = false;

  constructor() { }

  ngOnInit() {
    this.isStoredQuery = this.tabinfo.isstoredquery;
  }
}
