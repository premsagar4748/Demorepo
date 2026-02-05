import { Component, HostListener } from '@angular/core';
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
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { common } from '../../../../common';
import { Stores } from '../../../../CommonFilters/stores/stores';

@Component({
  selector: 'app-dashboard',
  imports: [SharedModule, BsDatepickerModule, FilterPipe, TimeConversionPipe,Stores,NgbModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
   standalone: true,
})
export class Dashboard {



  /* ------------------------------- VARIABLES ------------------------------- */

  NoData: boolean = false;
  FloorPlanData: any = [];
  FloorPlanTotalData: any = [];
  PayablesData: any = [
    { Liabilities: 'TT&L A/P', path: 'TT&L A/P', title: 'TT&L', url: 'TTL' },
    { Liabilities: 'Payoffs A/P', path: 'LienPayoffs A/P', title: 'Lien Payoffs', url: 'LienPayoffs' },
    { Liabilities: 'We Owe A/P', path: 'WeOwe A/P', title: 'We Owe', url: 'WeOwe' },
    { Liabilities: 'New Flooring', path: 'NewFlooring A/P', title: 'New Flooring', url: 'NewFlooring' },
    { Liabilities: 'Used Flooring', path: 'UsedFlooring A/P', title: 'Used Flooring', url: 'UsedFlooring' },
    { Liabilities: 'Rental/Loaner Flooring A/P', path: 'Rental/LoanerFlooring A/P', title: 'Rental/Loaner Flooring', url: 'RentalFlooring' }
  ];

  selectedreceviabe: any = [];
  StoreVal: any = [];
  spinnerLoader: boolean = true;
  Role: any = [];
  userid: any;

  index: string = '';
  groups: any = 1;
  financeManagerId: any = '0';
  AgeFrom: any = 0;
  AgeTo: any = 0;
  QISearchName: any = '';

  callLoadingState = 'FL';
  enablevehicle: boolean = false;
  commentsVisibility: boolean = true;

  hideVisibility: boolean = false;
  hideRecords: any = [];
  FinalArray: any = [];

  header: any = [
    {
      type: 'Bar',
      
      storeIds: this.StoreVal,
      groups: this.groups,
      financemanagers: this.financeManagerId,
      ageFrom: this.AgeFrom,
      ageTo: this.AgeTo
    }
  ];

  excel!: Subscription;
  Pdf!: Subscription;
  print!: Subscription;
  email!: Subscription;
  reportgetting!: Subscription;

  popup: any = [{ type: 'Popup' }];
  // actionType: any = 'N';

  notesStageValue: any = '';
  notesStageText: any = '';
  notesstage: any = [];
  selecteddata: any = [];
    check: boolean = false;
      activePopover: number = -1;

       selectedFiManagersvalues: any = [];
  selectedFiManagersname: any = [];
  financeManager: any = [];
   storename: any = '';
  groupsArray: any = [];
  storecount: any = null;
  storedisplayname: any = '';
  groupName: any = '';
  groupId: any = 8;
   stores: any = [];

  storesFilterData: any = {
    'groupsArray': this.groupsArray, 'groupId': this.groupId, 'storesArray': this.stores, 'storeids': '1', 'type': 'M', 'others': 'N',
    'groupName': this.groupName, 'storename': this.storename, storecount: null, 'storedisplayname': this.storedisplayname
  };
  // solutionurl: any = environment.apiUrl;
   @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = (event.target as HTMLElement).closest('.dropdown-toggle, .dropdown-menu , .timeframe, .reportstores-card');
    if (!clickedInside) {
      this.activePopover = -1;
    }
  }

  /* ------------------------------- CONSTRUCTOR ------------------------------- */

  constructor(
    private ngbmodal: NgbModal,
    private comm: common,
   public shared: Sharedservice,
    private router: Router,
    private ngbmodalActive: NgbActiveModal,
    private spinner: NgxSpinnerService,
 
   
    private datepipe: DatePipe
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
    this.commentsVisibility = true;

    /* --------- USER DETAILS --------- */
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

    /* --------- STORE SETUP --------- */
    // let storeids = userData.Store_Ids;

    // if (storeids.toString().indexOf(',') > 0) {
    //   this.StoreVal = "";
    //   this.actionType = 'N';
    // } else {
    //   this.StoreVal = storeids;
    //   this.actionType = 'Y';
    // }

    /* --------- DEFAULT SELECTED TAB --------- */
    this.selectedreceviabe = this.PayablesData[0];
    // this.selectedreceviabe ='NewFlooring A/P'

    /* --------- ROUTE CHECK FOR SELECTED TAB --------- */
   const path = this.router.url.split('?')[0].replace('/', '');

const selectedpath = this.PayablesData.find(
  (e: any) => e.url === path
);

this.selectedreceviabe = selectedpath
  ? selectedpath
  : this.PayablesData[0];

    // if (path === 'Liabilities') {
    //   this.selectedreceviabe = this.PayablesData[0];
    // } else {
    //   let selectedpath = this.PayablesData.find((e: any) => e.url === path);
    //   this.selectedreceviabe = selectedpath ? selectedpath : this.PayablesData[0];
    // }

    this.shared.setTitle(this.comm.titleName + '-Liabilities');

    /* --------- HEADER FOR REPORTING --------- */
    const data = {
      title: 'Liabilities',
      stores: this.StoreVal,
      groups: this.groups,
      financemanagers: '',
      count: 0,
      AgeFrom: this.AgeFrom,
      AgeTo: this.AgeTo,
      search: this.QISearchName
    };

    this. shared.api.SetHeaderData({ obj: data });

    this.header = [
      {
        type: 'Bar',
        storeIds: this.StoreVal,
        groups: this.groups,
        financemanagers: this.financeManagerId,
        ageFrom: this.AgeFrom,
        ageTo: this.AgeTo
      }
    ];

    /* --------- AUTO LOAD FIRST TAB --------- */
    if (this.StoreVal != '') {
      this.Getfloorplansdata(this.selectedreceviabe);
        this.getEmployees()
    }
  }




  /* ------------------------------- LIFECYCLE ------------------------------- */

  ngOnInit(): void { }

  ngAfterViewInit(): void {
     this.shared.api.getStores().subscribe((res: any) => {
      if (this.shared.common.pageName == 'Liabilities') {
       if (res.obj.storesData != undefined) {
          this.groupsArray = res.obj.storesData;
          this.stores = this.shared.common.groupsandstores.filter((v: any) => v.sg_id == this.groupId)[0].Stores;
          this.StoreVal.length == this.stores.length ? this.groupName = this.stores[0].sg_name : this.groupName = ''
          this.StoreVal.length == 1 ? this.storename = this.stores.filter((e: any) => e.ID == this.StoreVal)[0].storename : this.storename = ''
          this.getStoresandGroupsValues()
        }
      }
    })
    this. shared.api.GetReportOpening().subscribe((res) => {
      if (res.obj.Module === 'Liabilities') {
        document.getElementById('report')?.click();
      }
    });

    /* -------- REFRESH DATA FROM HEADER -------- */
    this.reportgetting = this. shared.api.GetReports().subscribe((data) => {
      if (data.obj.Reference === 'Liabilities') {

        this.FloorPlanData = [];
        // this.actionType = 'Y';
        this.NoData = false;

        /* Update filters */
        if (!data.obj.header) {
          this.StoreVal = data.obj.storeValues;
          this.financeManagerId = data.obj.FIvalues;
          this.groups = data.obj.groups;
          this.AgeFrom = data.obj.AgeFrom;
          this.AgeTo = data.obj.AgeTo;
        }

        if (this.StoreVal != '') {
          this.Getfloorplansdata(this.selectedreceviabe);
        } else {
          this.NoData = true;
        }

        /* Update header for next reload */
        const headerdata = {
          title: 'Liabilities',
          stores: this.StoreVal,
          groups: this.groups,
          financemanagers: this.financeManagerId,
          AgeFrom: this.AgeFrom,
          AgeTo: this.AgeTo
        };

        this. shared.api.SetHeaderData({ obj: headerdata });

        this.header = [
          {
            type: 'Bar',
            storeIds: this.StoreVal,
            groups: this.groups,
            financemanagers: this.financeManagerId,
            ageFrom: this.AgeFrom,
            ageTo: this.AgeTo
          },
        ];
      }
    });

      this.excel = this.shared.api.getExportToExcelAllReports().subscribe((res: any) => {
      if (res && res.obj && res.obj.title == 'Liabilities' && res.obj.state == true) {
        this.exportToExcel(); // merged export will create both sheets
      }
    });
  }
//   formatBalance(val: number | null, decimals = 2): string {
//   if (val === null || val === undefined) return '-';
//   return val < 0
//     ? `-$${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: decimals })}`
//     : `$${val.toLocaleString(undefined, { minimumFractionDigits: decimals })}`;
// }

  formatBalance(val: number | null): string {
  if (val === null || val === undefined) return '-';
  return val < 0
    ? `-$${Math.abs(val).toFixed(2)}`
    : `$${val.toFixed(2)}`;
}

//  formatBalancetozero(val: number | null): string {
//   if (val === null || val === undefined) return '-';
//    if (val === 0) return '0';
//   return val < 0
//     ? `-$${Math.abs(val).toFixed(0)}`
//     : `$${val.toFixed(0)}`;
// }

formatBalancetozero(val: number | null): string {
  if (val === null || val === undefined) return '-';

  // same as number:'1.0-0' → no decimals, rounded
  const rounded = Math.round(val);

  if (rounded === 0) return '0';

  return rounded < 0
    ? `-$${Math.abs(rounded).toLocaleString('en-US')}`
    : `$${rounded.toLocaleString('en-US')}`;
}
exportToExcel(): void {
  const workbook: any = this.shared.getWorkbook?.();
  if (!workbook) {
    alert('Workbook helper not available');
    return;
  }

  /* ================= SUMMARY SHEET ================= */
  const summarySheet = workbook.addWorksheet('Dashboard Summary');
  // summarySheet.addRow(['Liabilities']);

  const filters = [
  //  { label: 'People', value: this.financeManagerId === '0' ? 'All' : this.financeManagerId.split(',') .join(', ') || '-' },
    // { label: 'Age Range', value: `${this.AgeFrom || 0} - ${this.AgeTo || 0}` },
    { label: 'Liabilities', value: this.selectedreceviabe?.Liabilities || '-' }
  ];

  let startIndex = 2;
  filters.forEach(f => {
    startIndex++;
    summarySheet.addRow([]);
    summarySheet.mergeCells(`B${startIndex}:C${startIndex}`);
    summarySheet.getCell(`A${startIndex}`).value = f.label;
    summarySheet.getCell(`B${startIndex}`).value = f.value;
  });

  summarySheet.addRow([]);

  // Aging header
  const agingHeader = summarySheet.addRow(['', 'Total', '0-5', '6-10', '11-15', '15+']);
  agingHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  agingHeader.eachCell((cell: any) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2A91F0' } };
    cell.alignment = { horizontal: 'center' };
  });

 if (this.FloorPlanData?.length) {

  const A = this.FloorPlanData[0].AgeData?.[0];

  const agingValueRow = summarySheet.addRow([
    `${this.selectedreceviabe?.title || 'Liabilities'} Aging`,
    A?.TOTAL ?? null,
    A?.D1 ?? null,
    A?.D2 ?? null,
    A?.D3 ?? null,
    A?.D4 ?? null
  ]);

  // ✅ Apply $ format to VALUE row (not header)
  [2, 3, 4, 5, 6].forEach(col => {
    const cell = agingValueRow.getCell(col);

    if (typeof cell.value === 'number') {
      cell.numFmt = '$#,##0.00;[Red]-$#,##0';
     
      cell.alignment = { horizontal: 'right' };
    }
  });

  agingValueRow.font = { bold: true };
}
  summarySheet.addRow([]);

  /* ================= DETAIL HEADERS ================= */
  const headers = [
    'Age', 'Date', 'Account', 'Control', 'Control 2',
    'Balance', 'Customer', 'Number', 'Sale Date','Sale Age',
    'Stock #', 'Deal #', 'Stage',
    'F&I Mgr','New/Used', 'Type', 
    'Status', 'Bank Name',
    'Year', 'Make', 'Model'
  ];

  const headerRow = summarySheet.addRow(headers);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  headerRow.eachCell((cell: any) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2A91F0' } };
    cell.alignment = { horizontal: 'center' };
  });

  /* ================= DATA ROWS ================= */
  const formatDate = (d: any) => {
    if (!d) return '-';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '-';
    return `${String(dt.getMonth() + 1).padStart(2, '0')}.` +
           `${String(dt.getDate()).padStart(2, '0')}.` +
           `${dt.getFullYear()}`;
  };

  


  (this.FloorPlanData || []).forEach((fp: any) => {
    const row = summarySheet.addRow([
      
      fp.AGE || '-',
      formatDate(fp.FundedDate),
      fp.AccountDesc2 || '-',
      fp.Control || '-',
      fp.control2 || '-',
      fp.Balance ?? null,
      fp.CustomerName || '-',
      fp.CustomerNumber || '-',
      formatDate(fp.SaleDate) || '-',
      fp.SaleAge || '-',
      fp.StockNo || '-',
      fp.DealNo || '-',
      fp.Stage || '-',
      fp.FIManager || '-',
      fp.DealType || '-',
      fp.SaleType || '-',
      fp.DealStatus || '-',
      fp.BankName || '-',
      fp.VehicleYear || '-',
      fp.VehicleMake || '-',
      fp.VehicleModel || '-'
    ]);

const balanceCell = row.getCell(6); // ✅ correct row

if (typeof balanceCell.value === 'number') {
  balanceCell.numFmt = '$#,##0.00;[Red]-$#,##0.00';
  balanceCell.alignment = { horizontal: 'right' };
}
  
    // Notes section
    // if (fp.duplicateNotes?.length) {
    //   summarySheet.addRow([]);
    //   const notesHeader = summarySheet.addRow(['Notes']);
    //   notesHeader.font = { bold: true };

    //   fp.duplicateNotes.forEach((n: any) => {
    //     summarySheet.addRow([n.NOTES || '-']);
    //   });
    // }
  });

  summarySheet.columns.forEach((c: any) => (c.width = 20));

  // ================= TOTALS ROW (EXCEL FOOTER) =================
