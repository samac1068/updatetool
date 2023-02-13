import {Component, OnInit} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {StorageService} from '../../services/storage.service';
import {DataService} from '../../services/data.service';
import {Admin} from '../../models/Admin.model';
import {SelectionModel} from '@angular/cdk/collections';
import {User} from '../../models/User.model';
import {ConlogService} from '../../modules/conlog/conlog.service';
import {CommService} from '../../services/comm.service';
import {ColDef, GridApi} from 'ag-grid-community'

@Component({
  selector: 'app-usermgr-dialog',
  templateUrl: './usermgr-dialog.component.html',
  styleUrls: ['./usermgr-dialog.component.css']
})
export class UsermgrDialogComponent implements OnInit {

  assignedUser: any = [];
  //colHeader!: string[];
  columnDefs: any[] = [{field: 'userid', headerName: 'UID', width: 80}, {field: 'username', headerName: 'UserName'}];
  defColDefine: ColDef = { sortable: true, filter: true, resizable: true, autoHeaderHeight: true };
  gridHeaderHeight: number = 22;
  gridRowHeight: number = 22;
  gridApi!: GridApi;
  isManEntry: boolean = true;
  selectedData: any;
  //displayedColumns: string[] = ['select', 'UserID', 'Username'];
  mgrGrp!: FormGroup;
  availDatabase: any = [];
  adminItem: Admin = new Admin();
  selection = new SelectionModel<Admin>(true, []);
  selectUser: any;
  buttonLbl: string = "Add";
  curUser!: User;
  onSipr: boolean = false;
  validateData: boolean = false;

  constructor(private dialogRef: MatDialogRef<UsermgrDialogComponent>, private fb: FormBuilder, private store: StorageService, private data: DataService, private conlog: ConlogService,
              private comm: CommService) {
    dialogRef.disableClose = true;
  }

  ngOnInit() {
    // Establish the Form Group
    this.mgrGrp = this.fb.group({
      'userid': new FormControl(''),
      'priv': new FormControl(''),
      'username': new FormControl('', [Validators.required]),
      'firstname': new FormControl('',[Validators.required]),
      'lastname': new FormControl('', [Validators.required]),
      'database': new FormControl('', [Validators.required])
    });

    this.mgrGrp.reset();
  }

  onGridReady(params: any) {
    this.gridApi = params.api;

    // Get the Available database information
    this.availDatabase = this.store.system['databases'];
    this.adminItem.adminuser = this.store.user.username;
    this.curUser = this.store.getUser();
    this.onSipr = this.store.getSystemValue('webservice').network == "sipr";
    this.getQTUserList();
  }

  getQTUserList() {
    // Pull the current list of QT users
    this.adminItem.action = 'getuserlist';
    this.data.adminManager(this.adminItem)
      .subscribe((results) => {
        this.assignedUser = results;
      });
  }

  cleanUpString(value: string) {
    return value.replace("_", " ");
  }

  purgeTokens(): void{
    let obj = new Admin()
    obj.action = 'purgetokens';
    this.data.adminManager(obj).subscribe(() => { this.conlog.log("purge token complete"); this.store.generateToast("QT Orphan Tokens have been purged");});
  }

