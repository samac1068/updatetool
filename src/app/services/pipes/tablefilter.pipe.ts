import { PipeTransform, Pipe } from "@angular/core";

@Pipe ({
    name: 'tableFilter'
})
export class TableFilterPipe implements PipeTransform {
    transform(tables: any[], searchTerm: string): any[] {
        if(!tables || !searchTerm)
            return tables;

        return tables.filter(tables => tables.name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1)    
    }
}