if (this.FloorPlanTotalData?.length > 0) {

  const totalBalance = this.FloorPlanTotalData[0].Balance ?? 0;

  // Empty row before totals
  summarySheet.addRow([]);

  const totalsRow = summarySheet.addRow([
    'Totals', '', '', '', '',       // up to Control 2
    totalBalance,                  // Balance column
    '', '', '', '', '', '', '', '', '',
    '', '', '', '', '',             // remaining columns
  ]);

  totalsRow.font = { bold: true };

  // Merge "Totals" label like UI (colspan="7")
  summarySheet.mergeCells(
    `A${totalsRow.number}:E${totalsRow.number}`
  );

  totalsRow.getCell(1).alignment = { horizontal: 'right' };

  // Currency formatting for Balance
  const balanceCell = totalsRow.getCell(6); // Balance column index
  balanceCell.numFmt = '$#,##0.00;[Red]-$#,##0.00';
  balanceCell.alignment = { horizontal: 'right' };
}

  /* ================= EXPORT ================= */
  workbook.xlsx.writeBuffer().then(() => {
    this.shared.exportToExcel(workbook, this.selectedreceviabe?.title+'_Report');
  });
}




    keyPressNumbers(event: any) {
    var charCode = event.which ? event.which : event.keyCode;
    // Only Numbers 0-9
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    } else {
      return true;
    }
  }

  /* ------------------------------- SEARCH HANDLER ------------------------------- */

  receiveMessage($event: any) {
    this.QISearchName = $event;
  }


  /* ------------------------------- SORT ------------------------------- */

  isDesc: boolean = false;
  column: string = 'CategoryName';

  sort(property: any, state?: any) {
    if (state === undefined) {
      this.isDesc = !this.isDesc;
    }

    this.callLoadingState = 'FL';
    this.column = property;

    let direction = this.isDesc ? 1 : -1;

    this.FloorPlanData.sort((a: any, b: any) => {
      if (a[property] < b[property]) return -1 * direction;
      if (a[property] > b[property]) return 1 * direction;
      return 0;
    });
  }

