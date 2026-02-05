import { DatePipe, NgStyle } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, inject, Input, Output, Renderer2, signal, SimpleChanges } from '@angular/core';
// import { ToastrService } from 'ngx-toastr';

import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { NgxSliderModule, Options } from "@angular-slider/ngx-slider";
import { Sharedservice } from '../../../../Core/Providers/Shared/sharedservice';
import { Stores } from '../../../../CommonFilters/stores/stores';

@Component({
  selector: 'app-partsopenro-report',
  standalone: true,
  imports: [BsDatepickerModule, DatePipe, NgxSliderModule,Stores,NgStyle],
  providers: [DatePipe],
  templateUrl: './partsopenro-report.html',
  styleUrl: './partsopenro-report.scss',
})
export class PartsopenroReport {
  sortedGroups: any = [];
  userInfo: any; userId = signal<any>('');
  activePopover: number = -1;
  ToDate: any;
  FromDate: any;
  month: any;
  StoreValues: any = ''
  sortedStores: any = [];
  selectedStores: any = [];
  custom = signal<boolean>(false);
  DateType = signal<string>('MTD');
  SalesTypes = signal<any>([])
  isCalendarOpen = signal<boolean>(false);
  bsDateRange!: Date[];
  minDate!: Date;
  maxDate!: Date;
  datepipe = inject(DatePipe);
  // toastr = inject(ToastrService);
  AgeFrom: number = 0;
  AgeTo: number = 1000;

  optionProx: Options = {
    floor: 0,
    ceil: 1000,
    step: 1
  };

  ngChanges: any = []
  @Input() activeFilters: any = []

  groupId: any = [8];
  storeIds: any = [2]
  stores: any = []
  groupsArray: any = [];
  storename: any = ''
  storecount: any = null;
  storedisplayname: any = '';
  groupName: any = '';
  storesFilterData: any = {
    'groupsArray': this.groupsArray, 'groupId': this.groupId, 'storesArray': this.stores, 'storeids': this.storeIds, 'type': 'M', 'others': 'N',
    'groupName': this.groupName, 'storename': this.storename, storecount: null, 'storedisplayname': this.storedisplayname
  };


