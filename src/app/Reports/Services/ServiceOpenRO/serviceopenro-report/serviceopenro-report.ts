import { Component, effect, EventEmitter, HostListener, inject, Input, OnInit, Output, output, signal, SimpleChanges, ViewChild } from '@angular/core';
// import { Apiservice } from '../../../../providers/services/apiservice';
import { Sharedservice } from '../../../../Core/Providers/Shared/sharedservice';
import { FormsModule } from '@angular/forms';
import { BsDatepickerModule, BsDaterangepickerDirective } from 'ngx-bootstrap/datepicker';
import { DatePipe, NgFor, NgIf, NgStyle } from '@angular/common';
import { Options, LabelType, NgxSliderModule } from "@angular-slider/ngx-slider";
// import { ToastrService } from 'ngx-toastr';
import { common } from '../../../../common';
import { Stores } from '../../../../CommonFilters/stores/stores';
@Component({
  selector: 'app-serviceopenro-report',
  standalone: true,
  imports: [FormsModule, NgIf, BsDatepickerModule, NgxSliderModule, Stores, NgStyle],
  templateUrl: './serviceopenro-report.html',
  styleUrl: './serviceopenro-report.scss',
  providers: [DatePipe]
})
export class ServiceopenroReport {

  ngChanges: any = []
  @Input() filterData: any = []

  common = inject(common);
  @Output() appliedFilterData: any = new EventEmitter<any>();
  // toastr = inject(ToastrService);
  bsRangeValue: Date[] = [];
  sortedStores: any = [];
  groupSettingList: any[] = [];
  sortedGroups: any = []; laborTypelist: any = [];
  userInfo: any; userId = signal<any>('');
  selectedStores: any = []; selectedGroups: any = [];
  timeFrame: any = signal<string>(''); selectedLabortypes: any = [];
  selectedDep: any = ['S', 'P']; selectedPaytypes: any = ['C', 'W', 'I']; roStatusList: any = [];
  groupingNames: any = [
    { "id": 40, "name": "Store_Name" },
    { "id": 26, "name": "ServiceAdvisor_Name" },
    { "id": 27, "name": "serviceadvisor" },
    { "id": 28, "name": "techname" },
    { "id": 29, "name": "techno" },
    { "id": 30, "name": "Pay Type" },
    { "id": 31, "name": "vehicle_Year" },
    { "id": 32, "name": "vehicle_Make" },
    { "id": 33, "name": "Vehicle_Model" },
    { "id": 34, "name": "Vehicle_Odometer" },
    { "id": 35, "name": "CName" },
    { "id": 36, "name": "CZip" },
    { "id": 37, "name": "CState" },
    { "id": 38, "name": "opendate" },
    { "id": 39, "name": "No Grouping" },
    { "id": 68, "name": "opcode" }
  ]

  AgeFrom: any = 1;
  AgeTo: any = 1000;

  optionProx: Options = {
    floor: 0, ceil: 1000,
    showSelectionBarFromValue: 0,
    hideLimitLabels: true,
    translate: (value: number, label: LabelType): string => {
      switch (label) {
        case LabelType.Low: return "<a>" + value + " Age</a>";
        case LabelType.High:
          return " " + value + " Age";
        default:
          return "" + value + " Age";
      }
    }
  };

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