previousReportPath: string | null = null;
  /* ------------------------------- MAIN API CALL ------------------------------- */

  Getfloorplansdata(path: any) {
  
    if (this.previousReportPath !== path.path) {
    this.AgeFrom = 0;
    this.AgeTo = 0;
    this.previousReportPath = path.path;
  }

    /* ✅ Age validation */
  if (
    this.AgeFrom !== null &&
    this.AgeTo !== null &&
    Number(this.AgeFrom) > Number(this.AgeTo)
  ) {
    alert('Please Enter Valid Age Range');
    return; // ⛔ stop execution
  }

    this.selectedreceviabe = path;
    this.NoData = false;
    this.FloorPlanData = [];
    this.FloorPlanTotalData = [];
    this.spinner.show();

    const obj = {
      AS_ID: this.StoreVal,
      FIManagerID: this.financeManagerId,
      UserID: 0,
      ScheduleType: path.path,
      Age_From: this.AgeFrom,
      Age_To: this.AgeTo
    };

    let startFrom = new Date().getTime();

    this. shared.api.postmethod(this.comm.routeEndpoint + 'GetScheduleReport', obj)
      .subscribe(
        (res) => {
          if (res.status == 200 && res.response) {

            this.spinner.hide();

            if (res.response.length > 0) {

              this.FloorPlanData = res.response.filter((e: any) => e.store !== 'TOTAL');
              this.FloorPlanTotalData = res.response.filter((e: any) => e.store === 'TOTAL');

              /* Parse JSON inside response */
              this.FloorPlanData.forEach((x: any) => {
                x.AgeData = JSON.parse(x.AgeData);

                if (x.Comments) x.Comments = JSON.parse(x.Comments);
                if (x.Notes) {
                  x.Notes = JSON.parse(x.Notes);
                  x.duplicateNotes = [...x.Notes];
                  x.Notesstate = "+";

                  if (x.Notes.length > 3) {
                    x.duplicateNotes = x.duplicateNotes.slice(0, 3);
                  }
                }
              });

              if (this.callLoadingState == 'ANS') {
                this.sort(this.column, this.callLoadingState);
              }

              this.NoData = this.FloorPlanData.length == 0;

            } else {
              this.NoData = true;
            }
          } else {
            this.NoData = true;
            this.spinner.hide();
          }
        },
        () => {
          alert('502 Bad Gateway Error');
          this.spinner.hide();
          this.NoData = true;
        }
      );
  }


  /* ------------------------------- NOTES LOGIC ------------------------------- */

  viewmoreAction(fp: any) {
    if (fp.Notesstate === '+') {
      fp.Notesstate = '-';
      fp.duplicateNotes = fp.Notes;
    } else {
      fp.Notesstate = '+';
      fp.duplicateNotes = fp.Notes.slice(0, 3);
    }
  }

  getDropDown(companyid: any) {
    const obj = {
      AssociatedReport: this.selectedreceviabe.path,
      CompanyID: companyid
    };

    this. shared.api.postmethod(this.comm.routeEndpoint + 'GetScheduleNoteStages', obj)
      .subscribe(res => {
        if (res.status == 200) {
          this.notesstage = res.response;
          this.notesStageValue = '';
        }
      });
  }

  addNotes(item: any) {
    this.selecteddata = item;
    this.getDropDown(item.companyid);
    this.notesStageText = '';
    this.notesStageValue = '';
  }

