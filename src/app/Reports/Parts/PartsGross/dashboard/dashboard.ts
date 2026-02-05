import { Component, signal, computed, effect, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PartsReports } from '../parts-reports/parts-reports';
import { FormsModule } from '@angular/forms';
import { log } from 'node:console';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { common } from '../../../../common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PartsDetails } from '../parts-details/parts-details';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
interface ApiRes {
  response?: any[];
}
import { Sharedservice } from '../../../../Core/Providers/Shared/sharedservice';
import { SharedModule } from '../../../../Core/Providers/Shared/shared.module';
import { Subscription } from 'rxjs';
import { Setdates } from '../../../../Core/Providers/SetDates/setdates';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SharedModule, CommonModule, PartsReports, FormsModule, NgxSpinnerModule,],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  @Input() toporbottom: 'T' | 'B' = 'T';
  @ViewChild('leftContainer', { static: false }) leftContainer!: ElementRef;
  @ViewChild('rightContainer', { static: false }) rightContainer!: ElementRef;


  hoveredRow: number | null = null;
  CurrentView = signal<'GLOBAL' | 'SERVICE' | 'SERVICE_BREAKDOWN' | 'PARTS' | 'PARTS_BREAKDOWN'>('GLOBAL');

  showGlobalView = computed(() => this.CurrentView() === 'GLOBAL');
  showServiceView = computed(() => this.CurrentView() === 'SERVICE');
  showServiceBreakdownView = computed(() => this.CurrentView() === 'SERVICE_BREAKDOWN');
  showPartsView = computed(() => this.CurrentView() === 'PARTS');
  showPartsBreakdownView = computed(() => this.CurrentView() === 'PARTS_BREAKDOWN');

  Loading = signal(false);
  LayerLoading = signal(false);
  noRecords = signal(false);

  MainData = signal<any[]>([]);
  ServiceData = signal<any[]>([]);
  PartsData = signal<any[]>([]);

  ServiceTotal = signal<any>(null);   // RowType T
  ServiceList = signal<any[]>([]);    // RowType D
  PartsTotals = signal<any>([]);
  servicetype: any[] = [];


  ExpandedRows = signal<{ [key: number]: boolean }>({});
  ServiceExpandedRows = signal<{ [key: number]: boolean }>({});
  PartsExpandedRows = signal<{ [key: number]: boolean }>({});

  StoreKeys = signal<string[]>([]);
  ServiceTotals = signal<any>(null);
  otherstoreid: any = '';
  selectedotherstoreids: any = ''
  storeIds: any = '';
  DateType: any = 'MTD'
  activeFilters = signal<any>({
    startdate: '',
    enddate: '',
    Store: this.storeIds,
    groups: 8,
    Saletype: '',
    Labortype: 'C,T,I',
    SourceBulk: '',
    SourceTire: '',
    SourceWithout: '',
    Advisorname: '',
    dealername: '',
    RowType: 'D',
    UserID: 0,
    PageNumber: 0,
    PageSize: 200,
    toporbottom: 'T',
    datetype: this.DateType,
    ids: [48, '', ''],
    var1: 'DealerName',
    var2: '',
    var3: ''
  });

  ServiceBreakdown = signal<any>({
    service: [],
    customerPay: [],
    warranty: [],
    internal: []
  });

  PartsBreakdown = signal<any>({});

  ShowDealerModal = signal(false);
  SelectedDealer = signal<any>(null);
  DealerPopupData = signal<any[]>([]);
  DealerPopupLoading = signal(false);
  foot: any;

  title = inject(Title)
  common = inject(common)
  isSidebarCollapsed = signal<boolean>(false);
  spinner = inject(NgxSpinnerService);
  excel!: Subscription;
  constructor(public shared: Sharedservice, private modalService: NgbModal, public setdates: Setdates) {

    this.title.setTitle(this.common.titleName + '-Parts Gross');

    if (typeof window !== 'undefined') {
      if (localStorage.getItem('userInfo') != null && localStorage.getItem('userInfo') != undefined) {
        this.storeIds = JSON.parse(localStorage.getItem('userInfo')!).user_Info.ustores.split(',')
        this.activeFilters().Store = this.storeIds
      }
    }
    if (localStorage.getItem('stime') != null) {
      let stime = localStorage.getItem('stime');
      if (stime != null && stime != '') {
        this.setDates(stime)
        this.DateType = stime
      }
    } else {
      this.setDates('MTD')
      this.DateType = 'MTD'
    }
    localStorage.setItem('stime', 'MTD')
    let obj = {
      title: 'Parts Gross',
    }
    this.shared.api.SetHeaderData({ obj })

    effect(() => {
      const isOpen = this.ShowDealerModal();
      if (isOpen) {
        setTimeout(() => this.initializeScrollSync(), 300);
      }
    });


    this.excel = this.shared.api.getExportToExcelAllReports().subscribe((res: { obj: { state: boolean; title: string; }; }) => {
      if (this.excel != undefined) {
        if (res.obj.title == "Parts Gross") {
          if (res.obj.state == true) {
            this.exportToExcel();
          }
        }
      }
    })
  }

  ngOnInit() {
    // this.sidebarService.isCollapsed$.subscribe((collapsed: any) => {
    //   //alert(collapsed);
    //   this.isSidebarCollapsed.set(collapsed);
    // });
    this.LoadGlobalPartsGrossData()
  }

  setDates(type: any) {
    let dates: any = this.setdates.setDates(type)
    this.activeFilters().startdate = dates[0];
    this.activeFilters().enddate = dates[1];
    localStorage.setItem('time', type);
  }

  initializeScrollSync() {
    //console.log("initializeScrollSync() CALLED");

    const left = this.leftContainer?.nativeElement;
    const right = this.rightContainer?.nativeElement;

    //console.log("LEFT =", left);
    //console.log("RIGHT =", right);

    if (!left || !right) {
      //console.log(" Containers NOT ready, retrying...");
      setTimeout(() => this.initializeScrollSync(), 200);
      return;
    }

    let syncing = false;

    left.addEventListener('scroll', () => {
      if (syncing) return;
      syncing = true;
      right.scrollTop = left.scrollTop;
      syncing = false;
    });

    right.addEventListener('scroll', () => {
      if (syncing) return;
      syncing = true;
      left.scrollTop = right.scrollTop;
      syncing = false;
    });

    //console.log(" Scroll sync successfully activated");
  }
  selectedTotalPosition = 'T';



  onFiltersApplied(filters: any) {
    //console.log(">>> onFiltersApplied() called with filters:", filters);


    //console.log(">>> CURRENT VIEW SIGNAL (raw):", this.CurrentView);
    //console.log(">>> CURRENT VIEW VALUE:", this.CurrentView());

    this.activeFilters.set({
      startdate: filters.startdate,
      enddate: filters.enddate,
      Store: filters.Store,
      dealername: filters.dealername || "",
      Advisorname: filters.Advisorname || "",
      Saletype: filters.saleType || "",
      Labortype: filters.serviceType?.join(",") || "",
      SourceBulk: filters.SourceBulk || "",
      SourceTire: filters.SourceTire || "",
      SourceWithout: filters.SourceWithout || "",
      var1: filters.var1 || "DealerName",
      var2: filters.var2 || "",
      var3: "",
      RowType: "D",
      UserID: 0,
      PageNumber: 0,
      PageSize: 200,
      datetype: filters.datetype,

    });

    this.selectedDataGrouping = filters.selectedGrouping || [];
    this.department = filters.department || [];
    this.saletype = filters.saleType || "";
    this.servicetype = filters.serviceType || [];
    this.partsSource = filters.partsSource || "";
    this.stores = filters.selectedStores || [];
    this.selectedTotalPosition = filters.toporbottom;

    const view = this.CurrentView();
    //console.log(">>> Resolved view variable:", view);

    this.Loading.set(true);

    if (view === 'GLOBAL') {
      //console.log(">>> Calling LoadGlobalPartsGrossData()");
      this.LoadGlobalPartsGrossData();
    } else if (view === 'SERVICE' || view === 'SERVICE_BREAKDOWN') {
      //console.log(">>> Calling LoadServiceGrossData() (service view)");
      this.LoadServiceGrossData();
    } else if (view === 'PARTS' || view === 'PARTS_BREAKDOWN') {
      //console.log(">>> Calling LoadPartsGrossData() (parts view)");
      this.LoadPartsGrossData();
    } else {
      //console.warn(">>> Unknown view, falling back to LoadGlobalPartsGrossData()");
      this.LoadGlobalPartsGrossData();
    }
  }




  SwitchView(view: 'GLOBAL' | 'SERVICE' | 'PARTS' | 'PARTS_BREAKDOWN') {
    this.CurrentView.set(view);
  }
  getSaleTypeText() {
    if (!this.saletype) return "-";

    const map: any = {
      R: "Retail",
      W: "Wholesale",
      C: "Customer Pay",
      T: "Warranty",
      I: "Internal"
    };

    return this.saletype
      .split(",")
      .map((code: any) => map[code] || code)
      .join(", ");
  }

  getPartsSourceText() {
    const src = this.partsSource;

    if (src === "All")
      return "All, Without Bulk & Tire, Bulk, Tire";
    if (src === "N")
      return "Without Bulk & Tire";
    if (src === "B")
      return "Bulk";
    if (src === "T")
      return "Tire";

    return "-";
  }


  MapGlobalData(list: any[]) {

    if (list.length > 0) {
      const skip = [
        'SNO', 'DISPLAYHEAD_FLAG', 'ISHEAD_TOTAL', 'DISPLAY_LABLE',
        'LABLECODE', 'PARENTLABLECODE',
        'Total_PartsSale', 'Total_PartsGross', 'Total_PartsGross_Pace',
        'Total_PartsGrossTarget', 'Total_PartsGross_Diff',
        'ServiceGross', 'ServiceGross_Pace', 'ServiceGross_Target',
        'ServiceGross_Diff',
        'PartsGross', 'PartsGross_Pace', 'PartsGross_Target',
        'PartsGross_Diff',
        'Parts_RO', 'Lost_PerDay', 'Retention'
      ];

      this.StoreKeys.set(
        Object.keys(list[0]).filter(k => !skip.includes(k))
      );
    }

    // decide defaultExpand based on grouping count / var2
    const hasSecondGrouping =
      (this.selectedDataGrouping && this.selectedDataGrouping.length >= 2)
      || (!!this.activeFilters().var2 && this.activeFilters().var2 !== '');

    const expanded: any = {};

    list.forEach((r, i) => {
      r.SNO = i + 1;

      // Parent row mapping (same as before)...
      r.Sales = r.Total_PartsSale;
      r.Gross = r.Total_PartsGross;
      r.Pace = r.Total_PartsGross_Pace;
      r.Target = r.Total_PartsGrossTarget;
      r.Diff = r.Total_PartsGross_Diff;

      r.MechanicalGross = r.ServiceGross;
      r.MechanicalPace = r.ServiceGross_Pace;
      r.MechanicalTarget = r.ServiceGross_Target;
      r.MechanicalDiff = r.ServiceGross_Diff;

      r.RetailGross = r.PartsGross;
      r.RetailPace = r.PartsGross_Pace;
      r.RetailTarget = r.PartsGross_Target;
      r.RetailDiff = r.PartsGross_Diff;

      r.TotalRO = r.Parts_RO;
      r.LostDay = r.Lost_PerDay;
      r.GPPercent = r.Retention;

      // ============== CHILD ROW PARSING ==============
      if (r.data2) {
        try {
          const parsed = JSON.parse(r.data2);

          r.Data2 = parsed.map((child: any) => ({
            ...child,
            AdvisorName: child.data2,
            StoreName: child.data1,
            parentVar1Value: r.data1,
            Sales: child.Total_PartsSale,
            Gross: child.Total_PartsGross,
            Pace: child.Total_PartsGross_Pace,
            Target: child.Total_PartsGrossTarget,
            Diff: child.Total_PartsGross_Diff,
            MechanicalGross: child.ServiceGross,
            MechanicalPace: child.ServiceGross_Pace,
            MechanicalTarget: child.ServiceGross_Target,
            MechanicalDiff: child.ServiceGross_Diff,
            RetailGross: child.PartsGross,
            RetailPace: child.PartsGross_Pace,
            RetailTarget: child.PartsGross_Target,
            RetailDiff: child.PartsGross_Diff,
            TotalRO: child.Parts_RO,
            LostDay: child.Lost_PerDay,
            GPPercent: child.Retention,
            isLayer2: true
          }));

        } catch (e) {
          //console.warn("Failed parsing data2:", e);
          r.Data2 = [];
        }
      } else {
        r.Data2 = [];
      }

      // ← DEFAULT expanded state:
      // If there is a second grouping selected, default to expanded (show children),
      // otherwise default to collapsed.
      expanded[r.SNO] = hasSecondGrouping ? true : false;
    });

    this.ExpandedRows.set(expanded);
  }


  getDateRange() {
    const f = this.activeFilters();
    if (!f.startdate || !f.enddate) return "";

    const s = new Date(f.startdate);
    const e = new Date(f.enddate);

    const sMonth = s.toLocaleString("en-US", { month: "long" });
    const eMonth = e.toLocaleString("en-US", { month: "long" });
    const year = e.getFullYear();

    const sDay = String(s.getDate()).padStart(2, "0");
    const eDay = String(e.getDate()).padStart(2, "0");

    // SAME MONTH → December 01–08, 2025
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return `${sMonth}: ${sDay}–${eDay}, ${year}`;
    }

    // DIFFERENT MONTHS → November–December 01–31, 2025
    return `${sMonth}–${eMonth}: ${sDay}–${eDay}, ${year}`;
  }


  AnyGlobalRowExpanded() {
    const map = this.ExpandedRows();
    if (!map) return false;
    return Object.values(map).some(v => v === true);
  }

  ServiceAnyRowExpanded() {
    const map = this.ServiceExpandedRows();
    if (!map) return false;
    return Object.values(map).some(v => v === true);
  }

  PartsAnyRowExpanded() {
    const map = this.PartsExpandedRows();
    if (!map) return false;
    return Object.values(map).some(v => v === true);
  }

  LoadServiceGrossData() {

    this.spinner.show();
    this.Loading.set(true);
    const f = this.activeFilters();

    const baseReq = {
      startdate: f.startdate,
      enddate: f.enddate,
      dealername: f.dealername,
      Advisorname: f.Advisorname,
      Store: this.otherstoreid && this.selectedotherstoreids ? this.storeIds + ',' + this.selectedotherstoreids.toString() : this.storeIds,
      Labortype: f.Labortype,
      Saletype: f.Saletype,
      SourceBulk: f.SourceBulk,
      SourceTire: f.SourceTire,
      SourceWithout: f.SourceWithout,

      var1: f.var1,
      var2: f.var2,
      var3: f.var3,
      UserID: 0,
      PageNumber: 0,
      PageSize: 100
    };
    console.log(baseReq, 'baseReq');

    // 1 ============ DETAIL ROW REQUEST (RowType = D) ============
    const detailReq = { ...baseReq, RowType: "D" };

    //console.log("SERVICE DETAIL PAYLOAD =", detailReq);

    this.shared.api.postmethod(this.shared.common.routeEndpoint + 'GetPartsGrossSummaryNewServiceDD', detailReq).subscribe({
      next: (res: ApiRes) => {
        //console.log("SERVICE DETAIL RESPONSE =", res);
        //console.log("🎯 AFTER MAPPING — ServiceData():", this.ServiceData());

        this.ServiceData.set(res?.response ?? []);
        this.MapServiceData(this.ServiceData());

        //  ============ TOTAL ROW REQUEST (RowType = T) ============
        const totalReq = { ...baseReq, RowType: "T" };

        //console.log("SERVICE TOTAL PAYLOAD =", totalReq);
        this.shared.api.postmethod(this.shared.common.routeEndpoint + 'GetPartsGrossSummaryNewServiceDD', totalReq).subscribe({
          next: (res2: ApiRes) => {
            //console.log("SERVICE TOTAL RESPONSE =", res2);

            this.ServiceTotals.set(res2?.response?.[0] ?? null);
            this.Loading.set(false);
            this.spinner.hide();
          }, error: () => {
            this.Loading.set(false);
            this.spinner.hide();
          }
        });
      }
    });

  }


  // MapServiceData(list: any[]) {

  //   //console.log("SERVICE RAW LIST:", list);

  //   // Detect if 2nd grouping is active (var2 or selectedGrouping)
  //   const hasSecondGrouping =
  //     (this.selectedDataGrouping && this.selectedDataGrouping.length >= 2)
  //     || (!!this.activeFilters().var2 && this.activeFilters().var2 !== '');

  //   const expanded: any = {};

  //   list.forEach((r, i) => {
  //     r.SNO = i + 1;
  //     r.CPSales = r.CPgross;
  //     r.CPGross = r.CPgross;
  //     r.CPGP_Percent = r.CPGP_Percent;

  //     r.WSales = r.Wgross;
  //     r.WGross = r.Wgross;
  //     r.WGP_Percent = r.WGP_Percent;

  //     r.ISales = r.Igross;
  //     r.IGross = r.Igross;
  //     r.IGP_Percent = r.IGP_Percent;

  //     r.TotSales = r.Total_PartsSale;
  //     r.TotGross = r.Total_PartsGross;
  //     r.TOTGP_Percent = r.TOTGP_Percent;


  //     if (r.data2) {
  //       try {
  //         const parsed = JSON.parse(r.data2);

  //         r.Data2 = parsed.map((child: any) => ({
  //           ...child,
  //           AdvisorName: child.data2,
  //           parentVar1Value: r.data1,
  //           isLayer2: true
  //         }));

  //       } catch (e) {
  //         //console.error(" ERROR parsing service data2:", e);
  //         r.Data2 = [];
  //       }
  //     } else {
  //       r.Data2 = [];
  //     }


  //     expanded[r.SNO] = hasSecondGrouping ? true : false;
  //   });

  //   this.ServiceExpandedRows.set(expanded);
  //   this.ServiceData.set(list);

  //   //console.log(" FINAL SERVICE WITH CHILDREN:", this.ServiceData());
  // }

  MapServiceData(list: any[]) {

    const map: any = {
      C: 'Customer Pay',
      I: 'Internal',
      R: 'Retail',
      T: 'Warranty',
      W: 'Wholesale'
    };

    list.forEach((r, i) => {
      r.SNO = i + 1;


      r.DisplayLabel = map[r.data1] || r.data1;

      r.CPSales = r.CPgross;
      r.CPGross = r.CPgross;

      r.WSales = r.Wgross;
      r.WGross = r.Wgross;

      r.ISales = r.Igross;
      r.IGross = r.Igross;

      if (r.data2) {
        try {
          const parsed = JSON.parse(r.data2);

          r.Data2 = parsed.map((child: any) => ({
            ...child,
            AdvisorName: child.data2,
            parentVar1Value: r.data1,
            isLayer2: true
          }));
        } catch {
          r.Data2 = [];
        }
      } else {
        r.Data2 = [];
      }
    });

    this.ServiceData.set(list);
  }


  LoadPartsGrossData() {
    const req = this.activeFilters();
    const detailReq = { ...req, RowType: "D" };
    this.spinner.show();
    this.shared.api.postmethod(this.shared.common.routeEndpoint + 'GetPartsGrossSummaryNewPartsDD', detailReq).subscribe({
      next: (res: any) => {
        //console.log("Parts Detail Response:", res);

        const rows = res?.response ?? [];
        this.PartsData.set(rows);

        this.MapPartsData(rows);
        const totalReq = { ...req, RowType: "T" };
        this.shared.api.postmethod(this.shared.common.routeEndpoint + 'GetPartsGrossSummaryNewPartsDD', totalReq).subscribe({
          next: (res2: any) => {
            //console.log("Parts Total Response:", res2);

            const t = res2?.response?.[0] ?? {};
            this.PartsTotals.set({
              Label: t.data1,
              // ===== TOTAL PARTS =====
              TotSales: t.Total_PartsSale,
              TotGross: t.Total_PartsGross,
              TotPace: t.Total_PartsGross_Pace,
              TotTarget: t.Total_PartsGrossTarget,
              TotDiff: t.Total_PartsGross_Diff,

              // ===== RETAIL =====
              RetailGross: t.Retailgross,
              RetailPace: t.Retailgross_Pace,
              RetailTarget: t.Retailgross_Target,
              RetailDiff: t.Retailgross_Diff,

              // ===== WHOLESALE =====
              WholeGross: t.Wholesalegross,
              WholePace: t.Wholesalegross_Pace,
              WholeTarget: t.Wholesalegross_Target,
              WholeDiff: t.Wholesalegross_Diff,

              // ===== PARTS =====
              PartsGross: t.PartsGross,
              PartsPace: t.PartsGross_Pace,
              PartsTarget: t.PartsGross_Target,
              PartsDiff: t.PartsGross_Diff
            });
            this.Loading.set(false);
            this.spinner.hide();
          }
        });
      },

      error: () => {
        this.Loading.set(false);
        this.spinner.hide()
      }
    });
  }

  datacheck() {
    //console.log('data', this.PartsData(), this.BuildFinalPartsTable());

  }


  LoadLayer2Details(row: any) {
    this.LayerLoading.set(true);

    const req = {
      startdealdate: this.activeFilters().startdate,
      enddealdate: this.activeFilters().enddate,
      Store: this.activeFilters().Store,
      Labortype: this.activeFilters().Labortype,
      Saletype: this.activeFilters().Saletype,
      SourceBulk: this.activeFilters().SourceBulk,
      SourceTire: this.activeFilters().SourceTire,
      SourceWithout: this.activeFilters().SourceWithout,

      var1: "DealerName",
      var1Value: row.data1,
      var2: "",
      var3: "",
      var2Value: '',
      var3Value: '',
      PageNumber: 0,
      PageSize: 200,
      RowType: "T"
    };
    this.shared.api.postmethod(this.shared.common.routeEndpoint + 'GetPartsGrossSummaryNewPartsDD', req).subscribe({
      next: (res: any) => {

        const children = res?.response ?? [];

        // Normalize children for table
        row.Data2 = children.map((child: any) => ({
          ...child,
          AdvisorName: child.data2,
          StoreName: child.data1,
          isLayer2: true
        }));

        this.LayerLoading.set(false);
      },
      error: () => this.LayerLoading.set(false)
    });
  }

  ToggleGlobalExpand(row: any) {
    const expandedState = { ...this.ExpandedRows() };
    expandedState[row.SNO] = !expandedState[row.SNO];
    this.ExpandedRows.set(expandedState);
  }

  ToggleServiceExpand(row: any) {
    //console.log("🟦 ToggleServiceExpand CLICKED for dealer:", row.data1);
    //console.log("➡ row.SNO =", row.SNO);
    //console.log("➡ row.Data2 length BEFORE expanding =", row.Data2?.length);

    const map = { ...this.ServiceExpandedRows() };
    map[row.SNO] = !map[row.SNO];
    this.ServiceExpandedRows.set(map);

    //console.log("➡ ExpandedRows AFTER toggle =", this.ServiceExpandedRows());
    //console.log("➡ BuildFinalServiceTable() AFTER toggle =", this.BuildFinalServiceTable());
  }


  TogglePartsExpand(row: any) {
    //console.log("TogglePartsExpand clicked", row);
    const map = { ...this.PartsExpandedRows() };
    map[row.SNO] = !map[row.SNO];
    this.PartsExpandedRows.set(map);

    if (map[row.SNO]) this.LoadLayer2Details(row);
  }

  BuildFinalGlobalTable = computed(() => {
    return this.MainData();
  });


  BuildFinalServiceTable = computed(() => {
    const src = this.ServiceData();
    const expanded = this.ServiceExpandedRows();

    const finalRows: any[] = [];

    src.forEach(parent => {
      finalRows.push(parent);

      if (expanded[parent.SNO] && parent.Data2?.length) {
        parent.Data2.forEach((child: any) => {
          finalRows.push(child);
        });
      }
    });

    return finalRows;
  });


  BuildFinalPartsTable = computed(() => {
    const src = this.PartsData();
    const expanded = this.PartsExpandedRows();

    const finalRows: any[] = [];

    src.forEach(parent => {
      finalRows.push(parent);

      if (expanded[parent.SNO] && parent.Data2?.length) {
        parent.Data2.forEach((child: any) => {
          finalRows.push(child);
        });
      }
    });

    return finalRows;
  });

  FR(v: any) {
    return (v === null || v === undefined || v === "-" || v == 0)
      ? "-"
      : Number(v).toLocaleString('en-US');
  }

  F(v: any) {
    return (v === null || v === undefined || v === "-" || v == 0)
      ? "-"
      : Number(v).toLocaleString('en-US');
  }

  PR(v: any) {
    return v == null ? "-" : Number(v).toFixed(2) + "%";
  }

  P(v: any) {
    return v == null ? "-" : Number(v).toFixed(2) + "%";
  }


  GetGlobalRowClasses(row: any) {
    return { 'layer2-row': row?.isLayer2, 'parent-row': !row?.isLayer2 };
  }

  GetServiceRowClasses(row: any) {
    return { 'layer2-row': row?.isLayer2, 'parent-row': !row?.isLayer2 };
  }

  GetPartsRowClasses(row: any) {
    return { 'layer2-row': row?.isLayer2, 'parent-row': !row?.isLayer2 };
  }

  GetLayerIndent(row: any) {
    return row?.isLayer2
      ? { 'padding-left': '32px', 'background': '#f3f4f6' }
      : {};
  }

  IsExpandable(row: any) {
    return !row?.isLayer2 && row?.Data2 && row.Data2.length > 0;
  }


  GetExpandIcon(isOpen: boolean) {
    return isOpen ? 'fa fa-minus-circle expand-icon' : 'fa fa-plus-circle expand-icon';
  }

  BuildGlobalFooterTotals = computed(() => {
    const list = this.MainData();
    if (!list.length) return null;

    return {
      Sales: this.Sum(list, 'Sales'),
      Gross: this.Sum(list, 'Gross'),
      Pace: this.Sum(list, 'Pace'),
      Target: this.Sum(list, 'Target'),
      Diff: this.Sum(list, 'Diff'),

      MechanicalGross: this.Sum(list, 'MechanicalGross'),
      MechanicalPace: this.Sum(list, 'MechanicalPace'),
      MechanicalTarget: this.Sum(list, 'MechanicalTarget'),
      MechanicalDiff: this.Sum(list, 'MechanicalDiff'),

      RetailGross: this.Sum(list, 'RetailGross'),
      RetailPace: this.Sum(list, 'RetailPace'),
      RetailTarget: this.Sum(list, 'RetailTarget'),
      RetailDiff: this.Sum(list, 'RetailDiff'),

      PartsRO: this.Sum(list, 'TotalRO'),
      LostDay: this.Sum(list, 'LostDay'),
      GP: this.Avg(list, 'GPPercent')
    };
  });

  BuildServiceFooterTotals = computed(() => {
    const list = this.ServiceData();
    if (!list.length) return null;

    return {
      CPSales: this.Sum(list, 'CPSales'),
      CPGross: this.Sum(list, 'CPGross'),
      WGross: this.Sum(list, 'WGross'),
      IGross: this.Sum(list, 'IGross'),
      Total: this.Sum(list, 'TotGross')
    };
  });

  Sum(list: any[], key: string) {
    return list.reduce((a, b) => a + (Number(b[key]) || 0), 0);
  }

  Avg(list: any[], key: string) {
    const valid = list.filter(x => x[key] != null);
    if (!valid.length) return 0;

    const sum = valid.reduce((a, b) => a + Number(b[key] || 0), 0);
    return (sum / valid.length).toFixed(2);
  }

  GoServiceView() {
    this.Loading.set(true);
    this.CurrentView.set('SERVICE_BREAKDOWN');
    this.spinner.show();
    this.LoadServiceGrossData();

  }

  GoServiceBreakdown() {
    // !this.api2.filterData()
    this.CurrentView.set('SERVICE_BREAKDOWN');
    this.spinner.show();
    this.LoadServiceBreakdown();

  }

  GoPartsView() {
    this.Loading.set(true);
    this.CurrentView.set('PARTS');
    this.spinner.show();
    this.LoadPartsGrossData();
  }
  GoPartsBreakdown() {
    this.Loading.set(true);
    this.CurrentView.set('PARTS_BREAKDOWN');
    this.spinner.show();
    this.LoadPartsBreakdown();
  }

  BackToOverview() {
    //console.log(">>> BackToOverview() called — switching view to GLOBAL");
    this.CurrentView.set('GLOBAL');
    //console.log(">>> Active filters to be used:", this.activeFilters());
    this.Loading.set(true);
    //console.log(">>> Calling LoadGlobalPartsGrossData() to refresh global table with current filters");
    this.LoadGlobalPartsGrossData();
  }


  LoadServiceBreakdown() {
    const totals = this.ServiceTotals();

    if (!totals) return;

    this.ServiceBreakdown.set({
      data1: totals.data1,
      service: {
        MTD: totals.ServiceGross,
        Pace: totals.ServiceGross_Pace,
        Target: totals.ServiceGross_Target,
        Diff: totals.ServiceGross_Diff
      },

      customerPay: {
        MTD: totals.CPgross,
        Pace: totals.CPgross_Pace,
        Target: totals.CPgross_Target,
        Diff: totals.CPgross_Diff
      },

      warranty: {
        MTD: totals.Wgross,
        Pace: totals.Wgross_Pace,
        Target: totals.Wgross_Target,
        Diff: totals.Wgross_Diff
      },

      internal: {
        MTD: totals.Igross,
        Pace: totals.Igross_Pace,
        Target: totals.Igross_Target,
        Diff: totals.Igross_Diff
      }

    });
  }

  LoadPartsBreakdown() {
    this.LayerLoading.set(true);
    this.shared.api.postmethod(this.shared.common.routeEndpoint + 'GetPartsGrossSummaryNewPartsDD', (this.activeFilters())).subscribe({
      next: (res: any) => {
        //console.log('parts table response', res);

        const row = res?.response?.[0] ?? {};
        this.PartsBreakdown.set(row);
        this.LayerLoading.set(false);
      },
      error: () => this.LayerLoading.set(false)
    });
  }

  //   OpenDealerPopup(row: any) {
  //   this.SelectedDealer.set(row);
  //   this.ShowDealerModal.set(true);
  //   this.LoadDealerPopupData(row);

  // }

  OpenDealerPopup(row: any) {
    //console.log("DETAILS POPUP TEST — Clicked row:", row);

    const modalRef = this.modalService.open(PartsDetails, {
      size: 'xl',
      windowClass: 'details-modal',
      backdrop: 'static'
    });

    modalRef.componentInstance.Servicedetails = [
      {
        StartDate: this.activeFilters().startdate,
        EndDate: this.activeFilters().enddate,
        var1: "DealerName",
        var1Value: row.data1,

        var2: "",
        var3: "",
        var2Value: "",
        var3Value: "",

        PaytypeC: true,
        PaytypeW: true,
        PaytypeI: true,

        DepartmentS: "",
        DepartmentP: "",
        DepartmentQ: "",
        DepartmentB: "",
        PolicyAccount: "",
        zeroHours: false,

        laborTypes: this.activeFilters().Labortype
      }
    ];
  }

  CloseDealerPopup() {
    this.ShowDealerModal.set(false);
    this.SelectedDealer.set(null);
    this.DealerPopupData.set([]);
  }

  LoadDealerPopupData(row: any) {
    this.DealerPopupLoading.set(true);

    const req = {
      startdealdate: this.activeFilters().startdate,
      enddealdate: this.activeFilters().enddate,
      Store: this.activeFilters().Store,
      Labortype: this.activeFilters().Labortype,
      Saletype: this.activeFilters().Saletype,
      SourceBulk: this.activeFilters().SourceBulk,
      SourceTire: this.activeFilters().SourceTire,
      SourceWithout: this.activeFilters().SourceWithout,

      var1: "DealerName",
      var1Value: row.data1,
      var2: "",
      var3: "",
      var2Value: "",
      var3Value: "",
      PageNumber: 0,
      PageSize: 500
    };
    //console.log("Dealer Popup API payload:", req);
    this.shared.api.postmethod(this.shared.common.routeEndpoint + 'GetPartsGrossSummaryDetailsNew', req).subscribe({
      next: (res: any) => {
        //console.log("Dealer Popup API Response:", res?.response);
        const mapped = (res?.response ?? []).map((x: any) => ({
          InvoiceNo: x.InvoiceNumber,
          InvoiceDate: x.CDate,
          Customer: x.Customername,
          PartNo: x.Partnumber,
          Description: x.AP_description,

          TotalSales: x.Total_Sale,
          TotalGross: x.Total_Gross,
          TotalGPPercent: x.Total_Retention,

          CustomerPaySales: x.Cust_Sale,
          CustomerPayGross: x.Cust_Gross,
          CustomerPayGPPercent: x.Cust_Retention,

          WarrantySales: x.Warranty_Sale,
          WarrantyGross: x.Warranty_Gross,
          WarrantyGPPercent: x.Warranty_Retention,

          InternalSales: x.Internal_Sale,
          InternalGross: x.Internal_Gross,
          InternalGPPercent: x.Internal_Retention,

          CounterRetailSales: x.Counter_sale,
          CounterRetailGross: x.Counter_Gross,
          CounterGPPercent: x.Counter_Retention,

          WholesaleSales: x.Wholesale_Sale,
          WholesaleGross: x.Wholesale_Gross,
          WholesaleGPPercent: x.Wholesale_Retention
        }));
        //console.log("Mapped Dealer Popup Data:", mapped);
        this.DealerPopupData.set(mapped);
        //
        this.DealerPopupLoading.set(false);
      },
      error: () => this.DealerPopupLoading.set(false)
    });
  }

  downloadDealerExcel(): void {
    const data = this.DealerPopupData?.() || [];

    if (!data.length) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Dealer Invoice');

    // ===== HEADER (23 columns exactly as your table) =====
    const headers = [
      'INVOICE #', 'DATE', 'CUSTOMER', 'PART #', 'DESCRIPTION',

      'TOTAL SALES', 'TOTAL GROSS', 'TOTAL GP%',

      'CP SALES', 'CP GROSS', 'CP GP%',

      'WARRANTY SALES', 'WARRANTY GROSS', 'WARRANTY GP%',

      'INTERNAL SALES', 'INTERNAL GROSS', 'INTERNAL GP%',

      'COUNTER SALES', 'COUNTER GROSS', 'COUNTER GP%',

      'WHOLESALE SALES', 'WHOLESALE GROSS', 'WHOLESALE GP%'
    ];

    worksheet.addRow(headers);

    // ===== BODY ROWS (Match your HTML EXACTLY) =====
    data.forEach((r: any) => {
      worksheet.addRow([
        r.InvoiceNo,
        r.InvoiceDate,
        r.Customer,
        r.PartNo,
        r.Description,

        r.TotalSales,
        r.TotalGross,
        r.TotalGPPercent,

        r.CustomerPaySales,
        r.CustomerPayGross,
        r.CustomerPayGPPercent,

        r.WarrantySales,
        r.WarrantyGross,
        r.WarrantyGPPercent,

        r.InternalSales,
        r.InternalGross,
        r.InternalGPPercent,

        r.CounterRetailSales,
        r.CounterRetailGross,
        r.CounterGPPercent,

        r.WholesaleSales,
        r.WholesaleGross,
        r.WholesaleGPPercent
      ]);
    });

    // ===== Auto column width =====
    worksheet.columns = headers.map(h => ({ width: 18 }));

    // ===== DOWNLOAD =====
    workbook.xlsx.writeBuffer().then((buffer: any) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      saveAs(blob, `Tropical_Parts_Gross_${new Date().getTime()}.xlsx`);
    });
  }


  MapPartsData(list: any[]) {
    // Detect if 2nd grouping is active (same detection used for GLOBAL / SERVICE)
    const hasSecondGrouping =
      (this.selectedDataGrouping && this.selectedDataGrouping.length >= 2)
      || (!!this.activeFilters().var2 && this.activeFilters().var2 !== '');

    const expanded: any = {};

    list.forEach((r, i) => {
      r.SNO = i + 1;

      // Total Parts
      r.TotSales = r.Total_PartsSale;
      r.TotGross = r.Total_PartsGross;
      r.TotPace = r.Total_PartsGross_Pace;
      r.TotTarget = r.Total_PartsGrossTarget;
      r.TotDiff = r.Total_PartsGross_Diff;

      // Retail
      r.RetailGross = r.Retailgross;
      r.RetailPace = r.Retailgross_Pace;
      r.RetailTarget = r.Retailgross_Target;
      r.RetailDiff = r.Retailgross_Diff;

      // Wholesale
      r.WholeGross = r.Wholesalegross;
      r.WholePace = r.Wholesalegross_Pace;
      r.WholeTarget = r.Wholesalegross_Target;
      r.WholeDiff = r.Wholesalegross_Diff;

      // Parts
      r.PartsGross = r.PartsGross;
      r.PartsPace = r.PartsGross_Pace;
      r.PartsTarget = r.PartsGross_Target;
      r.PartsDiff = r.PartsGross_Diff;

      // --- CHILD PARSING ---
      if (r.data2) {
        try {
          const parsed = JSON.parse(r.data2);

          r.Data2 = parsed.map((child: any) => ({
            ...child,
            AdvisorName: child.data2,
            parentVar1Value: r.data1,
            isLayer2: true
          }));
        } catch (e) {
          r.Data2 = [];
        }
      } else {
        r.Data2 = [];
      }

      // Default expand when grouping-2 is active
      expanded[r.SNO] = hasSecondGrouping ? true : false;
    });

    // Write expanded map and rows into signals
    this.PartsExpandedRows.set(expanded);
    this.PartsData.set(list);

    // If rows were default-expanded but have no Data2 yet (lazy load),
    // fetch layer2 details so children become visible immediately.
    // (This mirrors user expectation: when grouping-2 is active, children should show.)
    if (hasSecondGrouping) {
      list.forEach((r: any) => {
        if (expanded[r.SNO] && (!r.Data2 || r.Data2.length === 0)) {
          // LoadLayer2Details is async and updates r.Data2 when done
          this.LoadLayer2Details(r);
        }
      });
    }
  }




  BuildPartsFooterTotals = computed(() => {
    const list = this.PartsData();
    if (!list.length) return null;

    return {

      // ===== RETAIL =====
      RetailGross: this.Sum(list, 'Retailgross'),
      RetailPace: this.Sum(list, 'Retailgross_Pace'),
      RetailTarget: this.Sum(list, 'Retailgross_Target'),
      RetailDiff: this.Sum(list, 'Retailgross_Diff'),

      // ===== WHOLESALE =====
      WholeGross: this.Sum(list, 'Wholesalegross'),
      WholePace: this.Sum(list, 'Wholesalegross_Pace'),
      WholeTarget: this.Sum(list, 'Wholesalegross_Target'),
      WholeDiff: this.Sum(list, 'Wholesalegross_Diff'),

      // ===== PARTS =====
      PartsGross: this.Sum(list, 'PartsGross'),
      PartsPace: this.Sum(list, 'PartsGross_Pace'),
      PartsTarget: this.Sum(list, 'PartsGross_Target'),
      PartsDiff: this.Sum(list, 'PartsGross_Diff'),

      // ===== TOTAL PARTS =====
      TotSales: this.Sum(list, 'Total_PartsSale'),
      TotGross: this.Sum(list, 'Total_PartsGross'),
      TotPace: this.Sum(list, 'Total_PartsGross_Pace'),
      TotTarget: this.Sum(list, 'Total_PartsGrossTarget'),
      TotDiff: this.Sum(list, 'Total_PartsGross_Diff')
    };
  });
  // ---------------- Excel Filter Support (Required) ----------------
  selectedDataGrouping: any[] = [];
  stores: any[] = [];
  department: string[] = [];
  // saletype: string[] = [];          
  saletype: string = "";
  partsSource: string = "";

  // async exportToExcel() {
  //   const view = this.CurrentView();
  //   let rows = [];
  //   let totals: any = null;
  //   let sheetName = "";

  //   if (view === "GLOBAL") {
  //     rows = this.BuildFinalGlobalTable();
  //     totals = this.BuildGlobalFooterTotals();
  //     sheetName = "PartsGross";
  //   }
  //   else if (view === "SERVICE_BREAKDOWN") {
  //     rows = this.BuildFinalServiceTable();
  //     totals = this.ServiceTotals();
  //     sheetName = "SERVICE";
  //   }
  //   else if (view === "PARTS") {
  //     rows = this.BuildFinalPartsTable();
  //     totals = this.PartsTotals();
  //     sheetName = "PARTS";
  //   }
  //   else {
  //     alert("Nothing to export");
  //     return;
  //   }

  //   if (!rows.length) return;

  //   const wb = new ExcelJS.Workbook();
  //   const ws = wb.addWorksheet(sheetName);

  //   // ========== FILTERS SECTION (Top block) ==========
  //   this.buildFilterSection(ws);

  //   // ========== BUILD HEADERS ==========
  //   ws.addRow([]);

  //   if (sheetName === "PartsGross") {
  //     const blue = ws.addRow([
  //       "Dealer",
  //       "TOTAL PARTS", "", "", "", "",
  //       "MECHANICAL", "", "", "",
  //       "RETAIL / WHOLESALE", "", "", "",
  //       "PERFORMANCE", "", ""
  //     ]);

  //     ws.mergeCells("A8:A8");
  //     ws.mergeCells("B8:F8");
  //     ws.mergeCells("G8:J8");
  //     ws.mergeCells("K8:N8");
  //     ws.mergeCells("O8:Q8");

  //     blue.eachCell((c) => this.applyBlueHeader(c));

  //     const sub = ws.addRow([
  //       "Dealer",
  //       "Sales", "Gross", "Pace", "Target", "Diff",
  //       "Gross", "Pace", "Target", "Diff",
  //       "Gross", "Pace", "Target", "Diff",
  //       "Parts/RO", "Lost/Day", "GP%"
  //     ]);

  //     sub.eachCell((c) => this.applyGrayHeader(c));
  //   }

  //   if (sheetName === "SERVICE") {
  //     const blue = ws.addRow([
  //       "Dealer",
  //       "TOTAL PARTS", "", "", "", "",
  //       "SERVICE", "", "", "",
  //       "CUSTOMER PAY", "", "", "",
  //       "WARRANTY", "", "", "",
  //       "INTERNAL", "", "", ""
  //     ]);

  //     ws.mergeCells("A8:A8");
  //     ws.mergeCells("B8:F8");
  //     ws.mergeCells("G8:J8");
  //     ws.mergeCells("K8:N8");
  //     ws.mergeCells("O8:R8");
  //     ws.mergeCells("S8:V8");

  //     blue.eachCell((c) => this.applyBlueHeader(c));

  //     const sub = ws.addRow([
  //       "Dealer",


  //       "Sales", "Gross", "Pace", "Target", "Diff",

  //       "MTD", "Pace", "Target", "Diff",
  //       "MTD", "Pace", "Target", "Diff",
  //       "MTD", "Pace", "Target", "Diff",
  //       "MTD", "Pace", "Target", "Diff"
  //     ]);

  //     sub.eachCell((c) => this.applyGrayHeader(c));
  //   }

  //   if (sheetName === "PARTS") {
  //     const blue = ws.addRow([
  //       "Dealer",
  //       "TOTAL PARTS", "", "", "", "",
  //       "RETAIL", "", "", "",
  //       "WHOLESALE", "", "", "",
  //       "PARTS", "", "", ""
  //     ]);

  //     ws.mergeCells("A8:A8");
  //     ws.mergeCells("B8:F8");
  //     ws.mergeCells("G8:J8");
  //     ws.mergeCells("K8:N8");
  //     ws.mergeCells("O8:R8");

  //     blue.eachCell((c) => this.applyBlueHeader(c));

  //     const sub = ws.addRow([
  //       "Dealer",
  //       "Sales", "Gross", "Pace", "Target", "Diff",
  //       "Gross", "Pace", "Target", "Diff",
  //       "Gross", "Pace", "Target", "Diff",
  //       "Gross", "Pace", "Target", "Diff"
  //     ]);
  //     sub.eachCell((c) => this.applyGrayHeader(c));
  //   }

  //   // ========== TOP TOTAL ==========  
  //   if (this.selectedTotalPosition === "T" && totals) {
  //     ws.addRow(this.formatTotalsRow(sheetName, totals));
  //   }

  //   // ========== DETAIL ROWS (FLAT with child rows) ==========
  //   rows.forEach(r => {
  //     const arr = this.formatDataRow(sheetName, r);
  //     const excelRow = ws.addRow(arr);

  //     // Highlight negative numbers
  //     excelRow.eachCell((cell, col) => {
  //       if (typeof cell.value === "number" && cell.value < 0) {
  //         cell.font = { color: { argb: 'FF0000' }, bold: true };
  //       }
  //     });

  //     // Child rows
  //     if (r.Data2?.length) {
  //       r.Data2.forEach((c: any) => {
  //         const childArr = this.formatChildDataRow(sheetName, c);
  //         const childRow = ws.addRow(childArr);

  //         childRow.eachCell(cell => {
  //           if (typeof cell.value === "number" && cell.value < 0) {
  //             cell.font = { color: { argb: 'FF0000' }, bold: true };
  //           }
  //         });
  //       });
  //     }
  //   });

  //   // ========== BOTTOM TOTAL ==========  
  //   if (this.selectedTotalPosition === "B" && totals) {
  //     ws.addRow(this.formatTotalsRow(sheetName, totals));
  //   }

  //   ws.columns.forEach(col => col.width = 16);

  //   const buffer = await wb.xlsx.writeBuffer();
  //   saveAs(new Blob([buffer]), `${sheetName}_Report_${Date.now()}.xlsx`);
  // }

  applyTableBorders(row: ExcelJS.Row) {
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'D1D5DB' } },
        left: { style: 'thin', color: { argb: 'D1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
        right: { style: 'thin', color: { argb: 'D1D5DB' } },
      };
    });
  }

  ExcelGroupings = '';
  ExcelStores = '';
  ExcelDepartment = '';
  ExcelSaleType = '';
  ExcelSource = '';
  ExcelDateRange = '';

  prepareExcelFilters() {
    const f = this.activeFilters();

    this.ExcelGroupings =
      this.selectedDataGrouping?.length
        ? this.selectedDataGrouping.map((g: any) => g.ARG_LABEL).join(', ')
        : 'Store';

    this.ExcelStores =
      this.stores?.length
        ? this.stores.map((s: any) => s.storename).join(', ')
        : 'All Stores';

    this.ExcelDepartment =
      this.department?.length
        ? this.department.join(', ')
        : '-';

    this.ExcelSaleType = this.getSaleTypeText();
    this.ExcelSource = this.getPartsSourceText();
    this.ExcelDateRange = `${f.startdate} to ${f.enddate}`;
  }

  applyCurrency(cell: ExcelJS.Cell) {
    if (cell.value === null || cell.value === undefined || cell.value === '-') {
      cell.value = '-';
      return;
    }

    cell.numFmt = '_($* #,##0.00_);_($* -#,##0.00_);_("-"??_);_(@_)';
  }

  applyPercent(cell: ExcelJS.Cell) {
    if (cell.value == null || cell.value === '-') {
      cell.value = '-';
      return;
    }

    cell.value = Number(cell.value) / 100;
    cell.numFmt = '0.00%';
  }

  applyZebraRow(row: ExcelJS.Row, isEven: boolean) {
    row.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'F7FAFC' : 'FFFFFF' }
      };
    });
  }

  getExcelSaleTypeLabel(value: string): string {
    if (!value) return value;

    const map: any = {
      C: 'Customer Pay',
      I: 'Internal',
      R: 'Retail',
      T: 'Warranty',
      W: 'Wholesale'
    };

    return map[value] || value;
  }

  forceBottomBorder(row: ExcelJS.Row) {
    row.eachCell({ includeEmpty: true }, cell => {
      cell.border = {
        top: cell.border?.top,
        left: cell.border?.left,
        right: cell.border?.right,
        bottom: { style: 'thin', color: { argb: 'D1D5DB' } }
      };
    });
  }

  async exportToExcel() {

    this.prepareExcelFilters();

    const view = this.CurrentView();
    let rows: any[] = [];
    let totals: any = null;
    let sheetName = "";
    let sheetTitle = "Parts Gross";

    if (view === "GLOBAL") {
      rows = this.BuildFinalGlobalTable();
      totals = this.BuildGlobalFooterTotals();
      sheetName = "GLOBAL";
      sheetTitle = "Parts Gross";
    }
    else if (view === "SERVICE_BREAKDOWN") {
      // rows = this.BuildFinalServiceTable();
      rows = this.ServiceData();
      totals = this.ServiceTotals();
      sheetName = "SERVICE";
    }
    else if (view === "PARTS") {
      // rows = this.BuildFinalPartsTable();
      rows = this.PartsData();
      totals = this.PartsTotals();
      sheetName = "PARTS";
    }
    else {
      alert("Nothing to export");
      return;
    }

    // ================= STEP-5 =================
    // Prevent export while loading or empty
    if (this.Loading() || this.LayerLoading()) {
      console.warn('Excel blocked: data still loading');
      return;
    }

    if (!rows || !rows.length) {
      alert('No data to export');
      return;
    }

    // ================= WORKBOOK =================
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(sheetTitle || sheetName);
    ws.views = [{ showGridLines: false }];

    // ================= FILTER SECTION =================
    this.buildFilterSection(ws);

    ws.addRow([]);

    // ================= HEADERS =================
    if (sheetName === "GLOBAL") {

      const blue = ws.addRow([
        this.getDateRange(),
        "Total Parts", "", "", "", "",
        "Mechanical", "", "", "",
        "Retail / Wholesale", "", "", "",
        "Performance", "", ""
      ]);

      const headerRowIndex = blue.number;
      // ws.mergeCells("B8:F8");
      // ws.mergeCells("G8:J8");
      // ws.mergeCells("K8:N8");
      // ws.mergeCells("O8:Q8");
      ws.mergeCells(headerRowIndex, 2, headerRowIndex, 6);

      // MECHANICAL (G–J)
      ws.mergeCells(headerRowIndex, 7, headerRowIndex, 10);

      // RETAIL / WHOLESALE (K–N)
      ws.mergeCells(headerRowIndex, 11, headerRowIndex, 14);

      // PERFORMANCE (O–Q)
      ws.mergeCells(headerRowIndex, 15, headerRowIndex, 17);

      blue.eachCell(c => this.applyBlueHeader(c));
      this.applyTableBorders(blue);

      const sub = ws.addRow([
        "",
        "Sales", "Gross", "Pace", "Target", "Diff",
        "Gross", "Pace", "Target", "Diff",
        "Gross", "Pace", "Target", "Diff",
        "Parts/RO", "Lost/Day", "GP%"
      ]);

      sub.eachCell(c => this.applyGrayHeader(c));
      this.applyTableBorders(sub);
      this.forceBottomBorder(sub);
    }

    if (sheetName === "SERVICE") {

      const blue = ws.addRow([
        this.getDateRange(),
        "Total Parts", "", "", "", "",
        "Service", "", "", "",
        "Customer Pay", "", "", "",
        "Warranty", "", "", "",
        "Internal", "", "", ""
      ]);

      ws.mergeCells("B8:F8");
      ws.mergeCells("G8:J8");
      ws.mergeCells("K8:N8");
      ws.mergeCells("O8:R8");
      ws.mergeCells("S8:V8");

      blue.eachCell(c => this.applyBlueHeader(c));
      this.applyTableBorders(blue);

      const sub = ws.addRow([
        "",
        "Sales", "Gross", "Pace", "Target", "Diff",
        "MTD", "Pace", "Target", "Diff",
        "MTD", "Pace", "Target", "Diff",
        "MTD", "Pace", "Target", "Diff",
        "MTD", "Pace", "Target", "Diff"
      ]);

      sub.eachCell(c => this.applyGrayHeader(c));
      this.applyTableBorders(sub);
    }

    if (sheetName === "PARTS") {

      const blue = ws.addRow([
        this.getDateRange(),
        "Total Parts", "", "", "", "",
        "Retail", "", "", "",
        "Wholesale", "", "", "",
        "Parts", "", "", ""
      ]);

      ws.mergeCells("B8:F8");
      ws.mergeCells("G8:J8");
      ws.mergeCells("K8:N8");
      ws.mergeCells("O8:R8");

      blue.eachCell(c => this.applyBlueHeader(c));
      this.applyTableBorders(blue);

      const sub = ws.addRow([
        "",
        "Sales", "Gross", "Pace", "Target", "Diff",
        "Gross", "Pace", "Target", "Diff",
        "Gross", "Pace", "Target", "Diff",
        "Gross", "Pace", "Target", "Diff"
      ]);

      sub.eachCell(c => this.applyGrayHeader(c));
      this.applyTableBorders(sub);
    }

    // ================= TOP TOTAL =================
    if (this.selectedTotalPosition === "T" && totals) {
      // ws.addRow(this.formatTotalsRow(sheetName, totals));
      const totalRow = ws.addRow(this.formatTotalsRow(sheetName, totals));

      [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].forEach(i => {
        this.applyCurrency(totalRow.getCell(i));
      });

      this.applyPercent(totalRow.getCell(17));
      totalRow.getCell(17).alignment = { horizontal: 'right' };

      this.applyTableBorders(totalRow);
      this.forceBottomBorder(totalRow);
      totalRow.eachCell(cell => {
        cell.border = {
          ...cell.border,
          bottom: { style: 'thin', color: { argb: 'D1D5DB' } }
        };
      });


    }

    // ================= DATA ROWS =================
    //   rows.forEach(r => {
    //     // ws.addRow(this.formatDataRow(sheetName, r));

    //     const row = ws.addRow(this.formatDataRow(sheetName, r));

    // // Currency columns (adjust indexes if needed)
    // [2,3,4,5,6, 7,8,9,10, 11,12,13,14].forEach(i => {
    //   this.applyCurrency(row.getCell(i));
    // });

    // // GP% column
    // this.applyPercent(row.getCell(17));

    // // Optional: force right alignment
    // row.getCell(17).alignment = { horizontal: 'right' };

    //     if (r.Data2?.length) {
    //   r.Data2.forEach((c: any) => {

    //     const childRow = ws.addRow(
    //       this.formatChildDataRow(sheetName, c)
    //     );

    //     [2,3,4,5,6, 7,8,9,10, 11,12,13,14].forEach(i => {
    //   this.applyCurrency(childRow.getCell(i));
    // });

    // this.applyPercent(childRow.getCell(17));
    // childRow.getCell(17).alignment = { horizontal: 'right' };

    //   });
    // }

    //   });

    let dataRowIndex = 0;

    rows.forEach(r => {

      const row = ws.addRow(this.formatDataRow(sheetName, r));

      // Currency formatting
      [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].forEach(i => {
        this.applyCurrency(row.getCell(i));
      });

      this.applyPercent(row.getCell(17));
      row.getCell(17).alignment = { horizontal: 'right' };

      // ✅ Zebra striping (parent rows only)
      this.applyZebraRow(row, dataRowIndex % 2 === 1);
      this.applyTableBorders(row);
      this.forceBottomBorder(row);
      dataRowIndex++;


      // ---------- CHILD ROWS ----------
      if (r.Data2?.length) {
        r.Data2.forEach((c: any) => {

          const childRow = ws.addRow(
            this.formatChildDataRow(sheetName, c)
          );

          [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].forEach(i => {
            this.applyCurrency(childRow.getCell(i));
          });

          this.applyPercent(childRow.getCell(17));
          childRow.getCell(17).alignment = { horizontal: 'right' };

          // Slightly different shade for child rows (optional)
          this.applyZebraRow(childRow, dataRowIndex % 2 === 1);
          this.applyTableBorders(childRow);
          this.forceBottomBorder(childRow);
          dataRowIndex++;
        });
      }
    });

    // ================= BOTTOM TOTAL =================
    if (this.selectedTotalPosition === "B" && totals) {
      // ws.addRow(this.formatTotalsRow(sheetName, totals));
      const totalRow = ws.addRow(this.formatTotalsRow(sheetName, totals));

      [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].forEach(i => {
        this.applyCurrency(totalRow.getCell(i));
      });

      this.applyPercent(totalRow.getCell(17));
      totalRow.getCell(17).alignment = { horizontal: 'right' };

      this.applyTableBorders(totalRow);
      this.forceBottomBorder(totalRow);
      totalRow.eachCell(cell => {
        cell.border = {
          ...cell.border,
          bottom: { style: 'thin', color: { argb: 'D1D5DB' } }
        };
      });
    }

    // Everything before the blue header row (row 8 in your layout)
    ws.eachRow((row, rowNumber) => {
      if (rowNumber < 8) {
        row.eachCell(cell => {
          cell.border = {};
        });
      }
    });

    ws.columns.forEach(col => col.width = 16);
    ws.getColumn(1).width = 30;

    // ================= DOWNLOAD =================
    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${sheetTitle || sheetName}_Report_${Date.now()}.xlsx`);
  }

  formatTotalsRow(type: string, t: any) {

    if (type === "GLOBAL") {
      return [
        "REPORT TOTALS",

        t.Sales, t.Gross, t.Pace, t.Target, t.Diff,

        t.MechanicalGross, t.MechanicalPace, t.MechanicalTarget, t.MechanicalDiff,

        t.RetailGross, t.RetailPace, t.RetailTarget, t.RetailDiff,

        t.PartsRO, t.LostDay, t.GP
      ];
    }

    if (type === "SERVICE") {
      return [
        t.data1,

        t.Total_PartsSale,
        t.Total_PartsGross,
        t.Total_PartsGross_Pace,
        t.Total_PartsGrossTarget,
        t.Total_PartsGross_Diff,
        t.ServiceGross, t.ServiceGross_Pace, t.ServiceGross_Target, t.ServiceGross_Diff,
        t.CPgross, t.CPgross_Pace, t.CPgross_Target, t.CPgross_Diff,
        t.Wgross, t.Wgross_Pace, t.Wgross_Target, t.Wgross_Diff,
        t.Igross, t.Igross_Pace, t.Igross_Target, t.Igross_Diff
      ];
    }

    if (type === "PARTS") {
      return [
        t.Label,
        t.TotSales, t.TotGross, t.TotPace, t.TotTarget, t.TotDiff,
        t.RetailGross, t.RetailPace, t.RetailTarget, t.RetailDiff,
        t.WholeGross, t.WholePace, t.WholeTarget, t.WholeDiff,
        t.PartsGross, t.PartsPace, t.PartsTarget, t.PartsDiff
      ];
    }

    return [];
  }

  formatDataRow(type: string, r: any) {

    if (type === "GLOBAL") {
      return [
        this.getExcelSaleTypeLabel(r.data1),

        r.Sales, r.Gross, r.Pace, r.Target, r.Diff,

        r.MechanicalGross, r.MechanicalPace, r.MechanicalTarget, r.MechanicalDiff,

        r.RetailGross, r.RetailPace, r.RetailTarget, r.RetailDiff,

        r.TotalRO, r.LostDay, r.GPPercent
      ];
    }

    if (type === "SERVICE") {
      return [
        this.getExcelSaleTypeLabel(r.data1),
        r.Total_PartsSale,
        r.Total_PartsGross,
        r.Total_PartsGross_Pace,
        r.Total_PartsGrossTarget,
        r.Total_PartsGross_Diff,
        r.ServiceGross, r.ServiceGross_Pace, r.ServiceGross_Target, r.ServiceGross_Diff,
        r.CPgross, r.CPgross_Pace, r.CPgross_Target, r.CPgross_Diff,
        r.Wgross, r.Wgross_Pace, r.Wgross_Target, r.Wgross_Diff,
        r.Igross, r.Igross_Pace, r.Igross_Target, r.Igross_Diff
      ];
    }

    if (type === "PARTS") {
      return [
        this.getExcelSaleTypeLabel(r.data1),
        r.TotSales, r.TotGross, r.TotPace, r.TotTarget, r.TotDiff,
        r.RetailGross, r.RetailPace, r.RetailTarget, r.RetailDiff,
        r.WholeGross, r.WholePace, r.WholeTarget, r.WholeDiff,
        r.PartsGross, r.PartsPace, r.PartsTarget, r.PartsDiff
      ];
    }

    return [];
  }

  formatChildDataRow(type: string, c: any) {

    if (type === "GLOBAL") {
      return [
        this.getExcelSaleTypeLabel(c.AdvisorName),

        c.Sales, c.Gross, c.Pace, '-', '-',

        c.MechanicalGross, c.MechanicalPace, c.MechanicalTarget, c.MechanicalDiff,

        c.RetailGross, c.RetailPace, c.RetailTarget, c.RetailDiff,

        c.TotalRO, '-', c.GPPercent
      ];
    }

    if (type === "SERVICE") {
      return [
        this.getExcelSaleTypeLabel(c.AdvisorName),
        c.Total_PartsSale,
        c.Total_PartsGross,
        c.Total_PartsGross_Pace,
        "-",
        "-",
        c.ServiceGross, c.ServiceGross_Pace, "-", "-",
        c.CPgross, c.CPgross_Pace, "-", "-",
        c.Wgross, c.Wgross_Pace, "-", "-",
        c.Igross, c.Igross_Pace, "-", "-"
      ];
    }

    if (type === "PARTS") {
      return [
        this.getExcelSaleTypeLabel(c.AdvisorName),
        c.Total_PartsSale, c.Total_PartsGross, c.Total_PartsGross_Pace, "-", "-",
        c.Retailgross, c.Retailgross_Pace, "-", "-",
        c.Wholesalegross, c.Wholesalegross_Pace, "-", "-",
        c.PartsGross, c.PartsGross_Pace, "-", "-"
      ];
    }

    return [];
  }

  // ---------------------- FORMATTERS ----------------------
  formatNeg(v: any) {
    if (v === null || v === undefined || v === "-" || v === "") return "-";
    return Number(v);
  }

  // ---------------------- BLUE HEADER STYLE ----------------------
  applyBlueHeader(cell: any) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2A91F0' }
    };
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { right: { style: 'thin' } };
  }

  // ---------------------- GRAY SUBHEADER STYLE ----------------------
  applyGrayHeader(cell: any) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '788494' }
    };
    cell.font = { color: { argb: 'FFFFFF' }, size: 9, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { right: { style: 'thin' } };
  }

  buildFilterSection(ws: any) {
    const f = this.activeFilters();


    ws.addRow([]);
    ws.addRow(["Parts Gross"]).font = { bold: true, size: 14 };
    ws.addRow([new Date().toLocaleString()]);
    ws.addRow([]);


    ws.addRow(["Report Controls :"]).font = { bold: true };


    const groupingText =
      this.selectedDataGrouping?.length
        ? this.selectedDataGrouping.map((g: any) => g.ARG_LABEL).join(", ")
        : "DealerName";

    ws.addRow(["Groupings :", groupingText]);


    ws.addRow([
      "Time Frame :",
      `${f.startdate} to ${f.enddate}`
    ]);

    ws.addRow([]);

    const storeNames =
      this.stores?.length
        ? this.stores.map((s: any) => s.storename).join(", ")
        : "All Stores";

    ws.addRow(["Store :", storeNames]);

    ws.addRow([]);


    // ws.addRow(["Filters :"]).font = { bold: true };

    ws.addRow([
      "Department :",
      this.department?.length ? this.department.join(", ") : "-"
    ]);


    ws.addRow([
      "Sale Type :",
      this.getSaleTypeText()
    ]);

    ws.addRow([
      "Source :",
      this.getPartsSourceText()
    ]);


    ws.addRow([]);


    ws.eachRow((r: any) => {
      r.font = { name: "Arial", size: 10 };
    });
  }

  openDetailsPopup(row: any) {
    //console.log("Clicked Row =", row);

    const filters = this.activeFilters();

    // -------------------------------
    // DETECT PARENT vs CHILD
    // -------------------------------

    const isChild = row.isLayer2 === true;

    // API grouping filters
    const var1 = filters.var1;
    const var2 = filters.var2;

    let var1Value = "";
    let var2Value = "";
    let userName = "";

    if (!isChild) {
      // --------------------------------
      // PARENT ROW CLICKED (Dealer)
      // --------------------------------
      var1Value = row.data1;
      var2Value = "";
      userName = row.data1;
    }
    else {
      // --------------------------------
      // CHILD ROW CLICKED (Advisor)
      // --------------------------------
      // IMPORTANT: parent dealer is attached in MapGlobalData → r.parentVar1Value
      var1Value = row.parentVar1Value;
      var2Value = row.AdvisorName;
      userName = row.AdvisorName;
    }

    // --------------------------------
    // OPEN POPUP
    // --------------------------------
    const ref = this.modalService.open(PartsDetails, {
      size: "xl",
      windowClass: "gross-popup",
      backdrop: "static"
    });

    ref.componentInstance.Servicedetails = [
      {
        StartDate: filters.startdate,
        EndDate: filters.enddate,

        var1: var1,
        var1Value: var1Value,

        var2: var2,
        var2Value: var2Value,

        var3: "",
        var3Value: "",

        userName: userName,

        PaytypeC: filters.Labortype.includes("C"),
        PaytypeW: filters.Labortype.includes("T"),
        PaytypeI: filters.Labortype.includes("I"),
        laborTypes: filters.Labortype,
        Saletype: filters.Saletype,

        DepartmentS: "Service",
        DepartmentP: "Parts",
        DepartmentQ: "",
        DepartmentB: "",
        PolicyAccount: "",
        zeroHours: false,
        SourceBulk: filters.SourceBulk,
        SourceTire: filters.SourceTire,
        SourceWithout: filters.SourceWithout,


      }
    ];
  }

  mapSaleType(code: string) {
    if (!code) return code;

    const map: any = {
      'C': 'Customer Pay',
      'I': 'Internal',
      'R': 'Retail',
      'T': 'Warranty',
      'W': 'Wholesale'
    };

    return map[code] || code;
  }

  LoadGlobalPartsGrossData() {
    this.spinner.show();
    this.Loading.set(true);

    const f = this.activeFilters();

    const baseReq = {
      startdate: f.startdate,
      enddate: f.enddate,
      Store: f.Store.toString(),
      Saletype: f.Saletype,
      Labortype: f.Labortype,
      SourceBulk: f.SourceBulk,
      SourceTire: f.SourceTire,
      SourceWithout: f.SourceWithout,
      dealername: f.dealername,
      Advisorname: f.Advisorname,
      var1: f.var1,
      var2: f.var2,
      var3: f.var3,
      UserID: 0,
      PageNumber: 0,
      PageSize: 200
    };
    console.log(baseReq, 'BAse  request');

    // ------------------  DETAIL (RowType D) ------------------
    const detailReq = { ...baseReq, RowType: "D" };
    this.shared.api.postmethod(this.shared.common.routeEndpoint + 'GetPartsGrossSummaryNewV1', (detailReq)).subscribe({
      next: (res: any) => {
        const detailList = res?.response ?? [];
        this.MainData.set(detailList);
        this.noRecords.set(detailList.length === 0);

        if (detailList.length > 0) {
          this.MapGlobalData(detailList);
        }

        // ------------------  TOTAL (RowType T) ------------------
        const totalReq = { ...baseReq, RowType: "T" };
        this.shared.api.postmethod(this.shared.common.routeEndpoint + 'GetPartsGrossSummaryNewV1', (totalReq)).subscribe({
          next: (res2: any) => {
            const t = res2?.response?.[0] ?? null;

            if (t) {
              this.ServiceTotal.set({
                Sales: t.Total_PartsSale,
                Gross: t.Total_PartsGross,
                Pace: t.Total_PartsGross_Pace,
                Target: t.Total_PartsGrossTarget,
                Diff: t.Total_PartsGross_Diff,

                MechanicalGross: t.ServiceGross,
                MechanicalPace: t.ServiceGross_Pace,
                MechanicalTarget: t.ServiceGross_Target,
                MechanicalDiff: t.ServiceGross_Diff,

                RetailGross: t.PartsGross,
                RetailPace: t.PartsGross_Pace,
                RetailTarget: t.PartsGross_Target,
                RetailDiff: t.PartsGross_Diff,

                TotalRO: t.Parts_RO,
                LostDay: t.Lost_PerDay,
                GPPercent: t.Retention
              });
            }

            this.Loading.set(false);
            this.spinner.hide();

            // Load Next Tabs
            // this.LoadServiceGrossData();
            // this.LoadPartsGrossData();
          },

          error: () => {
            this.Loading.set(false);
            this.spinner.hide()
          }
        });
      },

      error: () => {
        this.Loading.set(false);
      }
    });
  }
}