  // @ViewChild('datepicker') datepicker!: BsDaterangepickerDirective;
  datepipe = inject(DatePipe);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = (event.target as HTMLElement).closest('.dropdown-toggle, .reportstores-card, .timeframe, .bs-datepicker-container');
    if (!clickedInside) {
      this.activePopover = -1;
    }
  }



  ngOnChanges(changes: SimpleChanges) {
    console.log(changes, 'Report.........s');
    this.ngChanges = changes['filterData'].currentValue;
    this.FromDate = this.ngChanges.startdate;
    this.ToDate = this.ngChanges.enddate;
    // this.DateType = this.ngChanges.datetype;
    // this.setDates(this.ngChanges.datetype)

  }

  constructor(public shared: Sharedservice,) {
    let today = new Date();
    let enddate = new Date(today.setDate(today.getDate() - 1));
    this.FromDate = ('0' + (enddate.getMonth() + 1)).slice(-2) + '-01' + '-' + enddate.getFullYear();
    this.ToDate = ('0' + (enddate.getMonth() + 1)).slice(-2) + '-' + ('0' + enddate.getDate()).slice(-2) + '-' + enddate.getFullYear();

    const storedUser = localStorage.getItem('userInfo');
    this.userInfo = storedUser ? JSON.parse(storedUser) : null;
    this.userId.set(this.userInfo.userid);
    this.loadCalls();
    // this.applyClick();
  }

  ngOnInit() {
    this.maxDate = new Date();
    this.maxDate.setDate(this.maxDate.getDate());
  }

  top5 = signal<any>(false);
  onCheckbox(e: any) {
    // console.log(e.target.checked);
    this.top5.set(e.target.checked);
  }

  loadCalls() {
    this.getStoreList();
    this.getGroupSettings();
  }

  activePopover: number = -1;
  togglePopover(popoverIndex: number) {
    if (this.activePopover === popoverIndex) {
      this.activePopover = -1;
    } else {
      this.activePopover = popoverIndex;
    }
  }

     scrollPosition = 0;

  getScrollPosition(event: any): void {
    this.scrollPosition = event.target.scrollLeft ;
    console.log(this.scrollPosition,event.target.scrollTop);
    
  }

  getStoreList() {
    let obj = {
      "userid": this.userId()
    }
    // console.log(obj, ' store list');
    this.shared.api.postmethod(this.common.routeEndpoint + 'GetStoresList', obj)
      .subscribe((res: any) => {
        // console.log(res);
        if (res.status == 200) {
          this.sortedStores = res.response;
          this.selectedStores = this.sortedStores.map((val: any) => {
            return val.ID
          })
          // console.log(this.selectedStores, ' selected stores');
          this.getDepartments();
        } else {
          this.sortedStores = [];
        }
        // console.log(this.sortedStores, ' store list');
      })
  }

  removerGroupArray = signal<any>(['pay type', 'no grouping', 'tech name', 'tech number']);
  selectedGroupsNames: any = [];
  getGroupSettings() {
    let obj = {
      "pageid": 2
    }
    return this.shared.api.postmethod(this.common.routeEndpoint + 'GetDataGroupingsbyPage', obj)
      .subscribe((res: any) => {
        // console.log(res, ' group setting');
        if (res.status == 200) {
          const removeArr = res.response.filter((item: any) => !this.removerGroupArray().includes(item.ARG_LABEL.toLowerCase()))
          // console.log('remover grouping array :', removeArr);
          this.groupSettingList = removeArr;
          const array: any[] = this.groupSettingList.slice(0, 1);
          this.selectedGroupsNames = array.map((item: any) => item.ARG_LABEL);
          // console.log(array);
          this.groupingNames.forEach((item1: any) => {
            if (array.some((item2: any) => item1.id === item2.ARG_ID)) {
              this.selectedGroups.push(item1);
            }
          });
        } else {
          this.groupSettingList = [];
        }
        // console.log(this.groupSettingList, ' group setting');
      })
  }

  departmentList = signal<any[]>([]);
  getDepartments() {
    // let obj = {
    //   Store: this.selectedStores.toString()
    // }
    // this.api.postMethod('GetServiceOpenDepartments', obj).subscribe((res: any) => {
    //   console.log('department list ', res);
    // })
  }

  isSelectedGroups(id: number): boolean {
    return this.selectedGroups.some((s: any) => s.id === id);
  }

  clickGroups(list: any) {
    // Check if list is already selected (by ARG_ID)
    const index = this.selectedGroups.findIndex(
      (item: any) => item.id === list.ARG_ID
    );
    if (index > -1) {
      this.selectedGroups.splice(index, 1);
      this.selectedGroupsNames.splice(index, 1);
    } else if (this.selectedGroups.length < 2) {
      this.groupingNames.forEach((item1: any) => {
        if (item1.id === list.ARG_ID) {
          this.selectedGroups.push(item1);
          this.selectedGroupsNames.push(list.ARG_LABEL);
        }
      });
    } else {
      alert('Select Upto 2 Filters Only to group your data');
    }
    if (this.selectedGroups.length == 0) {
      alert('Please select atleast one value from Groupings.');
    }
    // console.log('Updated selectedGroups:', this.selectedGroups);
  }

  show() {
    this.isCalendarOpen.set(true);
    setTimeout(() => {
      let el: HTMLElement = document.getElementById('DOB') as HTMLElement
      el.click();
    }, 100);
  }

    ngAfterViewInit() {
    this.shared.api.getStores().subscribe((res: any) => {
      // console.log(this.shared.common.pageName);

      if (this.shared.common.pageName == 'SERVICE OPEN RO') {
        if (res.obj.storesData != undefined) {
          this.groupsArray = res.obj.storesData;
          this.groupId = this.ngChanges.groups;
          this.stores = this.shared.common.groupsandstores.filter((v: any) => v.sg_id == this.groupId)[0].Stores;
          this.storeIds = this.ngChanges.StoreID;
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

  custom = signal<boolean>(false);
  DateType = signal<string>('ALL');
  isCalendarOpen = signal<boolean>(false);
  FromDate: any; ToDate: any; bsDateRange!: Date[]; maxDate !: Date;
  SetDates(type: any) {
    this.DateType.set(type);
    if (this.DateType() == '3' || this.DateType() == '10') {
      this.AgeFrom = 1; this.AgeTo = 1000
    }
    localStorage.setItem('time', this.DateType());
    // this.custom = false;
    let dates: any = this.settingdates(type);
    // console.log(dates, ' dates from date function');
    this.FromDate = dates[0];
    this.ToDate = dates[1];
    this.bsRangeValue = [this.FromDate, this.ToDate];

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

  openbardate() {
    // this.datepicker.show(); // Open the calendar
  }

  dateRangeCreated(event: any) {
    if (event !== null) {
      let startDate = event[0].toJSON();
      let endDate = event[1].toJSON();
      //// console.log(startDate, endDate);
      this.FromDate = this.datepipe.transform(startDate, 'MM-dd-yyyy');
      this.ToDate = this.datepipe.transform(endDate, 'MM-dd-yyyy');

      // console.log(this.FromDate, this.ToDate);
      // this.filterChange = true;
      if (this.DateType() == 'C') {
        this.custom.set(true);
        this.show();
      }
      // this.ApplyFiltersChecking();
    }
  }

  departmentClick(val: any) {
    const index = this.selectedDep.indexOf(val);

    if (index === -1) {
      this.selectedDep.push(val);
    } else {
      this.selectedDep.splice(index, 1);
    }
    if (this.selectedDep.length == 0) {
      alert('Please select atleast one Department.');
    }
    // console.log(this.selectedDep);
  }

  payTypeClick(val: any) {
    const index = this.selectedPaytypes.indexOf(val);

    if (index === -1) {
      this.selectedPaytypes.push(val);
    } else {
      this.selectedPaytypes.splice(index, 1);
    }
    if (this.selectedPaytypes.length == 0) {
      alert('Please select atleast one Pay Type.');
    }
    // console.log(this.selectedPaytypes);
  }

  selectedRostatusList: any = ['ALL'];
  roStatusClick(val: any) {
    if (val === 'ALL') {
      if (this.selectedRostatusList.includes('ALL')) {
        this.selectedRostatusList = [];
      } else {
        this.selectedRostatusList = ['ALL'];
      }
    } else {
      this.selectedRostatusList = this.selectedRostatusList.filter((item: any) => item !== 'ALL');
      const index = this.selectedRostatusList.indexOf(val);
      if (index === -1) {
        this.selectedRostatusList.push(val);
      } else {
        this.selectedRostatusList.splice(index, 1);
      }
      // if (this.selectedRostatusList.length === 0) {
      //   this.selectedRostatusList = [];
      // }
    }
    // console.log('RO Status List:', this.selectedRostatusList);
  }

  inventoryRoslist: any = ['ALL'];
  invRoClick(val: any) {
    this.inventoryRoslist = [];
    this.inventoryRoslist.push(val);
  }

  reportPosition: any = 'T';
  reportTotal(val: any) {
    this.reportPosition = val;
  }

  settingdates(type: any) {
    let today = new Date();
    let enddate = new Date(today.setDate(today.getDate() - 1));
    if (type == 'MTD') {
      return [('0' + (enddate.getMonth() + 1)).slice(-2) + '-01' + '-' + enddate.getFullYear(),
      ('0' + (enddate.getMonth() + 1)).slice(-2) + '-' + ('0' + enddate.getDate()).slice(-2) + '-' + enddate.getFullYear()]
    }

    if (type == 'QTD') {
      if (enddate.getMonth() == 0) {
        return ['10-01-' + (enddate.getFullYear() - 1), '12-31-' + (enddate.getFullYear() - 1)]
      } else {
        let d = new Date(enddate)
        d.setMonth(d.getMonth() - 3)
        let localstringdate = d.toISOString();
        return [this.datepipe.transform(localstringdate, 'MM-dd-yyyy'), ('0' + (enddate.getMonth() + 1)).slice(-2) + '-' + ('0' + enddate.getDate()).slice(-2) + '-' + enddate.getFullYear()]
      }
    }
    if (type == 'YTD') {
      return [('0' + 1).slice(-2) + '-01' + '-' + enddate.getFullYear(), ('0' + (enddate.getMonth() + 1)).slice(-2) + '-' + ('0' + enddate.getDate()).slice(-2) + '-' + enddate.getFullYear()]
    }
    if (type == 'PYTD') {
      return ['01-01-' + (enddate.getFullYear() - 1), ('0' + (enddate.getMonth() + 1)).slice(-2) + '-' + ('0' + enddate.getDate()).slice(-2) + '-' + (enddate.getFullYear() - 1)]
    }
    if (type == 'PM') {
      var lastDayOfMonth = new Date(enddate.getFullYear() - 1, enddate.getMonth() + 1, 0);
      return [('0' + (enddate.getMonth() + 1)).slice(-2) + '-01' + '-' + (enddate.getFullYear() - 1), ('0' + (enddate.getMonth() + 1)).slice(-2) + '-' + ('0' + lastDayOfMonth.getDate()).slice(-2) + '-' + (enddate.getFullYear() - 1)]
    }
    if (type == 'LM') {
      if (enddate.getMonth() == 0) {
        return ['12-01-' + (enddate.getFullYear() - 1), '12-31-' + (enddate.getFullYear() - 1)]
      } else {
        var lastDayOfMonth = new Date(enddate.getFullYear(), enddate.getMonth(), 0);
        return [('0' + enddate.getMonth()).slice(-2) + '-01' + '-' + enddate.getFullYear(), ('0' + enddate.getMonth()).slice(-2) + '-' + ('0' + lastDayOfMonth.getDate()).slice(-2) + '-' + enddate.getFullYear()]
      }
    }
    if (type == 'LY') {
      return ['01-01-' + (enddate.getFullYear() - 1), '12-31-' + (enddate.getFullYear() - 1)]
    }
    if (type == 'LMGL') {
      let today = new Date()
      let enddate = new Date(today.setDate(today.getDate()));
      if (today.getMonth() == 0) {
        return ['12-01-' + (enddate.getFullYear() - 1), '12-31-' + (enddate.getFullYear() - 1)]
      } else {
        var lastDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        return [('0' + today.getMonth()).slice(-2) + '-01' + '-' + today.getFullYear(), ('0' + today.getMonth()).slice(-2) + '-' + ('0' + lastDayOfMonth.getDate()).slice(-2) + '-' + today.getFullYear()]
      }
    }
    if (type == 'TD') {
      return [this.datepipe.transform(new Date(), 'MM-dd-yyyy'), this.datepipe.transform(new Date(), 'MM-dd-yyyy')]
    }
    if (type == 'YD') {
      return [this.datepipe.transform(enddate, 'MM-dd-yyyy'), this.datepipe.transform(enddate, 'MM-dd-yyyy')];
    }
    if (type == 'Overall') {
      return ['', ''];
    }
    if (type == '3') {
      let startDate = new Date()
      let FromDate = new Date(startDate.setDate(startDate.getDate() - 3))
      return [this.datepipe.transform(FromDate, 'MM-dd-yyyy'), ('0' + (enddate.getMonth() + 1)).slice(-2) + '-' + ('0' + enddate.getDate()).slice(-2) + '-' + enddate.getFullYear()]
    }
    if (type == '10') {
      let startDate = new Date()
      let FromDate = new Date(startDate.setDate(startDate.getDate() - 10))
      return [this.datepipe.transform(FromDate, 'MM-dd-yyyy'), ('0' + (enddate.getMonth() + 1)).slice(-2) + '-' + ('0' + enddate.getDate()).slice(-2) + '-' + enddate.getFullYear()]
    }
    if (type == '90') {
      let dt = new Date(today.setDate(today.getDate()));
      dt.setMonth(dt.getMonth() - 3);
      return [this.datepipe.transform(dt, 'MM-dd-yyyy'), ('0' + (enddate.getMonth() + 1)).slice(-2) + '-' + ('0' + enddate.getDate()).slice(-2) + '-' + enddate.getFullYear()];

    }
    return ['', '']
  }



  applyClick() {
    if (this.storeIds.length == 0) {
      alert('Please select atleast one Store.');
    } else if (this.selectedGroups.length == 0) {
      alert('Please select atleast one value from Groupings.');
    } else if (this.selectedDep.length == 0) {
      alert('Please select atleast one Department');
    } else if (this.selectedPaytypes.length == 0) {
      alert('Please select atleast one Pay Type.');
    } else {
      let obj = {
        title: 'Service Open Ro',
        StoreID: this.storeIds,
        startdate: this.DateType() == 'ALL' ? '' : this.FromDate,
        enddate: this.DateType() == 'ALL' ? '' : this.ToDate,
        ROSTATUS: this.selectedRostatusList.includes('ALL') ? '' : this.selectedRostatusList.join(','),
        PaytypeCP: this.selectedPaytypes.includes('C') ? 'Y' : '',
        PaytypeWarranty: this.selectedPaytypes.includes('W') ? 'Y' : '',
        PaytypeInternal: this.selectedPaytypes.includes('I') ? 'Y' : '',
        Department: '',
        GrossTypeLabor: this.selectedDep.includes('S') ? 'Y' : '',
        GrossTypeParts: this.selectedDep.includes('P') ? 'Y' : '',
        GrossTypeMisc: '',
        GrossTypeSublet: '',
        CName: '',
        CZip: "",
        CState: "",
        RO_OpenDate: "",
        Inventory: this.inventoryRoslist.includes('I') ? 'N' : '',
        var1: this.selectedGroups.length > 0 ? this.selectedGroups[0].name : '',
        var2: this.selectedGroups.length > 1 ? this.selectedGroups[1].name : '',
        var3: this.selectedGroups.length > 2 ? this.selectedGroups[2].name : '',
        type: '',
        minage: this.AgeFrom,
        maxage: this.AgeTo,
        Oldro: this.top5() == true ? 'Y' : '',
        topBottom: this.reportPosition,
        groupNames: this.selectedGroupsNames
      }
      // console.log(obj);
      this.appliedFilterData.emit(obj);
    }
  }
}
