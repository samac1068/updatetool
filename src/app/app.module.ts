import {NgModule} from '@angular/core';

//Components
import { AppComponent } from './app.component';
import { BannerComponent } from './components/banner/banner.component';
import { ServersComponent } from './components/servers/servers.component';
import { ExporterComponent } from './components/exporter/exporter.component';
import { TabsComponent } from './components/tabs/tabs.component';
import { TabComponent } from './components/tab/tab.component';
import { QueryResultComponent } from './components/query-result/query-result.component';
import { SelectPnlComponent } from './components/select-pnl/select-pnl.component';
import { TablesComponent } from './components/tables/tables.component';
import { QueryBtnsComponent } from './components/query-btns/query-btns.component';
import { FiltersComponent } from './components/filters/filters.component';
import { TableFilterPipe } from './services/tablefilter.pipe';
import { ListboxComponent } from './components/listbox/listbox.component';
import { ConlogModule } from './modules/conlog/conlog.module';


// Services
import { StorageService } from './services/storage.service';
import { ConfirmationDialogService } from  './services/confirm-dialog.service';
import { ConfigService } from './services/config.service';
import { DataService } from './services/data.service';
import { ExcelService } from './services/excel.service';
import { CopyTextDirective } from './services/copy-text.directive';

// Angular Modules Imports
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DataTablesModule } from 'angular-datatables';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

// Dialog Imports
import { ColumnsDialogComponent } from './dialogs/columns-dialog/columns-dialog.component';
import { ConfirmDialogComponent } from './dialogs/confirm-dialog/confirm-dialog.component';
import { OrderbyDialogComponent } from './dialogs/orderby-dialog/orderby-dialog.component';
import { JoinDialogComponent } from './dialogs/join-dialog/join-dialog.component';
import { OkDialogService } from './services/ok-dialog.service';
import { OkDialogComponent } from './dialogs/ok-dialog/ok-dialog.component';
import { ViewerDialogComponent } from './dialogs/viewer-dialog/viewer-dialog.component';
import { OptionsDialogComponent } from './dialogs/options-dialog/options-dialog.component';
import { QueryDialogComponent } from './dialogs/query-dialog/query-dialog.component';
import { WhatsnewDialogComponent } from './dialogs/whatsnew-dialog/whatsnew-dialog.component';
import { UpdaterDialogComponent } from './dialogs/updater-dialog/updater-dialog.component';
import { PrimkeyDialogComponent } from './dialogs/primkey-dialog/primkey-dialog.component';
import { ModifierDialogComponent } from './dialogs/modifier-dialog/modifier-dialog.component';
import { UsermgrDialogComponent } from './dialogs/usermgr-dialog/usermgr-dialog.component';
import { ToastNotificationsModule } from 'ngx-toast-notifications';
import { SessionDialogComponent } from './dialogs/session-dialog/session-dialog.component';


@NgModule({
  declarations: [
    AppComponent,
    BannerComponent,
    ServersComponent,
    ExporterComponent,
    TabsComponent,
    TabComponent,
    QueryResultComponent,
    SelectPnlComponent,
    TablesComponent,
    QueryBtnsComponent,
    FiltersComponent,
    TableFilterPipe,
    ColumnsDialogComponent,
    ConfirmDialogComponent,
    OrderbyDialogComponent,
    JoinDialogComponent,
    OkDialogComponent,
    ViewerDialogComponent,
    OptionsDialogComponent,
    QueryDialogComponent,
    WhatsnewDialogComponent,
    CopyTextDirective,
    UpdaterDialogComponent,
    PrimkeyDialogComponent,
    ModifierDialogComponent,
    UsermgrDialogComponent,
    ListboxComponent,
    SessionDialogComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    DataTablesModule,
    HttpClientModule,
    MatTabsModule,
    BrowserAnimationsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatCheckboxModule,
    MatSelectModule,
    MatRadioModule,
    DragDropModule,
    MatExpansionModule,
    MatInputModule,
    MatButtonModule,
    ToastNotificationsModule,
    MatListModule,
    ConlogModule,
    MatProgressSpinnerModule
  ],
  providers: [
    DataService,
    StorageService,
    ConfigService,
    ConfirmationDialogService,
    OkDialogService,
    ExcelService
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    ColumnsDialogComponent,
    ConfirmDialogComponent,
    OrderbyDialogComponent,
    JoinDialogComponent,
    OkDialogComponent,
    ViewerDialogComponent,
    OptionsDialogComponent,
    QueryDialogComponent,
    WhatsnewDialogComponent,
    UpdaterDialogComponent,
    PrimkeyDialogComponent,
    UsermgrDialogComponent
  ]
})
export class AppModule { }
