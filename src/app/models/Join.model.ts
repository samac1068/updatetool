
export class Join {
    jid: number;
    type: string = "JOIN";

    dbleft: string;
    tableleft: string;
    columnleft: string;

    dbright: string;
    tableright: string;
    columnright: string;

    operator: string = "=";
    joinclausestr: string = "";
}