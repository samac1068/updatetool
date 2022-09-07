import { CommService } from 'src/app/services/comm.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-exporter',
  templateUrl: './exporter.component.html',
  styleUrls: ['./exporter.component.css']
})
export class ExporterComponent implements OnInit {

  constructor(private comm: CommService) { }

  ngOnInit() {
  }

  exportToExcelHandler() {
    this.comm.exportToExcelClicked.emit();
  }
}
