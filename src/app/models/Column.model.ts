
export class Column
{
    tablename!: string;
    columnid!: number;
    columnname!: string;
    vartype!: string;
    maxlength!: number;
    primarykey!: boolean;
    precise!: number;
    scale!: number;
    charfulllength!: number;
    selected!: boolean;
    orderby!: boolean;
    orderbysort!: string;
    orderbyindex!: number;
    tableid?: number;
    colSelected!: boolean;
}
