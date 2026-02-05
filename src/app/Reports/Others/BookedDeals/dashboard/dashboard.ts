

import { Component, ElementRef, ViewChild, HostListener, OnInit, EventEmitter, Output, Input, Renderer2 } from '@angular/core';
import { NgbActiveModal, NgbDateParserFormatter, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Workbook } from 'exceljs';
import { DatePipe } from '@angular/common';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Subscription } from 'rxjs';
// import { DealRecapComponent } from 'src/app/Global/cdpdataview/deal/deal-recap/deal-recap.component';

// Shared / app-level utilities & modules (adapted to your project's shared service/module)
import { Sharedservice } from '../../../../Core/Providers/Shared/sharedservice';
import { SharedModule } from '../../../../Core/Providers/Shared/shared.module';
import { Setdates } from '../../../../Core/Providers/SetDates/setdates';
import { BsDatepickerConfig, BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { FilterPipe } from '../../../../Core/Providers/filterpipe/filter.pipe';
import { ChangeDetectorRef } from '@angular/core';
import { TimeConversionPipe } from '../../../../Core/Providers/pipes/timeconversion.pipe';
import { Stores } from '../../../../CommonFilters/stores/stores';
// import { ToastrService } from 'ngx-toastr';


const EXCEL_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SharedModule, BsDatepickerModule, FilterPipe, TimeConversionPipe,Stores,NgbModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard implements OnInit {
  // Dates & filters (appointment-style)
  FromDate: any;
  ToDate: any;
  CurrentDate = new Date();

  // user / store
  StoreVal: any = '0';
  Role: any = [];
  userid: any;
  dealType: string[] = ['Retail','Fleet','Wholesale'];


  // UI state
  spinnerLoader: boolean = true;
  enablevehicle: any = false;
  vehiclear: any = 'WOAR';
  noData: boolean = false;
  NoData: boolean = false;
  days: any = [];
  LogCount = 1;
  solutionurl: any = (window as any)['environment']?.apiUrl || '';
  groups: any = 1;
  callLoadingState = 'FL';
  check: boolean = false;
  Viewmore: boolean = false;

  // Data
  FloorPlanData: any = [];
  FloorPlanTotalData: any = [];
  TotalFloorPlanData: any = [];
  QISearchName: any = '';
  commentdata: any = [];
  notesstage: any = [];

  // filter defaults
  dealStatus: any = [ 'Booked','Finalized','Delivered'];
  saleType: any = ['Retail', 'Fleet'];
  allordebit: any = 'dr';
  financeManagerId: any = '0';

  // header & widgets
  header: any = [
    {
      type: 'Bar',
      storeIds: this.StoreVal,
      vehiclear: this.vehiclear,
      dealStatus: this.dealStatus,
      saleType: this.saleType,
      allordebit: this.allordebit,
      groups: this.groups,
      financemanagers: this.financeManagerId,
    },
  ];
  popup: any = [{ type: 'Popup' }];

  // notes / hide records
  notesStageValue: any = '';
  notesStageValueGrid: any = '';
  notesStageText: any = '';
  selecteddata: any = [];
  FinalArray: any = [];
  hideRecords: any = [];

  // misc
  today: any;
  startDate: any;
  endDate: any;
  column: string = 'CategoryName';
  isDesc: boolean = false;
  callExportState!: Subscription;
  reportOpenSub!: Subscription;
  reportGetting!: Subscription;
  Pdf!: Subscription;
  print!: Subscription;
  email!: Subscription;
  excel!: Subscription;
 

  // view helpers
  public isCollapsed: boolean = false;
  public isCollapsable: boolean = false;
  maxHeight: number = 10;
  Favreports: any = [];

  // notes view / comments
  notesViewState: boolean = true;
  commentsVisibility: boolean = false;
  hideVisibility: boolean = false;

  // scroll
  @ViewChild('scrollcent') scrollcent!: ElementRef;
  Scrollpercent: any = 0;
  scrollCurrentposition: any = 0;
  storeIds: any = '0';
  // --- merged report-component members ---
  StoresIds: any = [];
  stores: any = [];
  Performance: any = 'Load';
  maxDate: any;
  // vehiclear already defined above (string); keep an array for the report controls too:
  vehiclearArray: any = ['WAR'];
  @Input() headerInput: any;
  @Input() popupInput: any;
  Bar: boolean = false;
  storeName: any = '';
  employeeschanges: any = '';
  @Input() QISearchNameInput: any;
  @Output() messageEvent = new EventEmitter<string>();
  selectedstorevalues: any = [];
  AllStores: boolean = true;
  selectedGroups: any = [];
  AllGroups: boolean = true;
  groupstate: boolean = false;
  groupName: any = '';
  month: any;
  selectedFiManagersvalues: any = [];
  selectedFiManagersname: any = [];
  financeManager: any = [];
  helpdata: any;
  activePopover: number = -1;
  bsConfig!: Partial<BsDatepickerConfig>;
  // stores: any = [];
  storename: any = '';
  groupsArray: any = [];
  storecount: any = null;
  storedisplayname: any = '';
  // groupName: any = '';
  groupId: any = 8;

  storesFilterData: any = {
    'groupsArray': this.groupsArray, 'groupId': this.groupId, 'storesArray': this.stores, 'storeids': '1', 'type': 'M', 'others': 'N',
    'groupName': this.groupName, 'storename': this.storename, storecount: null, 'storedisplayname': this.storedisplayname
  };
      @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = (event.target as HTMLElement).closest('.dropdown-toggle, .dropdown-menu , .timeframe, .reportstores-card');
    if (!clickedInside) {
      this.activePopover = -1;
    }
  }

  constructor(
    public shared: Sharedservice,
    public setdates: Setdates,
    private ngbmodal: NgbModal,
    private ngbmodalActive: NgbActiveModal,
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private cdRef: ChangeDetectorRef,
 
    public formatter: NgbDateParserFormatter,
    // public toast: ToastrService,
   
  ) {
    if (localStorage.getItem('userInfo') != null && localStorage.getItem('userInfo') != undefined) {
      this.StoreVal = JSON.parse(localStorage.getItem('userInfo')!).user_Info.ustores.split(',')
      this.StoreVal = JSON.parse(localStorage.getItem('userInfo')!).user_Info.ustores.split(',')

    }
    if (this.shared.common.groupsandstores.length > 0) {
      this.groupsArray = this.shared.common.groupsandstores.filter((val: any) => val.sg_id != this.shared.common.reconID);
      this.stores = this.shared.common.groupsandstores.filter((v: any) => v.sg_id == this.groupId)[0].Stores;
      this.StoreVal.length == this.stores.length ? this.groupName = this.stores[0].sg_Name : this.groupName = ''
      this.StoreVal.length == 1 ? this.storename = this.stores.filter((e: any) => e.ID == this.StoreVal)[0].storename : this.storename = ''
      this.getStoresandGroupsValues()
    }
    // set defaults and mirrored logic from appointment style
    localStorage.setItem('time', 'C');

    this.commentsVisibility = true;

    // init user/store info from local storage (same logic)
    if (localStorage.getItem('userInfo') != null) {
      // Keep same logic but don't break when redirectionFrom missing
      try {
        const ud: any = JSON.parse(localStorage.getItem('userInfo')!);
        this.Role = ud.user_Info.title;
        this.userid = ud.user_Info.userid;
        console.log(this.Role, this.userid);
      } catch {
        // ignore
      }

    }

    // date range for UI (same logic)
    this.today = new Date();
    this.startDate = new Date();
    this.endDate = new Date(this.startDate);
    this.endDate = new Date(this.endDate.setDate(this.endDate.getDate() + 4));
    for (let q = new Date(this.startDate); q <= this.endDate; q.setDate(q.getDate() + 1)) {
      this.days.push({ day: q.toString() });
    }

    // set page title
    try {
      this.shared.setTitle(this.shared.common.titleName + '-Booked Deals');
    } catch {
      // fallback: no-op
    }

    // initialize From/To based on original logic
    this.CurrentDate.setDate(this.CurrentDate.getDate() - 1);
    this.ToDate = new Date(
      this.CurrentDate.getFullYear(),
      this.CurrentDate.getMonth(),
      2
    );
    this.FromDate = this.ToDate.toISOString().slice(0, 10);
    this.ToDate = this.CurrentDate.toISOString().slice(0, 10);

    // set header data unless favorite
    if (localStorage.getItem('Fav') != 'Y') {
      const data = {
        title: 'Booked Deals',
        stores: this.StoreVal,
        groups: this.groups,
        financemanagers: this.financeManagerId,
        dealStatus: this.dealStatus,
        saleType: this.saleType,
        allordebit: this.allordebit,
        vehiclear: this.vehiclear,
      };
      try {
        this.shared.api.SetHeaderData({ obj: data });
      } catch { /* ignore */ }

      this.header = [
        {
          type: 'Bar',
          storeIds: this.StoreVal,
          vehiclear: this.vehiclear,
          dealStatus: this.dealStatus,
          saleType: this.saleType,
          allordebit: this.allordebit,
          financemanagers: this.financeManagerId,
          groups: this.groups,
        },
      ];

      if (this.StoreVal != '') {
        this.GetScheduleBookedDealData();
    this.getEmployees()

      }
    }

    // listen window clicks for certain modal close behavior (from report component)
    this.renderer.listen('window', 'click', (e: Event) => {
      const TagName = e.target as HTMLButtonElement;
      if (TagName && TagName.className === 'd-block modal fade show modal-static') {
        try { this.ngbmodal.dismissAll(); } catch { }
      }
    });
  }

  ngOnInit(): void {
    // datepicker config and other init tasks
    this.bsConfig = {
      dateInputFormat: 'MM.dd.yyyy',
      showWeekNumbers: false,
      adaptivePosition: true
    };
       this.GetScheduleBookedDealData();
         this.loadStoreMasterList();
  }

  // Messaging (report -> parent)
  sendMessage() {
    this.messageEvent.emit(this.QISearchName);
  }

  /* ------------------------------
     Core: Get floor plan 
     ------------------------------ */
GetScheduleBookedDealData() {

  this.NoData = false;
  this.FloorPlanData = [];
  this.FloorPlanTotalData = [];

  try { this.shared.spinner.show(); } catch {}

  const payload = {
  AS_ID: this.StoreVal.toString(),
    DealStatus: this.dealStatus.toString(),    
    DealType2: this.dealType.toString()           
  };

  this.shared.api
    .postmethod(this.shared.common.routeEndpoint + 'GetScheduleBookedDeal', payload)
    .subscribe(
      (res: any) => {

        try { this.shared.spinner.hide(); } catch {}

        if (res?.status === 200 && res.response?.length > 0) {

          this.FloorPlanData = res.response.filter((e: any) => e.store !== 'TOTAL');
          this.FloorPlanTotalData = res.response.filter((e: any) => e.store === 'TOTAL');

         this.FloorPlanData.forEach((x: any) => {

            if (x?.AgeData && typeof x.AgeData === 'string') {
              try { x.AgeData = JSON.parse(x.AgeData); } catch {}
            }

            if (x?.Comments && typeof x.Comments === 'string') {
              try { x.Comments = JSON.parse(x.Comments); } catch {}
            }

            if (x?.Notes && typeof x.Notes === 'string') {
              try {
                x.Notes = JSON.parse(x.Notes);
                x.duplicateNotes = x.Notes.length > 3 ? x.Notes.slice(0,3) : x.Notes;
                x.Notesstate = '+';
              } catch {}
            }

          });

          this.NoData = this.FloorPlanData.length === 0;

        } else {
          this.NoData = true;
        }
      },
      () => {
        try { this.shared.spinner.hide(); } catch {}
        this.NoData = true;
      }
    );
}


  // -------------------------------------
  // Merged report component methods (groups/stores/people)
  // -------------------------------------
  ngAfterViewInit(): void {
    this.shared.api.getStores().subscribe((res: any) => {
      if (this.shared.common.pageName == 'Booked Deals') {
       if (res.obj.storesData != undefined) {
          this.groupsArray = res.obj.storesData;
          this.stores = this.shared.common.groupsandstores.filter((v: any) => v.sg_id == this.groupId)[0].Stores;
          this.StoreVal.length == this.stores.length ? this.groupName = this.stores[0].sg_name : this.groupName = ''
          this.StoreVal.length == 1 ? this.storename = this.stores.filter((e: any) => e.ID == this.StoreVal)[0].storename : this.storename = ''
          this.getStoresandGroupsValues()
        }
      }
    })
    // subscribe to reports and export triggers
    this.reportGetting = this.shared.api.GetReports().subscribe((data: any) => {
      if (data && data.obj && data.obj.Reference == 'Booked Deals') {
        if (data.obj.header == undefined) {
          this.StoreVal = data.obj.storeValues;
          this.vehiclear = data.obj.vehiclear;
          this.dealStatus = data.obj.dealStatus;
          this.saleType = data.obj.saleType;
          this.financeManagerId = data.obj.FIvalues;
          this.allordebit = data.obj.allordebit;

          this.groups = data.obj.groups;
          this.enablevehicle = this.vehiclear === 'WAR';
        } else {
          if (data.obj.header == 'Yes') {
            this.StoreVal = data.obj.storeValues;
          }
        }

        if (this.StoreVal != '') {
          this.GetScheduleBookedDealData();
        } else {
          this.NoData = true;
          this.FloorPlanData = [];
        }

        const headerdata = {
          title: 'Booked Deals',
          stores: this.StoreVal,
          groups: this.groups,
          financemanagers: this.financeManagerId,
          dealStatus: this.dealStatus,
          saleType: this.saleType,
          allordebit: this.allordebit,
          vehiclear: this.vehiclear,
        };
        this.shared.api.SetHeaderData({ obj: headerdata });
        this.header = [{
          type: 'Bar',
          storeIds: this.StoreVal,
          vehiclear: this.vehiclear,
          dealStatus: this.dealStatus,
          saleType: this.saleType,
          allordebit: this.allordebit,
          groups: this.groups,
          financemanagers: this.financeManagerId,
        }];
      }
    });

    this.excel = this.shared.api.getExportToExcelAllReports().subscribe((res: any) => {
      if (res && res.obj && res.obj.title == 'Booked Deals' && res.obj.state == true) {
        this.exportToExcel(); // merged export will create both sheets
      }
    });

    this.print = this.shared.api.getExportToPrintAllReports().subscribe((res: any) => {
      if (res && res.obj && res.obj.title == 'Booked Deals' && res.obj.statePrint == true) {
        this.printPDF();
      }
    });

    this.Pdf = this.shared.api.getExportToPDFAllReports().subscribe((res: any) => {
      if (res && res.obj && res.obj.title == 'Booked Deals' && res.obj.statePDF == true) {
        this.generatePDF();
      }
    });

    this.email = this.shared.api.getExportToEmailPDFAllReports().subscribe((res: any) => {
      if (res && res.obj && res.obj.title == 'Booked Deals' && res.obj.stateEmailPdf == true) {
        this.exportToEmailPDF(res.obj.Email, res.obj.notes, res.obj.from);
      }
    });
  }
  getStoresandGroupsValues() {
    this.storesFilterData.groupsArray = this.groupsArray;
    this.storesFilterData.groupId = this.groupId;
    this.storesFilterData.storesArray = this.stores;
    this.storesFilterData.storeids = this.StoreVal;
    this.storesFilterData.groupName = this.groupName;
    this.storesFilterData.storename = this.storename;
    this.storesFilterData.storecount = this.storecount;
    this.storesFilterData.storedisplayname = this.storedisplayname;

    this.storesFilterData = {
      groupsArray: this.groupsArray,
      groupId: this.groupId,
      storesArray: this.stores,
      storeids: this.StoreVal,
      groupName: this.groupName,
      storename: this.storename,
      storecount: this.storecount,
      storedisplayname: this.storedisplayname,
      'type': 'M', 'others': 'N'
    };

    // this.setHeaderData();
    // this.GetData();

  }
  allStoresList: any[] = [];
StoresData(data: any) {

  this.StoreVal = data.storeids;  

  this.groupId = data.groupId;
  this.storename = data.storename;
  this.groupName = data.groupName;
  this.storecount = data.storecount;
  this.storedisplayname = data.storedisplayname;

  // ⭐ THIS IS IMPORTANT
  this.allStoresList = data.storesArray;

}

  ngOnDestroy() {
    if (this.reportGetting) this.reportGetting.unsubscribe();
    if (this.Pdf) this.Pdf.unsubscribe();
    if (this.print) this.print.unsubscribe();
    if (this.email) this.email.unsubscribe();
    if (this.excel) this.excel.unsubscribe();
  }


multipleorsingle(ref: any, e: any) {

  if (ref == 'DS') {
    const index = this.dealStatus.findIndex((i: any) => i == e);
    if (index >= 0) {
      this.dealStatus.splice(index, 1);
    } else {
      this.dealStatus.push(e);
    }
  }

  if (ref == 'ST') {
    const index = this.saleType.findIndex((i: any) => i == e);
    if (index >= 0) {
      this.saleType.splice(index, 1);
    } else {
      this.saleType.push(e);
    }
  }

  // ✅ Deal Type (your new one)
  if (ref == 'DT') {
    const index = this.dealType.findIndex((i: any) => i == e);
    if (index >= 0) {
      this.dealType.splice(index, 1);
    } else {
      this.dealType.push(e);
    }
  }
}

  getEmployees(val?: any, ids?: any, count?: any, bar?: any) {
    const obj = {
      AS_ID: this.StoreVal,
      type: 'F',
    };
    this.shared.api.postmethod(this.shared.common.routeEndpoint + 'GetEmployeesDev', obj).subscribe(
      (res: any) => {
        if (res && res.status == 200) {
          // if (val == 'F') {
            this.financeManager = res.response.filter((e: any) => e.FiName != 'Unknown');
            this.selectedFiManagersvalues = this.financeManager.map(function (a: any) { return a.FiId; });

        } else {
          alert('Invalid Details');
        }
      },
      (error: any) => { /* ignore console errors */ }
    );
  }

employees(block: any, id?: any, name?: any) {

  // 👉 Single select / multi select
  if (block === 'FM') {

    const index = this.selectedFiManagersvalues.indexOf(id);

    if (index >= 0) {
      // remove
      this.selectedFiManagersvalues.splice(index, 1);
    } else {
      // add
      this.selectedFiManagersvalues.push(id);
    }

    // ✅ Show name only when ONE selected
    if (this.selectedFiManagersvalues.length === 1) {
      this.selectedFiManagersname = name;
    } else {
      this.selectedFiManagersname = '';
    }
  }


  // 👉 Select All
  if (block === 'SelectAllFM') {

    this.selectedFiManagersvalues = this.financeManager.map((f:any) => f.FiId);
    this.selectedFiManagersname = '';   // because multiple selected

  }


  // 👉 Clear All
  if (block === 'ClearAllFM') {

    this.selectedFiManagersvalues = [];
    this.selectedFiManagersname = '';

  }

}


    togglePopover(popoverIndex: number) {
      
    
    if (this.activePopover === popoverIndex) {
      // If the same popover is clicked, close it
      this.activePopover = -1;
    } else {
      // Open the selected popover and close others
      this.activePopover = popoverIndex;
    }
  }
  viewreport() {
    this.activePopover = -1;
    
       this.dealStatus = this.dealStatus;
    this.saleType = this.saleType;
          this.financeManagerId = this.selectedFiManagersvalues.length == this.financeManager.length
            ? '0'
            : this.selectedFiManagersvalues.toString()
   this.GetScheduleBookedDealData();
  }

    openComments() {
    this.commentsVisibility = !this.commentsVisibility;
  }
  
inTheGreen(value: any){
  return value != null && value >= 0;
}

sort(property: any, state?: any) {

  if (state == undefined) {
    this.isDesc = !this.isDesc;
  }

  this.callLoadingState = 'FL';
  this.column = property;

  let direction = this.isDesc ? 1 : -1;

  this.FloorPlanData.sort((a: any, b: any) => {

    if (a[property] < b[property]) {
      return -1 * direction;

    } else if (a[property] > b[property]) {
      return 1 * direction;

    } else {
      return 0;
    }

  });
}

  addNotes(item: any) {
    this.selecteddata = item;
    this.getDropDown(this.selecteddata.companyid);
    this.notesStageText = '';
    this.notesStageValue = '';
  }

    getDropDown(companyid: any) {
    const obj = {
      AssociatedReport: 'CIT',
      CompanyID: companyid
    };
    this.shared.api.postmethod(this.shared.common.routeEndpoint + 'GetScheduleNoteStages', obj).subscribe((res: any) => {
      if (res && res.status == 200) {
        this.notesstage = res.response;
        this.notesStageValue = '';
      }
    });
  }
viewmoreAction(fp: any) {
  if (!fp.Notes) return;

  if (fp.Notesstate === '+') {
    fp.Notesstate = '-';
    fp.duplicateNotes = [...fp.Notes]; // full list (spread = new reference)
  } else {
    fp.Notesstate = '+';
    fp.duplicateNotes = fp.Notes.slice(0, 3); // first 3
  }

  this.cdRef.detectChanges(); // ensure immediate UI update
}

  clean(value: any) {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'string' && value.startsWith('[')) {
      try {
        return JSON.parse(value).join(', ');
      } catch {
        return value.replace(/[\[\]"]+/g, '');
      }
    }
    return value || '-';
  }
storeMasterList: any[] = [];
loadStoreMasterList() {

  this.storeMasterList = [];

  if (!this.shared.common.groupsandstores?.length) return;

  this.shared.common.groupsandstores.forEach((grp:any) => {

    if (Array.isArray(grp.Stores)) {

      grp.Stores.forEach((s:any) => {
        this.storeMasterList.push({
          ID: Number(s.ID),
          storename: s.storename
        });
      });

    }

  });

  console.log('STORE MASTER:', this.storeMasterList); // debug once
}

getStoreNamesFromIds(ids: any[]): string {

  if (!ids || ids.length === 0 || !this.allStoresList?.length) {
    return '-';
  }

  const names = this.allStoresList
    .filter(s => ids.includes(s.ID))
    .map(s => s.storename);

  return names.join(', ');
}



exportToExcel(): void {

  const workbook: any = this.shared.getWorkbook();
  if (!workbook) {
    alert('Workbook helper not available');
    return;
  }

  const sheet = workbook.addWorksheet('Booked Deals Report');


  /* ===========================
     FILTER SUMMARY
  ============================ */

  const titleRow = sheet.addRow(['Booked Deals Report']);
  titleRow.font = { bold: true };

  const filters = [
{ name: 'Stores :', values: this.getStoreNamesFromIds(this.StoreVal) },

    { name: 'Deal Status :', values: this.dealStatus.toString() },
    { name: 'Deal Type :', values: this.dealType.toString() }
  ];

  filters.forEach(f => {
    const r = sheet.addRow([f.name, f.values]);
    r.getCell(1).font = { bold: true };
  });

  sheet.addRow([]);
  const agingHeader = sheet.addRow(['', 'Total', '0-5', '6-10', '11-15', '15+']);
  agingHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  agingHeader.eachCell((cell: any) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2A91F0' }
    };
    cell.alignment = { horizontal: 'center' };
  });
  if (this.FloorPlanData?.length > 0 && this.FloorPlanData[0]?.AgeData?.length > 0) {

    const A = this.FloorPlanData[0].AgeData[0];

    const agingRow = sheet.addRow([
      'Booked Aging',
      A.TOTAL ?? '-',
      A.D1 ?? '-',
      A.D2 ?? '-',
      A.D3 ?? '-',
      A.D4 ?? '-'
    ]);

    // Align aging numbers right
    [2,3,4,5,6].forEach(i => {
      agingRow.getCell(i).alignment = { horizontal: 'right' };
    });
  }

  sheet.addRow([]);

  const headers = [
    'Age',
    'Date',
    'Deal #',
    'Balance',
    'Customer Name',
    'Customer Number',
    'Store',
    'Stock #',
    'Deal Type',
    'Stage',
    'F&I Manager',
    'Sales Manager',
    'Sales Person',
    'Type',
    'New/Used',
    'Status',
    'Bank Name',
    'Trade'
  ];

  const headerRow = sheet.addRow(headers);

  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  headerRow.eachCell((cell: any) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2A91F0' }
    };
    cell.alignment = { horizontal: 'center' };
  });
  this.FloorPlanData.forEach((r: any) => {
    const excelRow = sheet.addRow([
      r.CTAge ?? '-',
      r.CTDate ? new Date(r.CTDate).toLocaleDateString() : '-',
      r.Dealno ?? '-',
      r.Balance ?? '-',
      r.CustName ?? '-',
      r.CustId ?? '-',
      r.store ?? '-',
      r.Stockno ?? '-',
      r.DealType2 ?? '-',
      r.Stage ?? '-',
      r.FIMgr_Name ?? '-',
      r.SalesMgr_Name ?? '-',
      r.SP1_Name ?? '-',
      r.SaleType ?? '-',
      r.DealType ?? '-',
      r.DealStatus ?? '-',
      r.Lender ?? '-',
      r.trade1vin ?? '-'
    ]);
    // 👉 Right align numeric style columns (even "-")
    [4,6].forEach(i => {
      excelRow.getCell(i).alignment = { horizontal: 'right' };
    });

  });

  sheet.columns.forEach((c: any) => {
    c.width = 22;
  });
  workbook.xlsx.writeBuffer().then(() => {

    if (this.shared.exportToExcel) {
      this.shared.exportToExcel(workbook, 'Booked_Deals_Report');
    } else {
      alert('Excel export helper missing');
    }
  });
}

  // placeholders for print/pdf/email - keep method names so triggers still work
  printPDF() {
    // copy or implement your print logic
  }
  generatePDF() {
    // copy or implement your pdf generation logic
  }
  exportToEmailPDF(email: any, notes: any, from: any) {
    // copy or implement your export-to-email logic
  }
}
