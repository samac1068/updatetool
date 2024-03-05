import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'storedProcFilter'
})
export class StoredProcFilterPipe implements PipeTransform {

  transform(arr:any[], filterTerm: string): any[] {
    if(!arr || !filterTerm)
      return arr;

    // Return only those items that match the provided filter
    return arr.filter(item => item.NAME.toLowerCase().indexOf(filterTerm.toLowerCase()) !== -1);

  }

}
