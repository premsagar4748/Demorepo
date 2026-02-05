import { Component, EventEmitter, HostListener, inject, OnInit, Output, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { forkJoin, firstValueFrom } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Sharedservice } from '../../../../Core/Providers/Shared/sharedservice';
import { SharedModule } from '../../../../Core/Providers/Shared/shared.module';
import { PartsopenroReport } from '../partsopenro-report/partsopenro-report';
import { PartsopenrosDetails } from '../partsopenros-details/partsopenros-details';
import { Title } from '@angular/platform-browser';
import { common } from '../../../../common';
import { Workbook } from 'exceljs';
import * as FileSaver from 'file-saver';
import { DatePipe } from '@angular/common';
import { group } from 'console';
// import saveAs from 'file-saver';
// import { SidebarService } from '../../../../core/sidebar.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule, NgxSpinnerModule, SharedModule, PartsopenrosDetails, PartsopenroReport],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  providers: [DatePipe]
})
export class Dashboard implements OnInit {

  Store: any[] = [];
  FromDate: any = '';
  ToDate: any = '';
  DateType = 'MTD';
  displaytime = '';
  selectedSaleTypes: string[] = [];
  selectedDep: string[] = [];


  selectedDepartment = '';
  selectedDealer = '';
  selectedAdvisor = '';
  selectedLaborTypes: string[] = [];
  selectedSortBy = { column: 'DealerName', direction: 'asc' as 'asc' | 'desc' };
  selectedRowType = 'T';
  minAge = '0';
  maxAge = '1000';
  includeOldRO = false;
  selectedGrouping: any[] = [];
  selectedGroupingLabel: string | null = null;
  expandedRow: number | null = null;
  searchText: string = '';
  minValue = 1;
  maxValue = 1000;
  rangeStyle: any = {};
  groupings: any[] = [];
  currentMonth = '';
  currentDateRange = ''
  payloadObject: any = {
    startdate: '',
    enddate: '',
    dealername: '',
    Advisorname: '',
    Store: '',
    Labortype: 'Customer Pay,Warranty,Internal',
    Saletype: 'Counter Retail,Wholesale,Customer Pay,Warranty,Internal',
    var1: 'DealerName',
    var2: '',
    var3: '',
    UserID: '0',
    minage: '0',
    maxage: '1000',
    Oldro: '',
    RowType: ''
  };;

  isLoading = signal(false);
  today = new Date();

  monthStart = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
  yesterday = new Date(this.today.getTime() - (24 * 60 * 60 * 1000));

  activeFilters: any = {
    startdate: this.formatDate(this.monthStart),
    enddate: this.formatDate(this.yesterday),
    Store: '',
    SaleType: '',
    type: '',
    Report: '',
    var1: '',
    var2: '',
    var3: '',
    "groups": 8,
    "datetype": this.DateType
  };
  showCommentModal = false;
  isAddingComment = false;
  newComment = '';
  modalTop = 0;
  modalLeft = 0;
  currentRow: any;
  expandedChildRow: any = { index: null, childIndex: null };
  selectedChild: any = null;
  expandedParentRow: number | null = null;
  selectedParentDetails: any;
  selectedChildDetails: any = null;
  reportPosition: 'T' | 'B' = 'T';
  SalesTypes: string[] = [];
  title = inject(Title);
  common = inject(common);

  // signals for rows
  filteredRows = signal<any[]>([]);
  dealerRows = signal<any[]>([]);
  reportTotals = signal<any[]>([]);
  responseStatus = ''; // 'I', 'T', or 'IT'

  constructor(
    public shared: Sharedservice,
    private modal: NgbModal,
    private spinner: NgxSpinnerService,
    private datepipe: DatePipe,
  ) {
    this.payloadObject = {
      startdate: this.formatDate(this.monthStart),
      enddate: this.formatDate(this.yesterday),
      dealername: '',
      Advisorname: '',
      Store: '',
      Labortype: 'Customer Pay,Warranty,Internal',
      Saletype: 'Counter Retail,Wholesale,Customer Pay,Warranty,Internal',
      var1: 'DealerName',
      var2: '',
      var3: '',
      UserID: '0',
      minage: '0',
      maxage: '1000',
      Oldro: '',
      RowType: ''
    };

    this.title.setTitle(this.common.titleName + '-Parts Open Ro');
    let obj = { title: 'PARTS OPEN RO' };
    this.shared.api.SetHeaderData({ obj });
  }

