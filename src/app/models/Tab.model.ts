import { SortItem } from './SortItem.model';
import { Column } from './Column.model';
import { Table } from "./Table.model";
import { Join } from './Join.model';

export class Tab {
  tabid!: string;
  tabindex!: number;
  server!: string;  //Primary Server
  servername!: string  //Primary Server working name
  database!: string;  // Primary Database (first in the databasearr)
  table!: Table;  // Primary selected table
  columns!: Column[];  //List of columns or primary table
  distinctcol!: string;  //Used to identify the single distinct column for this query

  hasPermPrimKey!: boolean;   // Identifies if the table has a true primary key that is not temporary.
  hasTempPrimKey!: boolean;  // Set to true if the table has a primary key (temporary or created)
  tempPrimKey: any = null;    //Storage location of a temporary primary key.  May include multiple columns
  primKeyID!: number;      // The database ID number of the currently selected tempPrimKey
  col: string|null = null;   // Used for storing the cell information for the primary key function
  active!: boolean;

  tabtitle!: string;
  tabAltText!: string;
  seltbllist!: Table[];  //list of table for the primary database

  querystr!: string;
  rawquerystr!: string;

  querytitle!: string;
  qtype!: string;  // headleyt:  20210106 added qtype to make it available as a parameter when saving a query

  //Variable for standard uses
  databasearr!: any[]; //id, name
  tablearr!: any[];    //id, name, did

  colfilterarr!: string[];  //List of custom columns for query
  availcolarr!: Column[];  //List of all columns available for this tab ( tbl id, columnname, ...)
  joinarr!: Join[];
  wherearr!: string[];
  wherearrcomp!: any[];
  orderarr!: SortItem[];

  getcount!: boolean;
  limitRows!: boolean;
  selectcnt: string = "100";

  //Variabled for stored query use
  isstoredquery: boolean = false;
  sqid!: number;
  sqdatabase!: string;
  sqserver!: string;
  sqbody!: string;
  sqcolumns!: string[] | null;

  selectedrow: any;

  updateRecReq: boolean = false;

  // Variables for the Stored Procedure Execution Function
  spManager!: any;
  storedProcArr!: string[] | null;
  selectedSPName!: string | null;
  selectedSPProps!: any[] | null;
  selectedSPResults!: any[] | null;
  spListCollectDate!: number | null;
  resultsExported: boolean = false;

}
