import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'columnFilter'
})
export class ColumnFilterPipe implements PipeTransform {

  transform(column: any, ...args: any[]): any {
    // filter the list based on what was entered in the searchTerms (args[0])
    if(args[0] != undefined)
      return column.find((st:any) => st.columnname.toLowerCase().indexOf(args[0].toLowerCase()));

    return null;
  }

}
