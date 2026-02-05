import { Component, Output, EventEmitter, inject, SimpleChanges, Input } from '@angular/core';
import { CommonModule, DatePipe, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BsDatepickerModule, BsDaterangepickerDirective } from 'ngx-bootstrap/datepicker';
import { HttpClient } from '@angular/common/http';
import { HostListener } from '@angular/core';
import { Sharedservice } from '../../../../Core/Providers/Shared/sharedservice';
import { Stores } from '../../../../CommonFilters/stores/stores';
import { DateRangePicker } from '../../../../CommonFilters/date-range-picker/date-range-picker';

@Component({
  selector: 'app-parts-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, BsDatepickerModule, Stores, DateRangePicker],
  providers: [DatePipe],
  templateUrl: './parts-reports.html',
  styleUrl: './parts-reports.scss',
})
export class PartsReports {
  @Output() applyFilters = new EventEmitter<any>();
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('.filter-item') || target.closest('.timeframe') || target.closest('.bs-datepicker-container')) { return; }
    this.activePopover = null;
  }

  @Input() activeFilters: any = []

  groupId: any = [1];
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

  DateType: string = 'MTD';
  FromDate: Date | null = null;
  ToDate: Date | null = null;
  maxDate: Date = new Date();
  minDate!: Date;
  displaytime: any = '';
  Dates: any = {
    'FromDate': this.FromDate, 'ToDate': this.ToDate, "MaxDate": this.maxDate, 'MinDate': this.minDate, 'DateType': this.DateType, 'DisplayTime': this.displaytime,
    Types: [
      { 'code': 'MTD', 'name': 'MTD' },
      { 'code': 'YTD', 'name': 'YTD' },
      { 'code': 'PYTD', 'name': 'PYTD' },
      { 'code': 'LM', 'name': 'Last Month' },
      { 'code': 'PM', 'name': 'Same Month PY' },
    ]
  }


  ngChanges: any = []

  ngOnChanges(changes: SimpleChanges) {
    console.log(changes, 'Report');
    this.ngChanges = changes['activeFilters'].currentValue;
     this.FromDate = this.ngChanges.startdate;
    this.ToDate = this.ngChanges.enddate;
    this.DateType = this.ngChanges.datetype;
    this.setDates(this.ngChanges.datetype)

  }

  constructor(private http: HttpClient, private datePipe: DatePipe, public shared: Sharedservice,) { }


  activePopover: number | null = null;
  bsRangeValue: Date[] = [];



  groups: any[] = [];
  dataGrouping: any[] = [];
  selectedDataGrouping: any[] = [];
  selectedGroups: any[] = [];

  saleandservice: string[] = ['R', 'W', 'C', 'T', 'I'];
  department: string[] = ['Service', 'Parts'];
  saletypeSelected: number[] = [1, 2, 3, 4, 5];

  labortype: string | null = 'C,T,I';
  saletype: string | null = 'R,W';
  servicetype: string[] | null = ['C', 'T', 'I'];

  partsSource: string = 'All';
  SourceBulk: string = '';
  SourceTire: string = '';
  SourceWithout: string = '';
  toporbottom: string = 'T';

  UserId = Number(localStorage.getItem('UserId') ?? 0);

  lastSaletype: string | null = 'R,W';
  lastServicetype: string[] | null = ['C', 'T', 'I'];
  lastSaletypeSelected: number[] = [...this.saletypeSelected];
  custom = false;



  get saleTypeCount(): number {
    const partTypes = (this.saletype ?? '').split(',').filter(x => x.trim() !== '');
    const serviceTypes = (this.servicetype ?? []).filter(x => x.trim() !== '');
    return [...partTypes, ...serviceTypes].length;
  }

  ngOnInit() {
    // this.SetDates('MTD');

    this.initVisualPartsSelected();

    this.applyPartSourceRules();

    this.getDataGroupings();
    this.getSaleTypes();
    this.getGroups();
    this.department = ['Service', 'Parts'];
    this.saletype = 'R,W';
    this.servicetype = ['C', 'T', 'I'];
    this.applySaleTypeForServiceAndParts(this.saletypeSelected);

    this.saleandservice = ['R', 'W', 'C', 'T', 'I'];
    this.saletypeSelected = [1, 2, 3, 4, 5];

    this.lastSaletype = this.saletype;
    this.lastServicetype = this.servicetype ? [...this.servicetype] : null;
    this.lastSaletypeSelected = [...this.saletypeSelected];
  }

  handlePartsSourceClick(value: 'All' | 'N' | 'B' | 'T') {
    this.partsSource = value;

    if (value === 'All') {
      this.visualPartsSelected = ['All', 'N', 'B', 'T'];
    } else {
      this.visualPartsSelected = [value];
    }

    switch (value) {
      case 'All':
        this.SourceBulk = '';
        this.SourceTire = '';
        this.SourceWithout = '';
        break;
      case 'N':
        this.SourceBulk = '';
        this.SourceTire = '';
        this.SourceWithout = 'Y';
        break;
      case 'B':
        this.SourceBulk = 'Y';
        this.SourceTire = '';
        this.SourceWithout = '';
        break;
      case 'T':
        this.SourceBulk = '';
        this.SourceTire = 'Y';
        this.SourceWithout = '';
        break;
    }
  }

  visualPartsSelected: string[] = [];

  private initVisualPartsSelected() {
    this.visualPartsSelected = ['All', 'N', 'B', 'T'];
  }

  isVisualSelected(code: string): boolean {
    return this.visualPartsSelected.includes(code);
  }

   setDates(type: any) {
    // localStorage.setItem('time', type);
    // this.datevaluetype=
    // console.log(type);
    if (type != 'C') {
      this.displaytime = 'Time Frame ( ' + this.Dates.Types.filter((val: any) => val.code == type)[0].name + ' )';
    }
    this.maxDate = new Date();
    this.minDate = new Date();
    this.minDate.setFullYear(this.maxDate.getFullYear() - 3);
    this.maxDate.setDate(this.maxDate.getDate());
    this.Dates.FromDate = this.FromDate;
    this.Dates.ToDate = this.ToDate;
    this.Dates.MinDate = this.minDate;
    this.Dates.MaxDate = this.maxDate;
    this.Dates.DateType = this.DateType;
    this.Dates.DisplayTime = this.displaytime;
  }
  updatedDates(data: any) {
    // console.log(data);
    this.FromDate = data.FromDate;
    this.ToDate = data.ToDate;
    this.DateType = data.DateType;
    this.displaytime = data.DisplayTime
  }

  togglePopover(index: number, event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.activePopover = this.activePopover === index ? null : index;
    console.log(this.activePopover, '...................');

  }
  get dateTypeLabel(): string {
    if (this.DateType === 'C' && this.FromDate && this.ToDate) {
      const from = this.datePipe.transform(this.FromDate, 'dd/MM/yy');
      const to = this.datePipe.transform(this.ToDate, 'dd/MM/yy');
      return `${from} to ${to}`;
    }
    return this.DateType;
  }




  getGroupingIndex(grp: any): number {
    return this.selectedDataGrouping.findIndex((x: any) => x.ARG_ID === grp.ARG_ID);
  }

  Groupingcols = [
    { id: 60, columnName: 'DealerName', Active: 'Y' },
    { id: 54, columnName: 'AP_CounterPerson', Active: 'Y' },
    { id: 55, columnName: 'AP_LP_Type', Active: 'Y' },
    { id: 56, columnName: 'Customername', Active: 'Y' },
    { id: 57, columnName: 'CustomerZip', Active: 'Y' },
    { id: 58, columnName: 'CustomerState', Active: 'Y' },
    { id: 59, columnName: 'cdate', Active: 'Y' },
    { id: 61, columnName: 'AP_source', Active: 'Y' },
  ];

  GroupingData: any = [];
  SelectedGrouping: any = [];
  GroupNames: any = [];
  changes: any = {};

  getDataGroupings() {
    this.SelectedGrouping = [];
    this.GroupingData = [];

    const obj = { pageid: 49 };
    this.shared.api.postmethod(this.shared.common.routeEndpoint + 'GetDataGroupingsbyPage', obj).subscribe((data: any) => {

      if (data.status === 200 && data.response) {

        // this.GroupingData = data.response.map((item: any) => ({
        //   ...item,
        //   ...this.Groupingcols.find((c: { id: any; }) => c.id === item.ARG_ID)
        // }));
        this.GroupingData = data.response.map((item: any, i: any) => Object.assign({}, item, this.Groupingcols[i]));
console.log(this.GroupingData,'Groupings Data');

        const defaultStore = this.GroupingData.find(
          (g: { ARG_LABEL: string; }) => g.ARG_LABEL?.trim().toLowerCase() === 'store'
        );

        if (defaultStore) {
          this.SelectedGrouping = [defaultStore];
        }

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

  SelectGroping(item: any) {

    console.log("Clicked Item:", item);

    const exists = this.selectedDataGrouping.find((g: any) => g.ARG_ID === item.ARG_ID);

    if (exists) {
      this.selectedDataGrouping = this.selectedDataGrouping.filter((g: any) => g.ARG_ID !== item.ARG_ID);
    }
    else {
      if (this.selectedDataGrouping.length >= 2) {
        // alert("Maximum 2 Groupings allowed");
        alert('Select up to 2 filters only to group your data');
        return;
      }


      this.selectedDataGrouping.push(item);
    }

    this.SelectedGrouping = [...this.selectedDataGrouping];

    console.log(" selectedDataGrouping:", this.selectedDataGrouping);
    console.log(" SelectedGrouping:", this.SelectedGrouping);

    console.log(" var1 =", this.selectedDataGrouping[0]?.columnName);
    console.log(" var2 =", this.selectedDataGrouping[1]?.columnName);
  }

  isGroupingSelected(grp: any): boolean {
    return this.selectedDataGrouping.some((x: any) => x.ARG_ID === grp.ARG_ID);
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

  isInactive(grp: any): boolean {
    return grp.Active === 'N';
  }



  multipleorsingle(type: string, value: string) {
    if (type === 'PT') {
      this.toggleSaleTypePart(value);
      return;
    }

    if (type === 'LT') {
      this.toggleSaleTypeLabor(value);
      return;
    }

    if (type === 'PS') {
      this.partsSource = value;
      this.applyPartSourceRules();
      return;
    }

    if (type !== 'Dept') return;

    const index = this.department.indexOf(value);

    if (index >= 0) {
      // determine if removing this value will make department empty
      const willBeEmpty = this.department.length === 1;

      if (value === 'Parts') {
        this.lastSaletype = this.saletype ?? null;
        this.lastSaletypeSelected = Array.isArray(this.saletypeSelected) ? [...this.saletypeSelected] : [];
        this.saletype = null;
        this.saletypeSelected = [];
      }

      if (value === 'Service') {
        this.lastServicetype = this.servicetype ? [...this.servicetype] : null;
        this.servicetype = null;
        this.labortype = null;
      }

      this.department.splice(index, 1);

      // only show warning if we just removed the last remaining department
      if (willBeEmpty) {
        alert('Please select at least 1 from departments');
      }
    } else {
      this.department.push(value);

      if (value === 'Parts') {
        this.saletype = this.lastSaletype ?? 'R,W';
        if (this.lastSaletypeSelected && this.lastSaletypeSelected.length) {
          this.saletypeSelected = [...this.lastSaletypeSelected];
        } else if (!this.saletypeSelected || this.saletypeSelected.length === 0) {
          this.saletypeSelected = [1, 2];
        }
      }

      if (value === 'Service') {
        this.servicetype = this.lastServicetype ? [...this.lastServicetype] : ['C', 'T', 'I'];
        this.labortype = (this.servicetype ?? []).join(',') || null;
      }
    }

    const hasService = this.department.includes('Service');
    const hasParts = this.department.includes('Parts');

    if (hasService && hasParts) {
      this.labortype = (this.servicetype ?? []).join(',') || 'C,T,I';
      this.saletype = this.saletype ?? 'R,W';
    } else if (hasService && !hasParts) {
      this.labortype = (this.servicetype ?? []).join(',') || 'C,T,I';
      this.saletype = null;
    } else if (!hasService && hasParts) {
      this.labortype = null;
      this.saletype = this.saletype ?? 'R,W';
    } else {
      this.labortype = null;
      this.saletype = null;
    }
  }


  toggleSaleTypePart(value: string) {
    if (!this.department.includes('Parts')) return;

    let arr = (this.saletype ?? '').split(',').filter(x => x !== '');

    if (arr.includes(value)) {
      arr = arr.filter(x => x !== value);
    } else {
      arr.push(value);
    }

    this.saletype = arr.length ? arr.join(',') : null;

    this.lastSaletype = this.saletype;

  }

  toggleSaleTypeLabor(value: string) {
    if (!this.department.includes('Service')) return;

    const arr = this.servicetype ? [...this.servicetype] : [];

    if (arr.includes(value)) {
      this.servicetype = arr.filter(x => x !== value);
    } else {
      arr.push(value);
      this.servicetype = arr;
    }

    this.labortype = (this.servicetype ?? []).join(',') || null;

    this.lastServicetype = this.servicetype ? [...this.servicetype] : null;
  }



  getCurrentFilters() {
    return {
      stores: this.storeIds,
      groups: this.selectedGroups,
      grouping: this.selectedDataGrouping,
      dateType: this.DateType,
      from: this.FromDate,
      to: this.ToDate,
      department: this.department,
      saleType: this.saletypeSelected,
      partsSource: this.partsSource,
      totals: this.toporbottom
    };
  }


  applySaleTypeForServiceAndParts(selected: number[]) {
    const s = [...selected].sort();

    if (JSON.stringify(s) === JSON.stringify([2, 3, 4, 5])) {
      this.labortype = 'C,T,I';
      this.saletype = 'W';
      return;
    }
    if (JSON.stringify(s) === JSON.stringify([1, 3, 4, 5])) {
      this.labortype = 'C,T,I';
      this.saletype = 'R';
      return;
    }
    if (JSON.stringify(s) === JSON.stringify([1, 2, 4, 5])) {
      this.labortype = 'T,I';
      this.saletype = 'R,W';
      return;
    }
    if (JSON.stringify(s) === JSON.stringify([1, 2, 3, 5])) {
      this.labortype = 'C,I';
      this.saletype = 'R,W';
      return;
    }
    if (JSON.stringify(s) === JSON.stringify([1, 2, 3, 4])) {
      this.labortype = 'C,T';
      this.saletype = 'R,W';
      return;
    }
    if (s.length === 5) {
      this.labortype = 'C,T,I';
      this.saletype = 'R,W';
    }
  }

  applyPartSourceRules() {
    switch (this.partsSource) {
      case 'All':
        this.SourceBulk = '';
        this.SourceTire = '';
        this.SourceWithout = '';
        break;

      case 'N':
        this.SourceBulk = '';
        this.SourceTire = '';
        this.SourceWithout = 'Y';
        break;

      case 'B':
        this.SourceBulk = 'Y';
        this.SourceTire = '';
        this.SourceWithout = '';
        break;

      case 'T':
        this.SourceBulk = '';
        this.SourceTire = 'Y';
        this.SourceWithout = '';
        break;
    }
  }

  getSaleTypes() {

    this.shared.api.postmethod(this.shared.common.routeEndpoint + 'GetPartsSaleTypes', {}).subscribe({
      next: (res: any) => {
        if (res.response) {
          this.saleandservice = res.response.map((x: any) => x.ASG_Subtype_Detail);
          this.saletypeSelected = [...Array(this.saleandservice.length).keys()];
          this.lastSaletypeSelected = [...this.saletypeSelected];
        }
      },
      error: (err) => console.error('SaleType API Error:', err)
    });
  }
 scrollPosition = 0;

  getScrollPosition(event: any): void {
    this.scrollPosition = event.target.scrollLeft ;
    console.log(this.scrollPosition,event.target.scrollTop);
    
  }
  // Stores Filter 
  ngAfterViewInit() {
    this.shared.api.getStores().subscribe((res: any) => {
      // console.log(this.shared.common.pageName);

      if (this.shared.common.pageName == 'Parts Gross') {
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
        console.log(this.stores, this.groupsArray, 'Stores and Groups');
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
  }
  StoresData(data: any) {
    this.storeIds = data.storeids;
    this.groupId = data.groupId;
    this.storename = data.storename;
    this.groupName = data.groupName;
    this.storecount = data.storecount;
    this.storedisplayname = data.storedisplayname;
  }


  viewreport() {

    if (!this.department || this.department.length === 0) {
      alert('Please select at least 1 from departments');
      return;
    }
    const filters = {
      startdate: this.datePipe.transform(this.FromDate, 'MM-dd-yyyy'),
      enddate: this.datePipe.transform(this.ToDate, 'MM-dd-yyyy'),

      Store: this.storeIds.join(','),

      Labortype: (this.servicetype ?? []).join(','),
      Saletype: this.saletype ?? '',

      SourceBulk: this.SourceBulk,
      SourceTire: this.SourceTire,
      SourceWithout: this.SourceWithout,

      dealername: '',
      Advisorname: '',

      var1: this.selectedDataGrouping[0]?.columnName ?? 'DealerName',
      var2: this.selectedDataGrouping[1]?.columnName ?? '',
      var3: this.selectedDataGrouping[2]?.columnName ?? '',

      RowType: 'D',
      UserID: this.UserId,
      PageNumber: 0,
      PageSize: 200,
      toporbottom: this.toporbottom,

      selectedStores: this.stores.filter((s: any) => this.storeIds.includes(s.ID)),
      selectedGrouping: this.selectedDataGrouping,
      department: this.department,
      saleType: this.saletype,
      serviceType: this.servicetype,
      partsSource: this.partsSource,
      datetype:this.DateType
    };

    console.log(" FILTERS SENT TO DASHBOARD:", filters);

    this.applyFilters.emit(filters);
  }
  isPartSaleActive(code: string): boolean {
    const parts = (this.saletype ?? '').split(',').map(s => s.trim()).filter(s => s !== '');
    return parts.includes(code);
  }

  isServiceSaleActive(code: string): boolean {
    return (this.servicetype ?? []).includes(code);
  }

}