formatDate(date?: number | string | Date): string {
  if (!date) return '-';

  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) return '-';

  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  }).format(parsedDate);
}
  save() {
    if (this.notesStageText.trim() === '') {
      alert('Please enter notes');
      return;
    }

    const obj = {
      AS_ID: this.selecteddata.storeid,
      Account: this.selecteddata.Account,
      Control: this.selecteddata.Control,
      Notes: this.notesStageText,
      StageId: this.notesStageValue,
      UserID: this.userid
    };

    this. shared.api.postmethod(this.comm.routeEndpoint + 'AddScheduleNotesAction', obj)
      .subscribe((res: any) => {

        if (res.status == 200) {

          alert('Notes Added Successfully');
          this.callLoadingState = 'ANS';
           (document.getElementById('close') as HTMLInputElement)?.click();
           this.oncloseone();
    this.commentsVisibility = true;

          /* Instant Frontend Update */
          const userName = JSON.parse(localStorage.getItem('UserDetails')!).UserName;
          const curDate = new Date();
          let nts = '';

          if (this.notesStageValue) {
            const filtered = this.notesstage.find((item: any) => item.NS_ID == this.notesStageValue);
            nts = `[${filtered.NS_Text}] ${this.notesStageText} - ${userName} - ${this.formatDate(curDate)}`;
            this.selecteddata.Stage = filtered.NS_Text;
          } else {
            nts = `${this.notesStageText} - ${userName} - ${this.formatDate(curDate)}`;
          }

          const newNote = {
            STAGE: "",
            NOTES: nts,
            NOTESDATE: this.formatDate(curDate),
            UserName: userName
          };

          if (!this.selecteddata.duplicateNotes) {
            this.selecteddata.duplicateNotes = [];
          }

          this.selecteddata.duplicateNotes.unshift(newNote);
          this.selecteddata.NotesStatus = 'Y';

        } else {
          alert('Something went wrong. Please try again.');
        }
      });
  }


  /* ------------------------------- HIDE RECORD LOGIC ------------------------------- */

  collectHidevalues(e: any, val: any, confirmtemplate: any, ref: any, refval: any) {

    if (ref === 'multi') {

      if (this.hideRecords.length === 0) {
        alert('Please select at least one record to hide');
        (document.getElementById("symbol") as HTMLInputElement).checked = false;
        return;
      }

      if (e.target.checked) {
        this.hideVisibility = true;
        this.ngbmodalActive = this.ngbmodal.open(confirmtemplate, {
          size: 'sm',
          backdrop: 'static'
        });
      }

    } else {

      if (e.target.checked) {
        this.hideVisibility = true;
        this.hideRecords.push(val);
      } else {
        const index = this.hideRecords.findIndex((list: any) => list.StockNo == refval);
        this.hideRecords.splice(index, 1);
      }
    }
  }

  oncloseone() {
    (document.getElementById("symbol") as HTMLInputElement).checked = false;
    this.ngbmodalActive.close();
  }

  hideAdd() {
    if (this.hideRecords.length === 0) {
      alert('Please select at least one record to hide');
      return;
    }

    this.FinalArray = this.hideRecords.map((item: any) => ({
      Receivable_Type: this.selectedreceviabe.path,
      Account: item.Account,
      CompanyID: item.companyid,
      AS_ID: item.storeid,
      Control: item.Control,
      Stock: item.StockNo,
      Control_Status: "Y",
      Deal: item.DealNo,
      UserID: this.userid
    }));

    const obj = { receivableexcludecontrol: this.FinalArray };

    this. shared.api.postmethod('ReceivableExcludeControls', obj)
      .subscribe((res) => {
        if (res.status == 200) {

          alert('This Control Hidden Successfully');
          (document.getElementById('closeone') as HTMLElement).click();
   this.oncloseone();
          this.Getfloorplansdata(this.selectedreceviabe);
          this.hideRecords = [];
          this.hideVisibility = false;

        } else {
          alert('Failed to hide control.');
        }
      });
  }


  /* ------------------------------- UTIL ------------------------------- */

  public inTheGreen(value: number): boolean {
    return value >= 0;
  }

  viewDeal(dealData: any) {
    // const modalRef = this.ngbmodal.open(DealRecapComponent, {
    //   size: 'md',
    //   windowClass: 'compModal'
    // });

    // modalRef.componentInstance.data = {
    //   dealno: dealData.DealNo,
    //   storeid: dealData.storeid,
    //   stock: dealData.StockNo,
    //   vin: dealData.vin,
    //   custno: dealData.CustomerNumber
    // };
  }

  
  openComments() {
    this.commentsVisibility = !this.commentsVisibility;
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
    
        this.groups=this.groups,
        this.financeManagerId= this.selectedFiManagersvalues.length == this.financeManager.length
            ? '0'
            : this.selectedFiManagersvalues.toString()
        this.AgeFrom= this.AgeFrom,
        this.AgeTo= this.AgeTo
      
   this.Getfloorplansdata(this.selectedreceviabe);
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

            // if (bar == 'Bar') {
            //   if (this.employeeschanges != '') {
            //     let fiids = (this.employeeschanges || '').toString().split(',');
            //     this.selectedFiManagersvalues = fiids;
            //   }
            //   if (this.employeeschanges == '0' || this.employeeschanges == 0) {
            //     this.selectedFiManagersvalues = this.financeManager.map(function (a: any) { return a.FiId; });
            //   }
            //   if (this.employeeschanges == '') {
            //     this.selectedFiManagersvalues = [];
            //   }
            // }
          // }
        } else {
          alert('Invalid Details');
        }
      },
      (error: any) => { /* ignore console errors */ }
    );
  }
