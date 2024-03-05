import { Injectable, EventEmitter } from "@angular/core";

@Injectable
({ providedIn: 'root'})
export class CommService {
  userValidated: EventEmitter<any> = new EventEmitter();
  userInfoLoaded: EventEmitter<any> = new EventEmitter();    //When user's information has been loaded
  tableSelected: EventEmitter<any> = new EventEmitter();    //When a table is selected from the list
  columnsUpdated: EventEmitter<any> = new EventEmitter();    //After the table is loaded and a list of columns is retrieved
  setQueryButton: EventEmitter<any> = new EventEmitter();  //headleyt:  20210112 Enable/disable the Save Current Query button
  populateQueryList: EventEmitter<any> = new EventEmitter();  //  headleyt:  20210113  populate list of user saved queries
  selectTab: EventEmitter<any> = new EventEmitter();  //  headley:  20210120  a tab has been selected
  noToolUserInfoFound: EventEmitter<any> = new EventEmitter();    //Displays when no user's information was saved
  userUpdatedReloadSys: EventEmitter<any> = new EventEmitter();    //Only some of the data was found
  runQueryChange: EventEmitter<any> = new EventEmitter();    //Execute the current query
  runStoredQuery: EventEmitter<any> = new EventEmitter();     //Execute a stored query
  storeUserOptions: EventEmitter<any> = new EventEmitter();    // Store the selected user options, if there is a change
  saveNewQuery: EventEmitter<any> = new EventEmitter();        //Save the currently created query to the database

  // Buttons Clicked Events
  columnBtnClicked: EventEmitter<any> = new EventEmitter();    //Customize Column Button clicked
  orderByBtnClicked: EventEmitter<any> = new EventEmitter();    //Order By Button clicked
  joinBtnClicked: EventEmitter<any> = new EventEmitter();       // Join Button clicked
  viewerBtnClicked: EventEmitter<any> = new EventEmitter();     //Store proc viewer button clicked
  addNewTabClicked: EventEmitter<any> = new EventEmitter();    //A new tab has been requested either for the stored query or for the selected server and database
  exportToExcelClicked: EventEmitter<any> = new EventEmitter();        //When the button is clicked
  copyToClipboardClicked: EventEmitter<any> = new EventEmitter();      //Copy results to the clipboard
  tabFault: EventEmitter<any> = new EventEmitter();            //Used when there is an issue with the data updating the wrong tab
  dataModifierClicked: EventEmitter<any> = new EventEmitter();   // Calls the new data modifier dialog to be opened.
  reloadStoredColumnData: EventEmitter<any> = new EventEmitter();    // Used to reload the loaded column value information which are the selected and primary key information for the current table
  joinsModified: EventEmitter<any> = new EventEmitter();            // Called when a join has been applied to the table.
  validatePrimKey: EventEmitter<any> = new EventEmitter();           // Used to run the centralized function that allows the user to select or confirm selected temporary primary key
  resetPortalSessionClicked: EventEmitter<any> = new EventEmitter();   // Used when the button to reset the portal from the User Manager is clicked.
  //commsCheckComplete: EventEmitter<any> = new EventEmitter();       // Used when the communications check completes all steps and ready to close.
  deleteSavedQueryClicked: EventEmitter<any> = new EventEmitter();    // Used when the user clicks the delete query button
  runStoredProcedureClicked: EventEmitter<any> = new EventEmitter();     // Used to open associated stored procedure dialog and allow the execute and display of the information.
  deleteSPDialog: EventEmitter<any> = new EventEmitter();
}
