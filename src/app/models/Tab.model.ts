import { SortItem } from './SortItem.model';
import { Column } from './Column.model';
import { Table } from "./Table.model";
import { Join } from './Join.model';

export class Tab {
  tabid: string;
  tabindex: number;
  server: string;  //Primary Server
  servername: string  //Primary Server working name
  database: string;  // Primary Database (first in the databasearr)
  table: Table;  // Primary selected table
  columns: Column[];  //List of columns or primary table

  hasPrimKey: boolean;  // Set to true if the table has a primary key already set
  tempPrimKey: any = null;    //Storage location of a temporary primary key.  May include multiple columns

  active: boolean;

  tabtitle: string;
  seltbllist: Table[];  //list of table for the primary database

  querystr: string;
  querytitle: string;
  qtype: string;  // headleyt:  20210106 added qtype to make it available as a parameter when saving a query

  //Variabled for standard uses
  databasearr: any[]; //id, name
  tablearr: any[];    //id, name, did

  colfilterarr: string[];  //List of custom columns for query
  availcolarr: Column[];  //List of all columns available for this tab ( tbl id, columnname, ...)
  joinarr: Join[];
  wherearr: string[];
  wherearrcomp: any[];
  orderarr: SortItem[];

  getcount: boolean;
  limitRows: boolean;
  selectcnt: string;

  //Variabled for stored query use
  isstoredquery: boolean = false;
  sqid: number;
  sqdatabase: string;
  sqserver: string;
  sqbody: string;

  selectedrow: any;
}