  isSidebarCollapsed = signal<boolean>(true);
  async ngOnInit() {
    this.initializeDefaultFilters();
    this.FromDate = this.activeFilters.startdate;
    this.ToDate = this.activeFilters.enddate;
    this.setCurrentMonthAndRange();

    await this.getPartsGrossSummary();

    // Expand first dealer row if any
    setTimeout(() => {
      const rows = this.filteredRows();
      if (rows.length) {
        const firstDealerIndex = rows.findIndex((r: { isTotal: any; }) => !r.isTotal);
        if (firstDealerIndex !== -1) {
          this.expandedRow = firstDealerIndex;
        }
      }
    });

    // this.sidebarService.isCollapsed$.subscribe(collapsed => {
    //   this.isSidebarCollapsed.set(collapsed);
    // });
  }

  ngAfterViewInit() {
    this.shared.api.getExportToExcelAllReports().subscribe((res: { obj: { state: boolean; title: string; }; }) => {
      if (res?.obj?.title === 'PARTS OPEN RO' && res?.obj?.state === true) {
        // this.exportToExcel();
      }
    });
  }
  initializeDefaultFilters() {
    return {
      startdate: this.formatDate(this.monthStart),
      enddate: this.formatDate(this.yesterday),
      Report: 'B',
      Store: null,
      SaleType: null,
      Department: null,
      Search: ''
    };
  }

  // initializeDefaultFilters() {
  //   this.activeFilters = {
  //     startdate: this.formatDate(this.monthStart),
  //     enddate: this.formatDate(this.yesterday),
  //     Report: 'B',
  //     Store: null,
  //     SaleType: null,
  //     Department: null,
  //     Search: ''
  //   };
  // }

  onParentClick(row: any, index: number) {
    if (row.isTotal) return;  // block total row

    // direct open logic
    this.openParentDetails(row, index);
  }

  openParentDetails(row: any, index: number) {
    // same logic you used inside toggleParent earlier
    if (!row.childrenLoaded) {
      this.loadChildDetails(row, index); // API call or mapping
    }

    row.expanded = !row.expanded;   // expand/collapse UI
  }

