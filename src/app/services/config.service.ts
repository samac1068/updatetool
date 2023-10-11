import { Injectable } from '@angular/core';

import { Server } from '../models/Server.model';
import { Database } from '../models/Database.model';
import {System} from "../models/System.model";

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  serverUrl = 'assets/config/serverconfig.xml';
  systemUrl = 'assets/config/config.xml';

  server!: Server;
  database!: Database;

  constructor() { }

  // Return a list of servers and databases unassigned
  getServerConfig() {
    let xml:XMLHttpRequest = new XMLHttpRequest();
    xml.open('GET', this.serverUrl, false);
    xml.send();

    const xmlData = xml.responseXML;

    // Pulling server data
    const servers = xmlData!.getElementsByTagName('server');
    const serverList = [];

    for (let i = 0; i < servers.length; i++) {
      this.server = {id: servers[i].getAttribute('id')!, offName: servers[i].getAttribute('offName')!}
      serverList.push(this.server);
    }

    // Pulling database data
    const databases = xmlData!.getElementsByTagName('database');
    const databaseList = [];
    for (let i = 0; i < databases.length; i++) {
      this.database = {id: databases[i].getAttribute('id')!, altname: databases[i].getAttribute('altname')!}
      databaseList.push(this.database);
    }
    return {servers: serverList, databases: databaseList};
  }


  //Returns a single server name and path currently being used
  getSystemConfig()  {
    const xml = new XMLHttpRequest();
    xml.open('GET', this.systemUrl, false);
    xml.send();

    const xmlData = xml.responseXML;
    const sys = xmlData!.getElementsByTagName('system');
    for (let i = 0; i < sys.length; i++) {
      if (sys[i].getAttribute('active') === 'true') {
        return {
          type: sys[i].getAttribute('type'),
          network: sys[i].getAttribute('network'),
          path: (sys[i].getAttribute('path')  != undefined) ? sys[i].getAttribute('path') : null,
          sapi: (sys[i].getAttribute('sapi') != undefined) ? sys[i].getAttribute('sapi') : null,
          webcontrol: (sys[i].getAttribute('webcontrol') != undefined) ? sys[i].getAttribute('webcontrol') : "UTool",
          servers: null,
          databases: null,
          apiGet: false,
          apiPost: false,
          apiDB: false,
          apiIntID: -1
        }
      }
    }

    return
  }
}
