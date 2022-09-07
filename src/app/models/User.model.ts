
export class User {
  userid!: number;
  username!: string;
  fname!: string;
  lname!: string;
  lastlogin!: string;
  lastversion!: string;
  lastversiondt!: string;
  servername!: string;
  server!: string;
  database!: string;
  appdata!: string;
  storedqueries!: string[];
  token!: string;
  tokencreatedate!: string;
  initalapp!: string;
  datamodified: boolean = false;
  priv!: number;
  network!: string;
  storedcolumns!: string[];
}