  private toApiDate(value: string | Date | undefined | null): string {
    if (!value) return '';
    const d = (value instanceof Date) ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}-${dd}-${yyyy}`;
  }

  private formatDate(d: Date) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  updateHeaderText() {
    const from = this.FromDate ? new Date(this.FromDate) : new Date(this.monthStart);
    const to = this.ToDate ? new Date(this.ToDate) : new Date(this.yesterday);

    const monthName = from.toLocaleString('default', { month: 'long' });
    this.currentMonth = `${monthName} ${from.getFullYear()}`;

    const fmt = (d: Date) => {
      if (!d || isNaN(d.getTime())) return '';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${mm}-${dd}-${yyyy}`;
    };

    // this.currentDateRange = `${fmt(from)} to ${fmt(to)}`;
    this.getShowDates(from, to);
  }

  setCurrentMonthAndRange() {
    const from = this.FromDate ? new Date(this.FromDate) : this.monthStart;
    const to = this.ToDate ? new Date(this.ToDate) : this.today;

    const safeFrom = isNaN(from.getTime()) ? this.monthStart : from;
    const safeTo = isNaN(to.getTime()) ? this.today : to;

    const monthName = safeFrom.toLocaleString('default', { month: 'long' });
    const dd = (d: Date) => d.getDate().toString().padStart(2, '0');

    // this.currentDateRange = `${monthName}: ${dd(safeFrom)}–${dd(safeTo)}, ${safeFrom.getFullYear()}`;
    this.getShowDates(safeFrom, safeTo);
  }

  getShowDates(from: any, to: any) {
    let dates: any;
    let month: any, date: any, year: any;
    // console.log(this.filterData);
    if (from != '') {
      if (this.datepipe.transform(from, 'MMMM') != this.datepipe.transform(to, 'MMMM')) {
        month = this.datepipe.transform(from, 'MMMM') + ' - ' + this.datepipe.transform(to, 'MMMM');
      } else {
        month = this.datepipe.transform(from, 'MMMM')
      }

      if (this.datepipe.transform(from, 'yyyy') != this.datepipe.transform(to, 'yyyy')) {
        date = this.datepipe.transform(from, 'dd') + ', ' + this.datepipe.transform(to, 'yyyy') + ' - ' +
          this.datepipe.transform(to, 'dd') + ', ' + this.datepipe.transform(to, 'yyyy');
      } else {
        date = this.datepipe.transform(from, 'dd') + ' - ' + this.datepipe.transform(to, 'dd') + ', ' +
          this.datepipe.transform(from, 'yyyy')
      }
      // console.log(dates = month + ': ' + date);
      dates = month + ': ' + date;
      this.currentDateRange = dates;
    } else {
      this.currentDateRange = 'All Open ROs';
    }
    // console.log('Showing Date : ', this.showDate());
  }

  updatePayloadWithFilters(f: any) {
    // console.log('filters Data : ', f);
    this.payloadObject.startdate = f.startdate;
    this.payloadObject.enddate = f.enddate;
    this.payloadObject.Store = f.Store ?? '';
    this.payloadObject.Saletype = f.SaleType ?? '';
    this.payloadObject.Department = f.Department ?? '';
    this.payloadObject.Report = f.Report ?? this.reportPosition;
    this.payloadObject.RowType = '';
    this.payloadObject.var1 = f.var1 ?? '';
    this.payloadObject.var2 = f.var2 ?? '';
    this.payloadObject.var3 = f.var3 ?? '';
  }

  onFilterApplied(data: any) {
    this.spinner.show();
    try {
      // Merge only provided filters, keep existing defaults if missing
      this.activeFilters = {
        ...this.activeFilters,  // keep previous defaults
        ...data                 // overwrite with newly selected values
      };

      // Update report position
      this.reportPosition = this.activeFilters.Report ?? 'T';

      // Update payload for backend API
      this.updatePayloadWithFilters(this.activeFilters);

      // Update UI dates
      this.FromDate = this.activeFilters.startdate;
      this.ToDate = this.activeFilters.enddate;

      this.setCurrentMonthAndRange();

      this.getPartsGrossSummary().finally(() => {
        this.spinner.hide();
      });
    } catch (err) {
      console.error(err);
      this.spinner.hide();
    }

    // Reset expanded rows
    this.expandedRow = null;
    this.expandedParentRow = null;
    this.expandedChildRow = { index: null, childIndex: null };
    this.selectedParentDetails = null;
    this.selectedChildDetails = null;
  }





  /* ---------------------------
      TEXT CLICK = SHOW PARENT DETAILS
  ----------------------------- */
  onParentTextClick(row: any, i: number) {
    // Prevent showing details for TOTAL rows
    if (row.isTotal || row.data1 === 'REPORT TOTALS') return;

    // Collapse child expand if open
    this.expandedRow = null;
    this.expandedChildRow = { index: null, childIndex: null };
    this.selectedChildDetails = null;

    // Toggle parent details
    if (this.expandedParentRow === i) {
      // Already open → close it
      this.expandedParentRow = null;
      this.selectedParentDetails = null;
      return;
    }

    // Fetch details for this parent
    this.expandedParentRow = i;
    this.getParentDetails(row);
  }

  /* ---------------------------
      ICON CLICK = EXPAND/COLLAPSE CHILDREN
  ----------------------------- */
  onExpandIconClick(row: any, i: number, event: Event) {
    event.stopPropagation();

    if (!row.children?.length) return; // no children → do nothing

    // collapse parent details when expanding children
    this.expandedParentRow = null;
    this.selectedParentDetails = null;

    // Toggle children expansion
    this.expandedRow = this.expandedRow === i ? null : i;
  }

  /* ---------------------------
      OPEN CHILD DETAILS
  ----------------------------- */
  toggleChildExpand(event: any, i: number, j: number, child: any) {
    event.stopPropagation();

    // If already open → close
    if (this.expandedChildRow.index === i && this.expandedChildRow.childIndex === j) {
      this.expandedChildRow = { index: null, childIndex: null };
      this.selectedChildDetails = null;
      return;
    }

    // Open child details
    this.expandedChildRow = { index: i, childIndex: j };
    this.selectedChildDetails = child;

    // Close parent details if open
    this.expandedParentRow = null;
    this.selectedParentDetails = null;

    this.getChildDetails(child);
  }

  /* ---------------------------
      API CALLS
  ----------------------------- */
  getParentDetails(row: any) {
    // Your API Call
    this.selectedParentDetails = row;
  }

  getChildDetails(child: any) {
    // Your API Call
    this.selectedChildDetails = child;
  }

  toggleParent(index: number, row: any, event: Event) {
    event.stopPropagation();

    const hasChild = (row?.children?.length ?? 0) > 0;

    // If the same parent is clicked again → collapse (works even for index 0)
    if (this.expandedRow === index) {
      this.expandedRow = null;
      this.expandedParentRow = null;
      this.selectedParentDetails = null;

      // Also reset any child expansion for that parent
      this.expandedChildRow = { index: null, childIndex: null };
      this.selectedChildDetails = null;
      return;
    }

    // Expand parent
    this.expandedRow = index;
    this.expandedParentRow = index;

    // Reset child state (so parent details can show cleanly)
    this.expandedChildRow = { index: null, childIndex: null };
    this.selectedChildDetails = null;

    // Show parent details immediately on expand
    // If your intended behavior is to show parent details only when no children exist,
    // swap the condition below.
    this.selectedParentDetails = row;

    // If you want: show parent details only when NO children:
    // this.selectedParentDetails = hasChild ? null : row;
  }

  toggleRow(i: number, event: Event) {
    event.stopPropagation(); // <--- IMPORTANT (prevents double-trigger)

    if (this.expandedRow === i) {
      this.expandedRow = null;
    } else {
      this.expandedRow = i;
    }
  }



  async getPartsGrossSummary() {
    this.spinner.show();
    try {
      this.responseStatus = '';
      console.log(this.payloadObject);
      const types = this.payloadObject.Saletype;
      const typesL = this.payloadObject.Labortype;
      if (types != '') {
        const stypes = types.split(',');
        const ltypes = typesL.split(',');
        const saleType = [
          stypes.includes('Counter Retail') ? 'R' : '',
          stypes.includes('Wholesale') ? 'W' : '',
          stypes.includes('Customer Pay') ? '' : '',
          stypes.includes('Warranty') ? '' : '',
          stypes.includes('Internal') ? '' : '',
        ];
        const laborType = [
          stypes.includes('Counter Retail') ? '' : '',
          stypes.includes('Wholesale') ? '' : '',
          stypes.includes('Customer Pay') ? 'C' : '',
          stypes.includes('Warranty') ? 'T' : '',
          stypes.includes('Internal') ? 'I' : '',
        ];
        const result = saleType.filter(x => x && x.toString().trim() !== '');
        const result1 = laborType.filter(x => x && x.toString().trim() !== '');
        this.payloadObject.Saletype = result.toString();
        this.payloadObject.Labortype = result1.toString();
      }
      const basePayload = { ...this.payloadObject };
      basePayload.startdate = this.toApiDate(basePayload.startdate);
      basePayload.enddate = this.toApiDate(basePayload.enddate);

      const payloadD = { ...basePayload, RowType: 'D' };
      const payloadT = { ...basePayload, RowType: 'T' };

      const responses: any = await firstValueFrom(
        forkJoin({
          dealer: this.shared.api.postmethod(this.shared.common.routeEndpoint + 'GetPartsGrossSummaryOpen', payloadD),
          totals: this.shared.api.postmethod(this.shared.common.routeEndpoint + 'GetPartsGrossSummaryOpen', payloadT)
        })
      );

      // console.log('API responses:', responses);

      // Dealer Rows
      if (responses.dealer?.status === 200 && Array.isArray(responses.dealer?.response) && responses.dealer.response.length) {
        const dealersWithChildren = responses.dealer.response.map((r: any) => {
          let children: any[] = [];
          if (r.data2) {
            try {
              children = JSON.parse(r.data2);
            } catch (err) {
              console.error('Error parsing children JSON for', r.data1, err);
            }
          }
          return { ...r, isTotal: false, children };
        });

        this.dealerRows.set(dealersWithChildren);
        this.responseStatus += 'I';
      } else {
        this.dealerRows.set([]);
      }

      // Totals
      if (responses.totals?.status === 200 && Array.isArray(responses.totals?.response) && responses.totals.response.length) {
        this.reportTotals.set(
          responses.totals.response.map((r: any) => ({
            ...r,
            isTotal: true,
            data1: 'REPORT TOTALS'
          }))
        );
        this.responseStatus += 'T';
      } else {
        this.reportTotals.set([]);
      }

      // Combine dealer and totals
      this.combineDealerAndTotals();
    } catch (err) {
      console.error('API ERROR:', err);
    } finally {
      this.spinner.hide();
    }
  }

  combineDealerAndTotals() {
    const dealer = this.dealerRows();
    const totals = this.reportTotals();
    let combined: any[] = [];

    if (this.responseStatus.includes('I') && this.responseStatus.includes('T')) {
      combined = this.reportPosition === 'B' ? [...dealer, ...totals] : [...totals, ...dealer];
    } else if (this.responseStatus === 'I') {
      combined = dealer;
    } else if (this.responseStatus === 'T') {
      combined = totals;
    }

    // Step 1: SET the rows
    this.filteredRows.set(combined);

    // Step 2: Wait for Angular signals to fully update
    queueMicrotask(() => {

      // Step 3: Apply filters after rows are ready
      this.applyFilters();

      // Step 4: Auto expand first dealer row only after data is ready
      const updated = this.filteredRows();
      const firstDealerIndex = updated.findIndex((r: { isTotal: any; }) => !r.isTotal);

      if (firstDealerIndex !== -1) {
        this.expandedRow = firstDealerIndex;
        this.expandedChildRow = { index: null, childIndex: null };
      } else {
        this.expandedRow = null;
        this.expandedChildRow = { index: null, childIndex: null };
      }

    });
  }


  applyFilters() {
    let filtered = [...this.filteredRows()];

    // console.log('applyFiltersToDealerRows — starting rows:', filtered.length, 'activeFilters:', this.activeFilters);

    if (!filtered || filtered.length === 0) {
      this.filteredRows.set([]);
      // console.log('filteredRows', []);
      return;
    }

    const sample = filtered[0];

    if (this.activeFilters?.Department) {
      const deptCodes = this.activeFilters.Department
        .toString()
        .split(',')
        .map((s: string) => s.trim().toUpperCase())
        .filter((s: string) => s.length);

      const deptField = ['Department', 'Dept', 'DepartmentCode', 'RODept', 'RO_Type'].find(f => f in sample);

      if (deptField && deptCodes.length) {
        filtered = filtered.filter(r => {
          const rowDept = (r[deptField] ?? '').toString().toUpperCase();
          return rowDept && deptCodes.includes(rowDept);
        });
        // console.log('after Department filter ->', filtered.length);
      } else {
        console.log('Department filter skipped — no department field on rows');
      }
    }

    if (this.activeFilters?.SaleType) {
      const saleTypes = this.activeFilters.SaleType
        .toString()
        .split(',')
        .map((s: string) => s.trim().toUpperCase())
        .filter((s: string) => s.length);

      const saleCandidates = ['SaleType', 'ASG_Subtype_Detail', 'ASG_Subtype_Detail_Label', 'Sale_Type', 'AP_PARTS_TYPE', 'SubType'];
      const presentCandidate = saleCandidates.find(f => f in sample);

      if (presentCandidate && saleTypes.length) {
        filtered = filtered.filter(r => {
          const candidates = saleCandidates.map((f: string) => (r[f] ?? '').toString().toUpperCase());
          return candidates.some(c => c && saleTypes.includes(c));
        });
        // console.log('after SaleType filter ->', filtered.length);
      } else {
        // console.log('SaleType filter skipped — no sale-type fields on rows');
      }
    }

    const storeCsv = (this.activeFilters?.Store ?? '');
    if (storeCsv && storeCsv.toString().trim() !== '') {
      const storeIds = storeCsv.toString().split(',').map((s: string) => s.trim()).filter((s: string) => s.length);
      if (storeIds.length) {
        const storeField = ['Store', 'StoreID', 'ID', 'DealerID', 'Store_Code'].find(f => f in sample);

        if (storeField) {
          filtered = filtered.filter(r => {
            const rid = (r[storeField] ?? '').toString();
            return rid && storeIds.includes(rid);
          });
          // console.log('after Store filter ->', filtered.length);
        } else {
          // console.log('Store filter skipped — no store-like field on rows');
        }
      }
    }

    this.filteredRows.set(filtered);
    // console.log('filteredRows', filtered);
  }

  openCommentModal(event: Event, rowData: any) {
    // event.stopPropagation();

    // const modalRef = this.modal.open(Notes, {
    //   size: 'lg',
    //   backdrop: 'static'
    // });

    // modalRef.componentInstance.notesData = {
    //   apiRoute: 'AddNotesAction',
    //   mainkey: rowData.data1,
    //   store: rowData.Store ?? rowData.StoreID,
    //   title1: rowData.Title,
    //   module: rowData.Module
    // };

    // modalRef.componentInstance.onClose.subscribe((res: string) => {
    //   if (res === 'S') {
    //     console.log('Notes saved successfully');
    //   }
    //   modalRef.close();
    // });
  }

  onChildDataLoaded(data: any) {
    // console.log('Child details loaded: ', data);
  }

  loadChildDetails(child: any, i?: any, j?: any) {
    // console.log('Child details clicked:', child);
  }






  toggleParentDetails(event: any, index: number, row: any) {
    event.stopPropagation();

    const hasChild = row.children?.length > 0;
    const isSameRow = this.expandedRow === index;
    // console.log('index', index)

    // Reset child
    this.expandedChildRow = { index: null, childIndex: null };
    this.selectedChildDetails = null;

    if (isSameRow) {
      // Collapse
      this.expandedRow = null;
      this.expandedParentRow = null;
      this.selectedParentDetails = null;
    } else {
      // Expand
      this.expandedRow = index;
      this.expandedParentRow = index;

      if (hasChild) {
        // Do not show parent details when child rows exist
        this.selectedParentDetails = null;
      } else {
        // Only for parents without children
        this.selectedParentDetails = row;
      }
    }
  }

  sort(column: string) {
    if (!column) return;
    if (this.selectedSortBy.column === column) {
      this.selectedSortBy.direction = this.selectedSortBy.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.selectedSortBy.column = column;
      this.selectedSortBy.direction = 'asc';
    }

    // Apply simple client-side sort if rows exist
    const rows = [...this.filteredRows()];
    if (!rows || !rows.length) return;

    const dir = this.selectedSortBy.direction === 'asc' ? 1 : -1;
    rows.sort((a: any, b: any) => {
      const av = a[this.selectedSortBy.column] ?? '';
      const bv = b[this.selectedSortBy.column] ?? '';
      if (!isNaN(Number(av)) && !isNaN(Number(bv))) {
        return (Number(av) - Number(bv)) * dir;
      }
      return av.toString().localeCompare(bv.toString()) * dir;
    });

    this.filteredRows.set(rows);
  }
  sortedStores = signal<any[]>([]);
  selectedStores = signal<any[]>([]);

  userInfo: any; userId = signal<any>('');

  async getStoreList(): Promise<void> {
    const obj = { userid: this.userId() };
    try {
      const res: any = await firstValueFrom(this.shared.api.postmethod(this.shared.common.routeEndpoint + 'GetStoresList', obj));
      if (res.status === 200) {
        this.sortedStores.set(res.response);
        this.selectedStores.set(this.sortedStores().map((val: any) => val.ID));
      } else {
        this.sortedStores.set([]);
        this.selectedStores.set([]);
      }
    } catch {
      this.sortedStores.set([]);
      this.selectedStores.set([]);
    }
  }

  // async exportToExcel() {
  //   const workbook = new Workbook();
  //   const worksheet = workbook.addWorksheet('Parts OpenRO', { views: [{ showGridLines: false }] });

  //   // ---------- Styles ----------
  //   const headerBlue = 'FF1A73E8';
  //   const headerStyle = {
  //     font: { bold: true, name: 'Arial', size: 10, color: { argb: 'FFFFFFFF' } },
  //     alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  //     fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBlue } },
  //     border: {
  //       top: { style: 'thin' }, left: { style: 'thin' },
  //       bottom: { style: 'thin' }, right: { style: 'thin' }
  //     }
  //   };
  //   const groupHeaderStyle = { ...headerStyle, font: { ...headerStyle.font, size: 11 } };
  //   const dataStyleFn = (align: 'left' | 'center' = 'center', indent = 0) => ({
  //     font: { name: 'Arial', size: 9 },
  //     alignment: { horizontal: align, vertical: 'middle', indent, wrapText: false },
  //     border: {
  //       top: { style: 'thin' }, left: { style: 'thin' },
  //       bottom: { style: 'thin' }, right: { style: 'thin' }
  //     }
  //   });

  //   const safe = (v: any) => (v === null || v === undefined || v === '' ? '-' : v);

  //   // ---------- TITLE ----------
  //   worksheet.addRow([]);
  //   const titleRow = worksheet.addRow(['Parts OpenRO']);
  //   worksheet.mergeCells(`A2:W2`);
  //   Object.assign(titleRow.getCell(1), { font: { name: 'Arial', size: 14, bold: true } });
  //   worksheet.addRow([]);
  //   worksheet.addRow([]);

  //   // ---------- FILTERS ----------
  //   const af = this.activeFilters && Object.keys(this.activeFilters).length
  //     ? this.activeFilters
  //     : { ...this.initializeDefaultFilters(), ...this.activeFilters };

  //   const firstRow = (this.filteredRows() || []).find((r: { data1: string; }) => r.data1 !== "REPORT TOTALS");

  //   // ---------- TIME FRAME ----------
  //   const timeFrame = af.startdate && af.enddate
  //     ? `${af.startdate} to ${af.enddate}`
  //     : firstRow ? `${this.formatDate(this.monthStart)} to ${this.formatDate(this.yesterday)}` : '-';

  //   // ---------- STORES ----------
  //   let storeNames = "-";
  //   const selectedStoreIds = Array.isArray(af.Store)
  //     ? af.Store
  //     : af.Store
  //       ? [af.Store]
  //       : [];

  //   if (selectedStoreIds.length) {
  //     storeNames = selectedStoreIds
  //       .map((id: any) => this.sortedStores().find((s: any) => s.ID == id)?.StoreName || id)
  //       .join(", ");
  //   } else if (firstRow?.data1) {
  //     const storeObj = this.sortedStores().find((s: any) => s.ID == firstRow.data1 || s.StoreNumber == firstRow.data1);
  //     storeNames = storeObj?.StoreName || firstRow.data1;
  //   }

  //   // ---------- DEPARTMENTS ----------
  //   const deptMap: any = { P: "Parts", S: "Service", "P,S": "Parts, Service" };
  //   let departments = "-";
  //   if (af.Department && (Array.isArray(af.Department) ? af.Department.length > 0 : true)) {
  //     departments = Array.isArray(af.Department)
  //       ? af.Department.map((d: string | number) => deptMap[d] || d).join(", ")
  //       : deptMap[af.Department] || af.Department;
  //   } else if (firstRow) {
  //     const deptField = ['Department', 'Dept', 'DepartmentCode', 'RODept', 'RO_Type']
  //       .find(f => f in firstRow && firstRow[f]);
  //     departments = deptField ? (deptMap[firstRow[deptField]] || firstRow[deptField]) : '-';
  //   }

  //   // ---------- SALE TYPES ----------
  //   let saleTypes = "-";
  //   if (af.SaleType && (Array.isArray(af.SaleType) ? af.SaleType.length > 0 : true)) {
  //     saleTypes = Array.isArray(af.SaleType) ? af.SaleType.join(', ') : af.SaleType;
  //   } else if (firstRow) {
  //     const saleField = ['SaleType', 'ASG_Subtype_Detail', 'ASG_Subtype_Detail_Label', 'Sale_Type', 'AP_PARTS_TYPE', 'SubType']
  //       .find(f => f in firstRow && firstRow[f]);
  //     saleTypes = saleField ? firstRow[saleField] : '-';
  //   }

  //   // ---------- GROUPING ----------
  //   let grouping = "-";
  //   if (af.GroupingNames && (Array.isArray(af.GroupingNames) ? af.GroupingNames.length > 0 : true)) {
  //     grouping = Array.isArray(af.GroupingNames) ? af.GroupingNames.join(', ') : af.GroupingNames;
  //   } else if (firstRow) {
  //     const groupFields = ['var1', 'var2', 'var3'];
  //     grouping = groupFields
  //       .map(f => firstRow[f])
  //       .filter(v => v !== null && v !== undefined && v !== '')
  //       .join(', ') || '-';
  //   }

  //   // ---------- REPORT TOTALS ----------
  //   const reportTotalMap: any = { T: "Top", B: "Bottom" };
  //   const reportsTotal = af.Report ? reportTotalMap[af.Report] || af.Report : 'Top';

  //   // ---------- AGE RANGE ----------
  //   const ageRange = `${af.AgeFrom ?? this.minAge} - ${af.AgeTo ?? this.maxAge}`;

  //   // ---------- ADD FILTERS TO EXCEL ----------
  //   const filters = [
  //     ['Time Frame', timeFrame],
  //     ['Store', storeNames],
  //     ['Departments', departments],
  //     ['Sale Types', saleTypes],
  //     ['REPORT TOTALS', reportsTotal],
  //     ['Age Range', ageRange],
  //     ['Grouping', grouping]
  //   ];

  //   filters.forEach(f => {
  //     const rr = worksheet.addRow(f);
  //     rr.getCell(1).font = { bold: true, name: 'Arial', size: 9 };
  //     rr.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
  //   });

  //   worksheet.addRow([]); // blank row before table header

  //   // ---------- HEADER GROUP ----------
  //   const headerGroupRowNumber = (worksheet.lastRow?.number ?? 0) + 1;
  //   const headerGroupRow = worksheet.addRow([
  //     this.currentDateRange || '', 'Total Parts', '', '', '', '', '', '', '', '', '', '',
  //     'Mechanical', '', '', '', 'Retail / Wholesale', '', '', '', 'Performance', '', ''
  //   ]);
  //   worksheet.mergeCells(`B${headerGroupRowNumber}:L${headerGroupRowNumber}`);
  //   worksheet.mergeCells(`M${headerGroupRowNumber}:P${headerGroupRowNumber}`);
  //   worksheet.mergeCells(`Q${headerGroupRowNumber}:T${headerGroupRowNumber}`);
  //   worksheet.mergeCells(`U${headerGroupRowNumber}:W${headerGroupRowNumber}`);
  //   headerGroupRow.eachCell((cell: any) => Object.assign(cell, groupHeaderStyle));
  //   headerGroupRow.height = 22;

  //   // ---------- DETAILED HEADER ----------
  //   const headerRow = worksheet.addRow([
  //     '', 'Quantity', 'Sales', 'Discounts',
  //     '0–3 Days\nQty – Gross', '4–10 Days\nQty – Gross', '11–30 Days\nQty – Gross', '30+ Days\nQty – Gross',
  //     'Total Gross', 'Pace', 'Target', 'Diff',
  //     'Mech Gross', 'Mech Pace', 'Mech Target', 'Mech Diff',
  //     'Retail Gross', 'Retail Pace', 'Retail Target', 'Retail Diff',
  //     'Parts/RO', 'Lost/Day', 'GP %'
  //   ]);
  //   headerRow.eachCell((cell: { fill: { type: string; pattern: string; fgColor: { argb: string; }; }; font: { bold: boolean; name: string; size: number; }; alignment: { horizontal: string; vertical: string; wrapText: boolean; }; }) => {
  //     cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
  //     cell.font = { bold: true, name: 'Arial', size: 10 };
  //     cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  //   });
  //   headerRow.height = 36;
  //   worksheet.columns = Array.from({ length: 23 }).map(() => ({ width: 18 }));

  //   // ---------- DATA ROWS ----------
  //   const rows = this.filteredRows() || [];
  //   const toInt = (v: any) => { const n = Number(v); return isNaN(n) ? null : Math.round(n); };
  //   const fmt = (v: any) => { const n = toInt(v); return n === null ? '-' : n.toLocaleString('en-US'); };
  //   const money = (v: any) => { const n = toInt(v); return n === null ? '-' : `$${n.toLocaleString('en-US')}`; };

  //   const addDataRow = (r: any, indent = 0, isAlt = false, isTotal = false) => {
  //     const firstCol = indent > 0 ? safe(r.data2 ?? r.name ?? r.label ?? r.data1) : safe(r.data1 ?? r.data2 ?? r.name ?? r.label);
  //     const vals = [
  //       indent > 0 ? '  ' + firstCol : firstCol,
  //       fmt(r.Total_Quantity),
  //       r.Total_PartsSale > 0 ? money(r.Total_PartsSale) : '-', '-',
  //       r['0TO3QTY'] > 0 ? `${fmt(r['0TO3QTY'])} - ${money(r['0TO3'])}` : '-',
  //       r['4TO10QTY'] > 0 ? `${fmt(r['4TO10QTY'])} - ${money(r['4TO10'])}` : '-',
  //       r['11TO30QTY'] > 0 ? `${fmt(r['11TO30QTY'])} - ${money(r['11TO30'])}` : '-',
  //       r['30ABOVEQTY'] > 0 ? `${fmt(r['30ABOVEQTY'])} - ${money(r['30ABOVE'])}` : '-',
  //       r.Total_PartsGross > 0 ? money(r.Total_PartsGross) : '-',
  //       r.Total_PartsGross_Pace > 0 ? money(r.Total_PartsGross_Pace) : '-',
  //       r.Total_PartsGrossTarget > 0 ? money(r.Total_PartsGrossTarget) : '-',
  //       r.Total_PartsGross_Diff > 0 ? money(r.Total_PartsGross_Diff) : '-',
  //       r.ServiceGross > 0 ? money(r.ServiceGross) : '-',
  //       r.ServiceGross_Pace > 0 ? money(r.ServiceGross_Pace) : '-',
  //       r.ServiceGross_Target > 0 ? money(r.ServiceGross_Target) : '-',
  //       r.ServiceGross_Diff > 0 ? money(r.ServiceGross_Diff) : '-',
  //       r.PartsGross > 0 ? money(r.PartsGross) : '-',
  //       r.PartsGross_Pace > 0 ? money(r.PartsGross_Pace) : '-',
  //       r.PartsGross_Target > 0 ? money(r.PartsGross_Target) : '-',
  //       r.PartsGross_Diff > 0 ? money(r.PartsGross_Diff) : '-',
  //       r.Parts_RO || '-', r.Lost_PerDay || '-', r.Retention > 0 ? `${fmt(r.Retention)}%` : '-'
  //     ];

  //     const excelRow = worksheet.addRow(vals);
  //     excelRow.eachCell((cell: { font: { bold: boolean; name: string; size: number; }; }, colNumber: number) => {
  //       Object.assign(cell, dataStyleFn(colNumber === 1 ? 'left' : 'center', indent > 0 ? 1 : 0));
  //       if (isTotal) cell.font = { bold: true, name: 'Arial', size: 9 };
  //     });
  //   };

  //   rows.forEach((r: any, i: number) => {
  //     const isTotalRow = r.data1 === 'REPORT TOTALS';
  //     addDataRow(r, 0, i % 2 === 1, isTotalRow);
  //     if (Array.isArray(r.children) && r.children.length) {
  //       r.children.forEach((child: any, j: number) => {
  //         addDataRow({ ...child, data2: child.data2 ?? child.name ?? child.label ?? '' }, 1, (i + j) % 2 === 0, false);
  //       });
  //     }
  //   });

  //   // ---------- AUTO WIDTH ----------
  //   worksheet.columns.forEach((col: any) => {
  //     let maxLength = 12;
  //     col.eachCell({ includeEmpty: true }, (cell: any) => {
  //       let cellValue = cell.value;
  //       if (cellValue && typeof cellValue === 'object') {
  //         if (cellValue.richText) cellValue = cellValue.richText.map((t: any) => t.text).join('');
  //         else if (cellValue.formula) cellValue = cellValue.result?.toString() || cellValue.formula;
  //         else if (cellValue.text) cellValue = cellValue.text;
  //         else cellValue = cellValue.toString ? cellValue.toString() : '';
  //       }
  //       if (cellValue == null) cellValue = '';
  //       maxLength = Math.max(maxLength, cellValue.toString().length);
  //     });
  //     col.width = Math.min(Math.max(maxLength + 2, 12), 60);
  //   });

  //   worksheet.views = [{ showGridLines: false, xSplit: 0, ySplit: headerRow.number }];

  //   // ---------- EXPORT ----------
  //   const buffer = await workbook.xlsx.writeBuffer();
  //   const fileName = `Parts_OpenRO_${new Date().toISOString().replace(/[-:.]/g, '')}.xlsx`;
  //   FileSaver.saveAs(new Blob([buffer]), fileName);
  // }



}