  purgeLogs():void {
    let obj = new Admin();
    let d = new Date();
    d.setDate(d.getDate() - 365);
    obj.action = 'purgelogs';
    obj.purgedate = (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
    this.data.adminManager(obj).subscribe(() => { this.conlog.log("purge logs complete from date '" + obj.purgedate + "'"); this.store.generateToast("QT Logs have been purged up to '" + obj.purgedate + "'");});
  }

  purgeCUTDuplicates():void {
    let obj = new Admin()
    obj.action = 'dropcutdups';
    this.data.adminManager(obj).subscribe(() => { this.conlog.log("purge duplicates complete"); this.store.generateToast("Duplicates have been purged"); });
  }

  resetPortalSession():void {
    this.closeDialog();   // Everything we need to do for portal session reset, will be done with a new window
    this.comm.resetPortalSessionClicked.emit();
  }

  purgeSelectedUsers() {
    let useridarr:any = [];

    this.selectedData.forEach( (r:any) => {
      useridarr.push(r.userid);
    });

    let obj = new Admin()
    obj.action = 'removeusers';
    obj.useridstr = useridarr.join();
    this.data.adminManager(obj).subscribe(() => {
      this.store.generateToast("Selected user's access has been removed.");
      this.selection.clear();
      this.resetForm();
      this.getQTUserList();
    });
  }

  evalUpdateButton() {
    this.buttonLbl = (this.selectUser != undefined) ? "Update" : "Add";
  }

  onSelectionChange() {
    this.isManEntry = false;
    this.selectedData = this.gridApi.getSelectedRows();

    if(this.selectedData.length == 1) {
      this.userSelected(this.selectedData[0]);
      this.validateData = true;
    } else {
      this.validateData = false;
      this.mgrGrp.reset();
      this.evalUpdateButton();
    }
  }

  userSelected(row: any) {
    // May need to split out the network information to expose the selected (default) database
    row.database = row.network.split("#")[1];
    this.selectUser = row;

    // Set up the form control
    this.mgrGrp.controls['userid'].setValue(this.selectUser.userid);
    this.mgrGrp.controls['priv'].setValue(this.selectUser.priv);
    this.mgrGrp.controls['username'].setValue(this.selectUser.username);
    this.mgrGrp.controls['firstname'].setValue(this.selectUser.fname);
    this.mgrGrp.controls['lastname'].setValue(this.selectUser.lname);
    this.mgrGrp.controls['database'].setValue(this.selectUser.database);

    this.evalUpdateButton();
  }

  formPopulated() {
    return (
      this.mgrGrp.controls.userid.value != null ||
      this.mgrGrp.controls.username.value != null ||
      this.mgrGrp.controls.firstname.value != null ||
      this.mgrGrp.controls.lastname.value != null
    )
  }

  resetForm() {
    this.selectUser = null;
    this.mgrGrp.reset();
    this.isManEntry = true;
    this.evalUpdateButton();
  }

  addEditSelectUser() {
    this.selectUser = new Admin();
    this.selectUser.userid = (this.mgrGrp.controls.userid.value == null) ? 0 : this.mgrGrp.controls.userid.value;
    this.selectUser.isadmin = this.mgrGrp.controls.priv.value;
    this.selectUser.username = this.mgrGrp.controls.username.value;
    this.selectUser.firstname = this.mgrGrp.controls.firstname.value;
    this.selectUser.lastname = this.mgrGrp.controls.lastname.value;
    this.selectUser.version = "2.0"; //this.store.getVersion().substr(0, this.store.getVersion().indexOf(" ") - 1);
    this.selectUser.network = this.curUser.servername + "|" + this.curUser.server;
    this.selectUser.database = this.mgrGrp.controls.database.value;
    this.selectUser.action = (this.selectUser.userid == 0) ? 'adduser' : 'edituser';
    this.conlog.log(this.selectUser);

    // Make sure we have the data needed to add a new user, at the least
    if(!this.store.checkStringForNullOrEmpty(this.selectUser.username) &&
        !this.store.checkStringForNullOrEmpty(this.selectUser.firstname) &&
        !this.store.checkStringForNullOrEmpty(this.selectUser.lastname) &&
        !this.store.checkStringForNullOrEmpty(this.selectUser.database)) {
      //Send the information to the database
      this.data.adminManager(this.selectUser)
        .subscribe(() => {
            this.store.generateToast((this.selectUser.userid == 0) ? "The new user has been added to the system." : "The user's information has been updated.");
            this.resetForm();
            this.getQTUserList();
          },
          err => {
            alert("There was an error while attempt to update this information. Error:" + err);
          });
    } else alert("You did not provide enough data to complete this request. Please review the form and try again.");
  }

  /*isAllSelected() {
    const numSelected = (this.selection.selected != undefined) ? this.selection.selected.length : 0;
    const numRows = (this.assignedUser.filteredData != undefined) ? this.assignedUser.filteredData.length : 0;
    return numSelected === numRows;
  }*/

 /* masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.assignedUser.data);
  }*/

  /*checkboxLabel(row?: Admin): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }

    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.userid + 1}`;
  }*/

  closeDialog() {
    this.resetForm();
    this.dialogRef.close();
  }
}
