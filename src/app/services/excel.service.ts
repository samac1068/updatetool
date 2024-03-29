import { Injectable } from '@angular/core';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import {ConlogService} from '../modules/conlog/conlog.service';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';
const CSV_EXTENSION = '.csv';

@Injectable()
export class ExcelService {

  constructor(private conlog: ConlogService) { }

  public exportAsExcelFile(json: any[], excelFileName: string, type: string): void {

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);

    if(type == "excel") {
      this.conlog.log("Generating EXCEL report");
      const workbook: XLSX.WorkBook = {Sheets: {'data': worksheet}, SheetNames: ['data']};
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      ExcelService.saveAsExcelFile(excelBuffer, excelFileName);
    } else {
      this.conlog.log("Generating CSV report");
      const csvOutput: string = XLSX.utils.sheet_to_csv(worksheet);
      ExcelService.saveAsCSVFile(new Blob([csvOutput]), excelFileName);
    }
  }

  private static saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {type: EXCEL_TYPE});
    FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
  }

  private static saveAsCSVFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {type: EXCEL_TYPE});
    FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + CSV_EXTENSION);
  }
}
