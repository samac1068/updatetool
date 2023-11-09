import { Pipe, PipeTransform } from '@angular/core';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'querySafe',
  pure: false
})
export class QueryPipe implements PipeTransform {

  constructor(protected _sanitizer: DomSanitizer) { }
  transform(items: any): SafeHtml {
    return (items != undefined) ? this._sanitizer.bypassSecurityTrustHtml(items) : "";
  }
}
