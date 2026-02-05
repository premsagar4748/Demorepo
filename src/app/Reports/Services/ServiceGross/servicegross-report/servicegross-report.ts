import { Component, effect, EventEmitter, HostListener, inject, Input, OnInit, Output, output, signal, SimpleChanges, ViewChild } from '@angular/core';
// import { Apiservice } from '../../../../providers/services/apiservice';
import { Sharedservice } from '../../../../Core/Providers/Shared/sharedservice';
import { FormsModule } from '@angular/forms';
import { BsDatepickerModule, BsDaterangepickerDirective } from 'ngx-bootstrap/datepicker';
import { DatePipe, NgFor, NgIf, NgStyle } from '@angular/common';
// import { ToastrService } from 'ngx-toastr';
import { common } from '../../../../common';
import { Stores } from '../../../../CommonFilters/stores/stores';
import { DateRangePicker } from '../../../../CommonFilters/date-range-picker/date-range-picker';
@Component({
  selector: 'app-servicegross-report',
  standalone: true,
  imports: [FormsModule, NgIf,  BsDatepickerModule,Stores,NgStyle,DateRangePicker],
  templateUrl: './servicegross-report.html',
  styleUrl: './servicegross-report.scss',
  providers: [DatePipe]
})

export class ServicegrossReport implements OnInit {
  ngChanges: any = []
  @Input() filterData: any = []

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


  @Output() appliedFilterData: any = new EventEmitter<any>();
  bsRangeValue = signal<Date[]>([]);
  sortedStores = signal<any>(['Tropical1', 'Tropical2', 'Tropical Chevrolet']);
  groupSettingList = signal<any>([]);
  sortedGroups: any = []; laborTypelist = signal<any>([]);
  userInfo = signal<any>(''); userId = signal<any>('');
  laborGroupList = signal<any>([{ type: 'A', name: 'All Labor Types' }, { type: 'S', name: 'All Labor Types W/O Details' }, { type: 'Y', name: 'Policy Account' }]);
  selectedStores = signal<any>([]); selectedGroups: any = [];
  timeFrame: any = signal<string>(''); selectedLabortypes: any = [];
  selectedDep: any = ['S', 'P', 'Q']; selectedPaytypes: any = ['C', 'W', 'I']; selectedGrosstypes: any = [];
  reprttotal = signal<string>('');
  groupingNames: any = [
    { "id": 40, "name": "Store_Name" },
    { "id": 26, "name": "ServiceAdvisor_Name" },
    { "id": 27, "name": "serviceadvisor" },
    { "id": 28, "name": "techname" },
    { "id": 29, "name": "techno" },
    { "id": 30, "name": "PType" },
    { "id": 31, "name": "vehicle_Year" },
    { "id": 32, "name": "vehicle_Make" },
    { "id": 33, "name": "Vehicle_Model" },
    { "id": 34, "name": "Vehicle_Odometer" },
    { "id": 35, "name": "CName" },
    { "id": 36, "name": "CZip" },
    { "id": 37, "name": "CState" },
    { "id": 38, "name": "cdate" },
    { "id": 39, "name": "No Grouping" },
    { "id": 68, "name": "opcode" }
  ]