  @Output() filtersApplied = new EventEmitter<any>();
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = (event.target as HTMLElement).closest('.dropdown-toggle, .reportstores-card, .timeframe, .bs-datepicker-container');
    if (!clickedInside) {
      this.activePopover = -1;
    }
  }
    ngOnChanges(changes: SimpleChanges) {
    console.log(changes, 'Report.........s');
    this.ngChanges = changes['activeFilters'].currentValue;
    this.FromDate = this.ngChanges.startdate;
    this.ToDate = this.ngChanges.enddate;
    // this.DateType = this.ngChanges.datetype;
    // this.setDates(this.ngChanges.datetype)

  }

  constructor(private shared: Sharedservice, private elementRef: ElementRef, private renderer: Renderer2, private cdr: ChangeDetectorRef) {
    let today = new Date();
    let enddate = new Date(today.setDate(today.getDate() - 1));

    const storedUser: any = localStorage.getItem('userInfo');

    this.userInfo = storedUser ? JSON.parse(storedUser) : null;
    this.userId.set(this.userInfo.user_Info.userid);
    this.getStoreList();

    this.FromDate = ('0' + (enddate.getMonth() + 1)).slice(-2) + '-01' + '-' + enddate.getFullYear();
    this.ToDate = ('0' + (enddate.getMonth() + 1)).slice(-2) + '-' + ('0' + enddate.getDate()).slice(-2) + '-' + enddate.getFullYear();
    this.month = today;
    this.maxDate = new Date();
    this.minDate = new Date();
    this.minDate.setFullYear(this.maxDate.getFullYear() - 3);
    this.maxDate.setDate(this.maxDate.getDate());
    this.selectedDepartments = ['S', 'P'];
    this.selectedSaleType = this.getAllowedSaleTypes();
  }



  togglePopover(popoverIndex: number) {
    if (this.activePopover === popoverIndex) {
      this.activePopover = -1;
    } else {
      this.activePopover = popoverIndex;
    }
  }
  getStoreList() {
    let obj = {
      "userid": this.userId()
    }
    return this.shared.api.postmethod(this.shared.common.routeEndpoint + 'GetStoresList', obj)
      .subscribe((res: any) => {
        if (res.status == 200) {
          this.sortedStores = res.response;
          this.selectedStores = this.sortedStores.map((val: any) => {
            return val.ID
          })
        } else {
          this.sortedStores = [];
        }
        this.getDataGroupings();
        this.getsalesType()
      })
  }

  Groupingcols = [
    { id: 60, columnName: 'DealerName', Active: 'Y' },
    { id: 54, columnName: 'AP_CounterPerson', Active: 'Y' },
    { id: 55, columnName: 'AP_PARTS_TYPE', Active: 'Y' },
    { id: 56, columnName: 'Customername', Active: 'Y' },
    { id: 57, columnName: 'CustomerZip', Active: 'Y' },
    { id: 58, columnName: 'CustomerState', Active: 'Y' },
    { id: 59, columnName: 'ODate', Active: 'Y' },
    { id: 61, columnName: 'AP_source', Active: 'Y' },
  ];

  GroupingData: any = [];
  SelectedGrouping: any = [];
  GroupNames: any = [];
  selectedDataGrouping: any[] = [];
  changes: any = {};

      ngAfterViewInit() {
    this.shared.api.getStores().subscribe((res: any) => {
      // console.log(this.shared.common.pageName);

      if (this.shared.common.pageName == 'PARTS OPEN RO') {
        if (res.obj.storesData != undefined) {
          this.groupsArray = res.obj.storesData;
          this.groupId = this.ngChanges.groups;
          this.stores = this.shared.common.groupsandstores.filter((v: any) => v.sg_id == this.groupId)[0].Stores;
          this.storeIds = this.ngChanges.Store;
          this.storeIds.length == this.stores.length ? this.groupName = this.stores[0].sg_Name : this.groupName = ''
          this.storeIds.length == 1 ? this.storename = this.stores.filter((e: any) => e.ID == this.storeIds)[0].storename : this.storename = ''
          // console.log(this.stores, this.groupsArray, 'Stores and Groups');
          this.getStoresandGroupsValues()
          // // console.log(this.groupId,'....');
          // this.StoresData(this.ngChanges)

        }
      }
    })

  }
  getGroups() {
    // console.log(this.shared.common.pageName, this.shared.common.groupsandstores);

    if (this.shared.common.groupsandstores != undefined) {
      if (this.shared.common.groupsandstores.length > 0) {
        this.groupsArray = this.shared.common.groupsandstores.filter((val: any) => val.sg_id != this.shared.common.reconID);
        this.groupId = this.ngChanges.groups
        this.stores = this.shared.common.groupsandstores.filter((v: any) => v.sg_id == this.groupId)[0].Stores;
        this.storeIds.length == this.stores.length ? this.groupName = this.stores[0].sg_name : this.groupName = ''
        this.storeIds.length == 1 ? this.storename = this.stores.filter((e: any) => e.ID == this.storeIds)[0].storename : this.storename = ''
        // console.log(this.stores, this.groupsArray, 'Stores and Groups');
        this.getStoresandGroupsValues()
        // this.StoresData(this.ngChanges)
      }
    }
  }
  getStoresandGroupsValues() {
    this.storesFilterData.groupsArray = this.groupsArray;
    this.storesFilterData.groupId = this.groupId;
    this.storesFilterData.storesArray = this.stores;
    this.storesFilterData.storeids = this.storeIds;
    this.storesFilterData.groupName = this.groupName;
    this.storesFilterData.storename = this.storename;
    this.storesFilterData.storecount = this.storecount;
    this.storesFilterData.storedisplayname = this.storedisplayname;

    this.storesFilterData = {
      groupsArray: this.groupsArray,
      groupId: this.groupId,
      storesArray: this.stores,
      storeids: this.storeIds,
      groupName: this.groupName,
      storename: this.storename,
      storecount: this.storecount,
      storedisplayname: this.storedisplayname,
      'type': 'M', 'others': 'N'
    };



    // this.storesFilterData = { ...this.storesFilterData, newProp: 'updated' }
    console.log(this.storesFilterData, 'Store FIlter Data');

    let allstrids = [];
    // allstrids = [...this.storeIds]
    // this.getEmployees('SP', allstrids.toString(), '1', 'Bar');
    // this.getEmployees('F', allstrids.toString(), '1', 'Bar');
    // this.getEmployees('M', allstrids.toString(), '1', 'Bar');
  }
  StoresData(data: any) {

    this.storeIds = data.storeids;
    this.groupId = data.groupId;
    this.storename = data.storename;
    this.groupName = data.groupName;
    this.storecount = data.storecount;
    this.storedisplayname = data.storedisplayname;
    // console.log(data, this.storeIds, this.groupId, this.storename, this.groupName, this.stores, this.groupsArray, 'Stores related data');

    // let allstrids = [];
    // allstrids = [...this.storeIds]
    // this.getEmployees('SP', allstrids.toString(), '2', '');
    // this.getEmployees('F', allstrids.toString(), '2', '');
    // this.getEmployees('M', allstrids.toString(), '2', '');

  }

  getDataGroupings() {
    this.SelectedGrouping = [];
    this.GroupingData = [];

    const obj = { pageid: 4 };

    this.shared.api.postmethod(this.shared.common.routeEndpoint + 'GetDataGroupingsbyPage', obj).subscribe((data: any) => {

      if (data.status === 200 && data.response) {
        // merge API result with GroupingCols based on ARG_ID match
        this.GroupingData = data.response.map((item: any) => ({
          ...item,
          ...this.Groupingcols.find((c: { id: any; }) => c.id === item.ARG_ID)
        }));

        // Always preselect STORE only once
        const defaultStore = this.GroupingData.find(
          (g: { ARG_LABEL: string; }) => g.ARG_LABEL?.trim().toLowerCase() === 'store'
        );

        if (defaultStore) {
          this.SelectedGrouping = [defaultStore];
        }

        // restore from header only AFTER default applied
        if (this.changes?.header?.currentValue) {
          const idsToSelect = this.changes.header.currentValue[0].ids;
          this.SelectedGrouping = this.GroupingData.filter((grp: any) =>
            idsToSelect.includes(grp.ARG_ID)
          );
        }

        this.selectedDataGrouping = [...this.SelectedGrouping];
      }
    });
  }

  saleTypeLabel(code: string) {
    return this.saleTypeMap[code] ?? code;
  }

  SelectGroping(item: any) {
    const exists = this.SelectedGrouping.find((g: { ARG_ID: any; }) => g.ARG_ID === item.ARG_ID);

    if (exists) {
      this.SelectedGrouping = this.SelectedGrouping.filter((g: { ARG_ID: any; }) => g.ARG_ID !== item.ARG_ID);
    } else {
      if (this.SelectedGrouping.length === 2) {
        alert("Maximum 2 Groupings allowed");
        return;
      }
      this.SelectedGrouping.push(item);
    }

    this.selectedDataGrouping = [...this.SelectedGrouping];
  }

  isGroupSelected(id: number): boolean {
    return this.SelectedGrouping.some((g: { ARG_ID: number; }) => g.ARG_ID === id);
  }

  Reset() {
    this.SelectedGrouping = [];
    this.selectedDataGrouping = [];

    const defaultStore = this.GroupingData.find(
      (g: { ARG_LABEL: string; }) => g.ARG_LABEL?.trim().toLowerCase() === 'store'
    );

    if (defaultStore) {
      this.SelectedGrouping = [defaultStore];
      this.selectedDataGrouping = [defaultStore];
    }
  }

  formatYMD(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  SetDates(type: any) {
    this.DateType.set(type);
    localStorage.setItem('time', this.DateType());

    let today = new Date();
    let enddate = new Date(today.setDate(today.getDate() - 1));

    if (this.isCalendarOpen() && type != 'C') {
      this.handler1('onHidden1');
    }

    // Month to Date (MTD)
    if (type == 'MTD') {
      this.custom.set(false);
      const firstDay = new Date(enddate.getFullYear(), enddate.getMonth(), 1);

      this.FromDate = this.formatYMD(firstDay);
      this.ToDate = this.formatYMD(enddate);
      this.bsDateRange = [this.FromDate, this.ToDate];
    }

    // Year To Date (YTD)
    if (type == 'YTD') {
      this.custom.set(false);
      const firstDay = new Date(enddate.getFullYear(), 0, 1);

      this.FromDate = this.formatYMD(firstDay);
      this.ToDate = this.formatYMD(enddate);
      this.bsDateRange = [this.FromDate, this.ToDate];
    }

    // Past Year To Date (PYTD)
    if (type == 'PYTD') {
      this.custom.set(false);
      const firstDay = new Date(enddate.getFullYear() - 1, 0, 1);
      const lastDay = new Date(enddate.getFullYear() - 1, enddate.getMonth(), enddate.getDate());

      this.FromDate = this.formatYMD(firstDay);
      this.ToDate = this.formatYMD(lastDay);
      this.bsDateRange = [this.FromDate, this.ToDate];
    }

    // Last Month (LM)
    if (type == 'LM') {
      this.custom.set(false);
      const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

      this.FromDate = this.formatYMD(firstDayOfLastMonth);
      this.ToDate = this.formatYMD(lastDayOfLastMonth);
      this.bsDateRange = [this.FromDate, this.ToDate];
    }

    // Same Month Past Year (SMPY)
    if (type == 'SMPY') {
      this.custom.set(false);
      const firstDay = new Date(enddate.getFullYear() - 1, enddate.getMonth(), 1);
      const lastDay = new Date(enddate.getFullYear() - 1, enddate.getMonth(), enddate.getDate());

      this.FromDate = this.formatYMD(firstDay);
      this.ToDate = this.formatYMD(lastDay);
      this.bsDateRange = [this.FromDate, this.ToDate];
    }

  }

  handler1(value: string): void {
    if ('onShown1' === value) {
      this.isCalendarOpen.set(true);
    }
    if ('onHidden1' === value) {
      this.isCalendarOpen.set(false);
      (<HTMLInputElement>document.getElementById('DOB')).click();
    }
  }

  show() {
    this.isCalendarOpen.set(true);
    setTimeout(() => {
      let el: HTMLElement = document.getElementById('DOB') as HTMLElement
      el.click();
    }, 100);
  }

  dateRangeCreated(event: any) {
    if (event !== null) {
      let startDate = event[0].toJSON();
      let endDate = event[1].toJSON();
      this.FromDate = this.datepipe.transform(startDate, 'MM-dd-yyyy');
      this.ToDate = this.datepipe.transform(endDate, 'MM-dd-yyyy');

      if (this.DateType() == 'C') {
        this.custom.set(true);
        this.show();
      }
    }
  }

  selectedSaleType: string[] = [];

  saleTypeMap: any = {
    P: ['Counter Retail', 'Wholesale'],
    S: ['Customer Pay', 'Warranty', 'Internal']
  };

  getFilteredSaleTypes(): string[] {
    let allowed: string[] = [];

    if (this.selectedDepartments.includes('P')) {
      allowed.push(...this.saleTypeMap.P);
    }
    if (this.selectedDepartments.includes('S')) {
      allowed.push(...this.saleTypeMap.S);
    }

    return Array.from(new Set(allowed));
  }

  onDepartmentChange() {
    const allowed = this.getFilteredSaleTypes();
    this.selectedSaleType = this.selectedSaleType.filter(x => allowed.includes(x));
  }

  departmentClick(code: string) {
    if (this.selectedDepartments.includes(code)) {
      this.selectedDepartments = this.selectedDepartments.filter(x => x !== code);
    } else {
      this.selectedDepartments.push(code);
    }
    const allowed = this.getFilteredSaleTypes();
    this.selectedSaleType = [...allowed];
  }

  SelectClearAll(type: string) {
    if (type === 'S') {
      this.selectedSaleType = this.getAllowedSaleTypes(); // select all mapped
    } else {
      this.selectedSaleType = []; // clear all
    }
  }

  allowedSaleTypesByDepartment: any = {
    P: ['R', 'W'],
    S: ['C', 'T', 'I']
  };
  selectedDepartments: string[] = ['P', 'S'];

  getAllowedSaleTypes(): string[] {
    let result: string[] = [];

    this.selectedDepartments.forEach(dep => {
      if (this.saleTypeMap[dep]) {
        result = [...result, ...this.saleTypeMap[dep]];
      }
    });

    return result;
  }

  SaleTypeClick(item: string) {
    if (this.selectedSaleType.includes(item)) {
      this.selectedSaleType = this.selectedSaleType.filter(x => x !== item);
    } else {
      this.selectedSaleType = [...this.selectedSaleType, item];
    }
  }

  SalesTypesFiltered() {
    const all = this.SalesTypes();
    const allowedCodes = this.getAllowedSaleTypes();

    if (!this.selectedDepartments || this.selectedDepartments.length === 0) {
      return [];
    }

    return (all || []).filter((x: any) =>
      allowedCodes.includes(x.ASG_Subtype_Detail)
    );
  }

  getsalesType() {
    this.SalesTypes.set([]);

    this.setDefaultDepartments(); // ensure P & S are selected first

    this.shared.api.postmethod(this.shared.common.routeEndpoint + 'GetPartsSaleTypes', {}).subscribe(
      (res: any) => {
        if (res.response) {
          this.SalesTypes.set(res.response);

          // Get all allowed sale types based on default departments
          const allowed = this.getAllowedSaleTypes();

          // Select all allowed Sale Types by default
          this.selectedSaleType = allowed;

          console.log("Default Selected Sale Types:", this.selectedSaleType);
        }
      },
      error => {
        console.log('salesType', error);
      }
    );
  }


  setDefaultDepartments() {
    this.selectedDepartments = ['P', 'S'];
  }

  selectClearDept(type: string) {
    if (type === 'S') {
      this.selectedDepartments = ['P', 'S']; // select all
    } else {
      this.selectedDepartments = []; // clear all
    }

    this.updateSaleTypesAfterDeptChange();
  }

  updateSaleTypesAfterDeptChange() {
    const allowed = this.getAllowedSaleTypes();

    this.selectedSaleType = this.SalesTypes()
      .map((x: any) => x.ASG_Subtype_Detail)
      .filter((x: string) => allowed.includes(x));
  }

  reportPosition: 'T' | 'B' = 'T';
  reportTotal(val: 'T' | 'B') {
    this.reportPosition = val;
    this.cdr.detectChanges(); // Required in Angular 20 inside popover
  }

  applyClick() {
    if (this.storeIds.length === 0) {
      alert('Please select at least one Store');
      return;
    }

    if (this.selectedSaleType.length === 0) {
      alert('Please select at least one Sale Type');
      return;
    }

    if (this.SelectedGrouping.length === 0) {
      alert('Please select at least one Grouping');
      return;
    }

    if (this.selectedDepartments.length === 0) {
      alert('Please select at least one Department');
      return;
    }

    const SaleTypeValue = (this.SalesTypes().length === this.selectedSaleType.length) ? '' : this.selectedSaleType.toString();
    const DepartmentValue = this.selectedDepartments.toString();

    const filterObject = {
      startdate: this.FromDate,
      enddate: this.ToDate,
      Store: this.storeIds,
      SaleType: SaleTypeValue,
      Department: DepartmentValue,
      Report: this.reportPosition,
      type: '',
      var1: this.SelectedGrouping[0]?.columnName ?? '',
      var2: this.SelectedGrouping[1]?.columnName ?? '',
      var3: this.SelectedGrouping[2]?.columnName ?? '',
      GroupingNames: this.selectedDataGrouping.map(x => x.ARG_LABEL)
    };

    console.log("APPLY FILTERS:", filterObject);
    this.filtersApplied.emit(filterObject);
  }
}