employees(block: any, e: any, ename?: any) {
  // ========== SINGLE FM TOGGLE ========== //
  if (block === 'FM') {
    const index = this.selectedFiManagersvalues.findIndex((i: any) => i == e);

    if (index >= 0) {
      // already selected -> remove
      this.selectedFiManagersvalues.splice(index, 1);
    } else {
      // not selected -> add
      this.selectedFiManagersvalues.push(e);
    }

    // Optional: set last clicked name (if you use it in UI)
    const index1 = this.selectedFiManagersvalues.findIndex((i: any) => i == e);
    if (index1 >= 0) {
      this.selectedFiManagersname = ename;
    }

    return;
  }

  // ========== SELECT ALL / CLEAR ALL ========== //
  if (block === 'AllFM') {
    // e == 0 → Select All
    // e == 1 → Clear All

    if (e === 0) {
      // SELECT ALL
      this.selectedFiManagersvalues = this.financeManager.map(
        (fm: any) => fm.FiId
      );
    } else if (e === 1) {
      // CLEAR ALL
      this.selectedFiManagersvalues = [];
    }

    return;
  }
}

  StoresData(data: any) {
    this.StoreVal = data.storeids;
    this.groupId = data.groupId;
    this.storename = data.storename;
    this.groupName = data.groupName;
    this.storecount = data.storecount;
    this.storedisplayname = data.storedisplayname;
  }
 getStoresandGroupsValues() {
    this.storesFilterData.groupsArray = this.groupsArray;
    this.storesFilterData.groupId = this.groupId;
    this.storesFilterData.storesArray = this.StoreVal;
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

}
