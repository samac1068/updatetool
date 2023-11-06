
export class Join {
    jid!: number;
    type: string = "JOIN";

    dbleft!: string;
    tableleft!: string;
    columnleft!: string;
    aliasleft!: string;

    dbright!: string;
    tableright!: string;
    columnright!: string;
    aliasright!: string;

    operator: string = "=";
    joinclausestr: string = "";
}