  // @ViewChild('datepicker') datepicker!: BsDaterangepickerDirective;
  // datepipe = inject(DatePipe); toastr = inject(ToastrService);

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
    this.DateType = this.ngChanges.datetype;
    this.setDates(this.ngChanges.datetype)

  }

  constructor(public shared: Sharedservice,public common:common) {
  

    const storedUser = localStorage.getItem('userInfo');
    // console.log('user info', storedUser);
    this.userInfo.set(storedUser ? JSON.parse(storedUser) : null);
    this.userId.set(this.userInfo().user_Info.userid);
    this.loadCalls();
    // this.applyClick();

    const D = localStorage.getItem('department');
    if(D == 'Service'){
      this.selectedDep = ['S']
    }
    else{
      this.selectedDep = ['S', 'P', 'Q']
    }
  
    effect(() => {
      const stores:any = this.shared.api.getStores();
      console.log('filter stores : ', stores);
    })
  }

  ngOnInit() {
    this.maxDate = new Date();
    this.maxDate.setDate(this.maxDate.getDate());
  }
  ngAfterViewInit() {
    this.shared.api.getStores().subscribe((res: any) => {
      // console.log(this.shared.common.pageName);

      if (this.shared.common.pageName == 'SERVICE GROSS') {
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
  
  loadCalls() {
    this.getStoreList();
    this.getGroupSettings();
    this.getLaborTypes('A');
  }

  lTypeClickAll(val: any) {
    this.selectedLabortypes = [];
    if (val == 'add') {
      this.selectedLabortypes = this.laborTypelist().map((val: any) => {
        return val
      })
    }
  }

  activePopover: number = -1;
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
    return this.shared.api.postmethod(this.common.routeEndpoint +'GetStoresList', obj)
      .subscribe((res: any) => {
        if (res.status == 200) {
          this.sortedStores.set(res.response);
          this.selectedStores.set(this.sortedStores().map((val: any) => {
            return val.ID
          }))
        } else {
          this.sortedStores.set([]);
        }
        // console.log(this.sortedStores, ' store list');
      })
  }

  removerGroupArray = signal<any>(['pay type', 'no grouping', 'tech name', 'tech number']);
  selectedGroupsNames:any = [];
  getGroupSettings() {
    let obj = {
      "pageid": 2
    }
    return this.shared.api.postmethod(this.common.routeEndpoint +'GetDataGroupingsbyPage', obj)
      .subscribe((res: any) => {
        // console.log(res, ' group setting');
        if (res.status == 200) {
          const removeArr = res.response.filter((item:any) => !this.removerGroupArray().includes(item.ARG_LABEL.toLowerCase()))
          // console.log('remover grouping array :', removeArr);
          this.groupSettingList.set(removeArr);
          const array: any[] = this.groupSettingList().slice(0, 2);
          this.selectedGroupsNames = array.map((item: any) => item.ARG_LABEL);
          this.groupingNames.forEach((item1: any) => {
            if (array.some((item2: any) => item1.id === item2.ARG_ID)) {
              this.selectedGroups.push(item1);
              console.log(this.selectedGroups,'selectedGroups');
              
            }
          });
        } else {
          this.groupSettingList.set([]);
        }
        // console.log(this.groupSettingList, ' group setting');
      })
  }

  isSelectedGroups(id: number): boolean {
    return this.selectedGroups.some((s: any) => s.id === id);
  }

  clickGroups(list: any) {
    const index = this.selectedGroups.findIndex(
      (item: any) => item.id === list.ARG_ID
    );
    if (index > -1) {
      this.selectedGroups.splice(index, 1);
      this.selectedGroupsNames.splice(index, 1);
    } else if (this.selectedGroups.length < 3) {
      this.groupingNames.forEach((item1: any) => {
        if (item1.id === list.ARG_ID) {
          this.selectedGroups.push(item1);
          this.selectedGroupsNames.push(list.ARG_LABEL);
        }
      });
    } else {
      alert('Select Upto 3 Filters Only to group your data');
    }
    if (this.selectedGroups.length == 0) {
      alert('Please select atleast one value from Grouping.');
    }

  }

  lType = signal<string>('A');
  getLaborTypes(type: any) {
    this.lType.set(type);
    let obj = {
      'StoreId': this.userInfo()?.userstores,
      'type': type
    }
    return this.shared.api.postmethod(this.common.routeEndpoint +'GetLaborTypesTechEfficiency', obj)
      .subscribe((res: any) => {
        // console.log(res, 'labor types');
        if (res.status == 200) {
          this.laborTypelist.set(res?.response);
          this.selectedLabortypes = this.laborTypelist().map((val: any) => {
            return val
          })
          // console.log(this.selectedLabortypes, ' selected selectedLabortypes');
        } else {
          this.laborTypelist.set([]);
        }
      })
  }

  show() {
    this.isCalendarOpen.set(true);
    setTimeout(() => {
      let el: HTMLElement = document.getElementById('DOB') as HTMLElement
      el.click();
    }, 100);
  }

  custom = signal<boolean>(false);
  
  isCalendarOpen = signal<boolean>(false);
 bsDateRange!: Date[];


  handler1(value: string): void {
    if ('onShown1' === value) {
      this.isCalendarOpen.set(true);
    }
    if ('onHidden1' === value) {
      this.isCalendarOpen.set(false);
      (<HTMLInputElement>document.getElementById('DOB')).click();
    }
  }




  laborTypeClick(val: any) {
    const index = this.selectedLabortypes.indexOf(val);

    if (index === -1) {
      this.selectedLabortypes.push(val);
    } else {
      this.selectedLabortypes.splice(index, 1);
    }

    // console.log(this.selectedLabortypes);
  }

  departmentClick(val: any) {
    const index = this.selectedDep.indexOf(val);

    if (index === -1) {
      this.selectedDep.push(val);
    } else {
      this.selectedDep.splice(index, 1);
    }
    if (this.selectedDep.length == 0) {
      alert('Please select atleast one Department');
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
      alert('Please select atleast one PayType.');
    }
    // console.log(this.selectedPaytypes);
  }

  includeClick(val: any) {
    const index = this.selectedGrosstypes.indexOf(val);

    if (index === -1) {
      this.selectedGrosstypes.push(val);
    } else {
      this.selectedGrosstypes.splice(index, 1);
    }

    // console.log(this.selectedGrosstypes);
  }

  reportPosition: any = 'T';
  reportTotal(val: any) {
    this.reportPosition = val;
  }

   scrollPosition = 0;

  getScrollPosition(event: any): void {
    this.scrollPosition = event.target.scrollLeft ;
    console.log(this.scrollPosition,event.target.scrollTop);
    
  }

  applyClick() {
    // console.log(this.selectedStores, ' At apply');
    if (this.storeIds.length == 0) {
      alert('Please select atleast one store.');
    } else if (this.selectedGroups.length == 0) {
      alert('Please select atleast one value from Grouping.');
    } else if (this.selectedDep.length == 0) {
      alert('Please select atleat one Department.');
    } else if (this.selectedPaytypes.length == 0) {
      alert('Please select atleast one PayType.');
    } else {
      let obj = {
        "topBottom": this.reportPosition,
        "startdate": this.FromDate,
        "enddate": this.ToDate,
        "StoreID": this.storeIds,
        "AdvisorNumber": "",
        "AdvisorName": "",
        "ROSTATUS": "",
        "PaytypeC": this.selectedPaytypes.includes('C') ? 'C' : '',
        "PaytypeW": this.selectedPaytypes.includes('W') ? 'W' : '',
        "PaytypeI": this.selectedPaytypes.includes('I') ? 'I' : '',
        "DepartmentS": this.selectedDep.includes('S') ? 'S' : '',
        "DepartmentP": this.selectedDep.includes('P') ? 'P' : '',
        "DepartmentQ": this.selectedDep.includes('Q') ? 'Q' : '',
        "DepartmentB": this.selectedDep.includes('B') ? 'B' : '',
        "DepartmentD": this.selectedDep.includes('D') ? 'D' : '',
        "GrossTypeM": this.selectedGrosstypes.includes('M') ? 'M' : '',
        "GrossTypeL": this.selectedGrosstypes.includes('L') ? 'L' : '',
        "GrossTypeS": this.selectedGrosstypes.includes('S') ? 'S' : '',
        "GrossTypeP": "",
        "PolicyAccount": "N",
        "excludeZeroHours": this.selectedGrosstypes.includes('Z') ? 'Y' : 'N',
        "vehicle_Year": "",
        "vehicle_Make": "",
        "Vehicle_Model": "",
        "Vehicle_Odometer": "",
        "CName": "",
        "CZip": "",
        "CState": "",
        "RO_CloseDate": "",
        "var1": this.selectedGroups.length > 0 ? this.selectedGroups[0].name : '',
        "var2": this.selectedGroups.length > 1 ? this.selectedGroups[1].name : '',
        "var3": this.selectedGroups.length > 2 ? this.selectedGroups[2].name : '',
        "type": "",
        "LaborTypes": (this.selectedLabortypes.length > 0) ? this.selectedLabortypes.map((item: any) => item.ASD_labortype).join(',') : '',
        "groupNames" : this.selectedGroupsNames
      }
      // console.log('setObj ', obj);
      // this.api.setFilterData(obj);
      this.appliedFilterData.emit(obj);
    }
  }
}
