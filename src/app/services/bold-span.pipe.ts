import {Pipe, PipeTransform, Sanitizer, SecurityContext} from '@angular/core';

// noinspection RegExpRedundantEscape
@Pipe({
  name: 'boldSpan'
})
export class BoldSpanPipe implements PipeTransform {

  regex = /[\*][\w\W]*[\*]/gmi;
  constructor(private sanitizer: Sanitizer) {
  }
  transform(value: string): any {
    return this.sanitize(this.replace(value, this.regex))
  }

  replace(str: string, regex: any){
    return str.replace(new RegExp(`(${regex})`, 'gi'), '<b>$1</b>');
  }

  sanitize(str: string){
    return this.sanitizer.sanitize(SecurityContext.HTML, str);
  }
}
