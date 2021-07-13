import { Injectable, EventEmitter } from "@angular/core";

@Injectable
({ providedIn: 'root'})
export class CommService {
  userValidated = new EventEmitter();
  userInfoLoaded = new EventEmitter();    //When user's information has been loaded
  tableSelected = new EventEmitter();    //When a table is selected from the list
  columnsUpdated = new EventEmitter();    //After the table is loaded and a list of columns is retrieved
  setQueryButton = new EventEmitter();  //headleyt:  20210112 Enable/disable the Save Current Query button
  populateQueryList = new EventEmitter();  //  headleyt:  20210113  populate list of user saved queries

  selectTab = new EventEmitter();  //  headley:  20210120  a tab has been selected

  noToolUserInfoFound = new EventEmitter();    //Displays when no user's information was saved
  userUpdatedReloadSys = new EventEmitter();    //Only some of the data was found

  runQueryChange = new EventEmitter();    //Execute the current query
  runStoredQuery = new EventEmitter();     //Execute a stored query
  storeUserOptions = new EventEmitter();    // Store the selected user options, if there is a change
  saveNewQuery = new EventEmitter();        //Save the currently created query to the database

  // Buttons Clicked Events
  columnBtnClicked = new EventEmitter();    //Customize Column Button clicked
  orderByBtnClicked = new EventEmitter();    //Order By Button clicked
  joinBtnClicked = new EventEmitter();       // Join Button clicked
  viewerBtnClicked = new EventEmitter();     //Store proc viewer button clicked

  addNewTabClicked = new EventEmitter();    //A new tab has been requested either for the stored query or for the selected server and database

  exportToExcelClicked = new EventEmitter();        //When the button is clicked
  copyToClipboardClicked = new EventEmitter();      //Copy results to the clipboard

  tabFault = new EventEmitter();            //Used when there is an issue withe the data updating the wrong tab

  dataModifierClicked = new EventEmitter();   // Calls the new data modifier dialog to be opened.
}
