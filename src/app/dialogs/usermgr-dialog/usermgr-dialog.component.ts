import { Component, OnInit } from '@angular/core';
import {MatDialogRef} from '@angular/material';
import { MatTableDataSource } from '@angular/material/table';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {StorageService} from '../../services/storage.service';
import {DataService} from '../../services/data.service';
import {Admin} from '../../models/Admin.model';
import {SelectionModel} from '@angular/cdk/collections';
import {User} from '../../models/User.model';

@Component({
  selector: 'app-usermgr-dialog',
  templateUrl: './usermgr-dialog.component.html',
  styleUrls: ['./usermgr-dialog.component.css']
})
export class UsermgrDialogComponent implements OnInit {

  displayedColumns: string[] = ['select', 'UserID', 'Username'];
  mgrGrp: FormGroup;
  availDatabase: any = [];
  assignedUser: any = [];
  adminItem: Admin = new Admin();
  selection = new SelectionModel<Admin>(true, []);
  selectUser: any;
  buttonLbl: string = "Add";
  curUser: User;


  constructor(private dialogRef: MatDialogRef<UsermgrDialogComponent>, private fb: FormBuilder, private store: StorageService, private data: DataService) {
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

    // Get the Available database information
    this.availDatabase = this.store.system['databases'];
    this.adminItem.adminuser = this.store.user.username;
    this.curUser = this.store.getUser();

    this.getQTUserList();
  }

  getQTUserList() {
    // Pull the current list of QT users
    this.adminItem.action = 'getuserlist';
    this.data.adminManager(this.adminItem)
      .subscribe((results) => {
        this.assignedUser = new MatTableDataSource<User>(results);
      });
  }

  cleanUpString(value: string) {
    return value.replace("_", " ");
  }

  purgeTokens(): void{
    let obj = new Admin()
    obj.action = 'purgetokens';
    this.data.adminManager(obj).subscribe(() => { console.log("purge complete"); this.store.generateToast("QT Orphan Tokens have been purged");});
  }

  purgeLogs():void {
    let obj = new Admin()
    obj.action = 'purgelogs';
    this.data.adminManager(obj).subscribe(() => { console.log("purge complete"); this.store.generateToast("QT Logs have been purged");});
  }

  purgeCUTDuplicates():void {
    let obj = new Admin()
    obj.action = 'dropcutdups';
    this.data.adminManager(obj).subscribe(() => { console.log("purge complete"); this.store.generateToast("Duplicates have been purged"); });
  }

  purgeSelectedUsers() {
    let useridstr: any = [];

    // Get the id's of the selected
    this.selection.selected.forEach((item: any) => {
      useridstr.push(item.UserID);
    });

    let obj = new Admin()
    obj.action = 'removeusers';
    obj.useridstr = useridstr.join();
    this.data.adminManager(obj).subscribe(() => {
      this.store.generateToast("Selected user's access has been removed.");
      this.selection.clear();
      this.getQTUserList();
    });

  }

  evalUpdateButton() {
    this.buttonLbl = (this.selectUser.userid > -1) ? "Update" : "Add";
  }

  userSelected(row) {
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

  resetForm() {
    this.selectUser = null;
    this.mgrGrp.reset();
  }

  addEditSelectUser() {
    this.selectUser = new Admin();
    this.selectUser.userid = (this.mgrGrp.controls.userid.value == null) ? 0 : this.mgrGrp.controls.userid.value;
    this.selectUser.isadmin = this.mgrGrp.controls.priv.value;
    this.selectUser.username = this.mgrGrp.controls.username.value;
    this.selectUser.firstname = this.mgrGrp.controls.firstname.value;
    this.selectUser.lastname = this.mgrGrp.controls.lastname.value;
    this.selectUser.version = this.store.getVersion();
    this.selectUser.network = this.curUser.servername + "|" + this.curUser.server + "#" + this.mgrGrp.controls.database.value;
    this.selectUser.action = (this.selectUser.userid == 0) ? 'adduser' : 'edituser';
    console.log(this.selectUser);

    //Send the information to the database
    this.data.adminManager(this.selectUser)
      .subscribe(() => {
          this.store.generateToast((this.selectUser.userid == 0) ? "The new user has been added to the system." : "The user's information has been updated.");
          this.resetForm();
      },
        err => {
          alert("There was an error while attempt to update this information. Error:" + err);
        });
  }

  isAllSelected() {
    const numSelected = (this.selection.selected != undefined) ? this.selection.selected.length : 0;
    const numRows = (this.assignedUser.filteredData != undefined) ? this.assignedUser.filteredData.length : 0;
    return numSelected === numRows;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.assignedUser.data);
  }

  checkboxLabel(row?: Admin): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.userid + 1}`;
  }

  closeDialog() {
    this.resetForm();
    this.dialogRef.close();
  }

}
