import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OkDialogComponent } from '../dialogs/ok-dialog/ok-dialog.component';

@Injectable()
export class OkDialogService {

  constructor(private modalService: NgbModal) { }

  public confirm(
    title: string,
    message: string,
    btnOkText: string = 'OK',
    dialogSize: 'sm'|'lg' = 'sm'): Promise<boolean> {
    const modalRef = this.modalService.open(OkDialogComponent, { size: dialogSize });
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.btnOkText = btnOkText;
    
    return modalRef.result;
  }
}
