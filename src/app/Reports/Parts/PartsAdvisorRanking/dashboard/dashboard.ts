import { Sharedservice } from '../../../../Core/Providers/Shared/sharedservice';
import { SharedModule } from '../../../../Core/Providers/Shared/shared.module';
import { Component, ViewChild, ElementRef, HostListener, SimpleChanges } from '@angular/core';
// import { Subscription } from 'rxjs';
import { Setdates } from '../../../../Core/Providers/SetDates/setdates';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { common } from '../../../../common';
import { Stores } from '../../../../CommonFilters/stores/stores';
import { BehaviorSubject, Subscription } from 'rxjs';
import { DateRangePicker } from '../../../../CommonFilters/date-range-picker/date-range-picker';
@Component({
  selector: 'app-dashboard',
  imports: [SharedModule, BsDatepickerModule, Stores,DateRangePicker],
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  SalesPersonsData: any = [];
  ServiceAdvisorData: any = [];

  TotalSalesPersonsData: any = [];
  FromDate: any = '';
  ToDate: any = '';
  minDate!: Date;
  maxDate!: Date;
  DateType: any = 'MTD';
  displaytime: any = '';
  NoData: boolean = false;
  path1: any = '';
  path2: any = '';
  path3: any = '';
  TotalReport: any = 'T';
  storeIds: any = '0';
  CompleteComponentState: boolean = true;
  dateType: any = 'MTD';

  // solutionurl: any = environment.apiUrl;
  LogCount = 1;
  groups: any = 1;
  StoreVal: any = '0';
  columnName: any = 'TotalGross';
  columnState: any = 'desc';
  storeorgrp: any = 'G';
  otherstoreid: any = '';
  selectedotherstoreids: any = '';

  header: any = [{
    type: 'Bar', storeIds: this.StoreVal, storeorgroup: this.storeorgrp, groups: this.groups, otherstoreids: this.otherstoreid, selectedotherstoreids: this.selectedotherstoreids
  }]
  popup: any = [{ type: 'Popup' }];
  reportOpenSub!: Subscription;
  reportGetting!: Subscription;
  Pdf!: Subscription;
  print!: Subscription;
  email!: Subscription;
  excel!: Subscription;
  stores: any = []
  groupsArray: any = [];
  storename: any = ''
  storecount: any = null;
  storedisplayname: any = '';
  groupName: any = '';
  groupId: any = 8;
  storeorgroup: any = 'G';
  storesFilterData: any = {
    'groupsArray': this.groupsArray, 'groupId': this.groupId, 'storesArray': this.stores, 'storeids': '1', 'type': 'M', 'others': 'N',
    'groupName': this.groupName, 'storename': this.storename, storecount: null, 'storedisplayname': this.storedisplayname
  };
  Dates: any = {
    'FromDate': this.FromDate, 'ToDate': this.ToDate, "MaxDate": this.maxDate, 'MinDate': this.minDate, 'DateType': this.DateType, 'DisplayTime': this.displaytime,
    Types: [
      { 'code': 'MTD', 'name': 'MTD' },
      { 'code': 'QTD', 'name': 'QTD' },
      { 'code': 'YTD', 'name': 'YTD' },
      { 'code': 'PYTD', 'name': 'PYTD' },
      { 'code': 'LY', 'name': 'Last Year' },
      { 'code': 'LM', 'name': 'Last Month' },
      { 'code': 'PM', 'name': 'Same Month PY' },
    ]
  }
  constructor(
 
    public shared: Sharedservice, public setdates: Setdates, private comm: common,
  ) {
    if (localStorage.getItem('userInfo') != null && localStorage.getItem('userInfo') != undefined) {
      this.storeIds = JSON.parse(localStorage.getItem('userInfo')!).user_Info.ustores.split(',')
    }
    if (this.shared.common.groupsandstores.length > 0) {
      this.groupsArray = this.shared.common.groupsandstores.filter((val: any) => val.sg_id != this.shared.common.reconID);
      this.stores = this.shared.common.groupsandstores.filter((v: any) => v.sg_id == this.groupId)[0].Stores;
      this.storeIds.length == this.stores.length ? this.groupName = this.stores[0].sg_Name : this.groupName = ''
      this.storeIds.length == 1 ? this.storename = this.stores.filter((e: any) => e.ID == this.storeIds)[0].storename : this.storename = ''
      // // console.log(this.stores, this.groupsArray, 'Stores and Groups');
      this.getStoresandGroupsValues()
      // this.StoresData(this.ngChanges)
    }

    let today = new Date();

    if (localStorage.getItem('UserDetails') != null) {
      this.groups = JSON.parse(localStorage.getItem('UserDetails')!).groupID

      this.StoreVal = JSON.parse(localStorage.getItem('UserDetails')!).Store_Ids;
      let otherid = JSON.parse(localStorage.getItem('UserDetails')!).oth_stores
      this.otherstoreid = otherid ? (otherid.toString().indexOf(',') > 0 ?
        otherid.toString().split(',') :
        otherid.toString()) : '';
        this.selectedotherstoreids= this.comm.DefaultOtherstoresSelection
    }
    let enddate = new Date(today.setDate(today.getDate() - 1));
    this.FromDate =
      ('0' + (enddate.getMonth() + 1)).slice(-2) +
      '-01' +
      '-' +
      enddate.getFullYear();
    // let dt = new Date(today.setDate(today.getDate() ));   
    // dt.setMonth(dt.getMonth() - 3);

    // this.FromDate = this.datepipe.transform(dt,'MM-dd-yyyy')
    this.ToDate =
      ('0' + (enddate.getMonth() + 1)).slice(-2) +
      '-' +
      ('0' + enddate.getDate()).slice(-2) +
      '-' +
      enddate.getFullYear();
    this.FromDate = this.FromDate.replace(/-/g, '/');
    this.ToDate = this.ToDate.replace(/-/g, '/');
    this.shared.setTitle(this.shared.common.titleName +  '-Parts Counter Person Rankings');
    const data = {
      title: 'Parts Counter Person Rankings',
      path1: '',
      path2: '',
      path3: '',
      stores: this.StoreVal.toString(),
      toporbottom: this.TotalReport,
      datetype: 'MTD',
      fromdate: this.FromDate,
      todate: this.ToDate,
      groups: this.groups,
      storeorgroup: this.storeorgrp,
      count: 0
    };
    this.shared.api.SetHeaderData({
      obj: data,
    });
    this.header = [{
      type: 'Bar', storeIds: this.StoreVal, storeorgroup: this.storeorgrp, groups: this.groups, otherstoreids: this.otherstoreid, selectedotherstoreids: this.selectedotherstoreids
    }]

    this.GetData('TotalGross', 'desc');
    this.setDates(this.DateType)
  }

  ngOnInit(): void {


    localStorage.setItem('time', this.dateType);

    // var curl = 'https://fbxtract.axelautomotive.com/favouritereports/GetPartsCounterPersonRankings';
    // this.apiSrvc.logSaving(curl,{},'','Success','Parts Counter Person Rankings');
  }
  tabClick(col_Name: any) {

    // First click on a column
    if (this.columnName !== col_Name) {
      this.columnName = col_Name;
      this.columnState = 'asc';   // 👈 start with ASC on first click
    }
    // Clicking same column again → toggle
    else {
      this.columnState = this.columnState === 'asc' ? 'desc' : 'asc';
    }
  
    this.GetData(this.columnName, this.columnState);
  }
  // tabClick(col_Name: any, Col_state: any) {
  //   if (this.columnName == col_Name) {
  //     if (Col_state == 'asc') {
  //       this.columnState = 'desc';
  //       this.GetData(this.columnName, this.columnState);
  //     } else {
  //       this.columnState = 'asc';
  //       this.GetData(this.columnName, this.columnState);
  //     }
  //   } else {
  //     if (this.storeorgrp == 'G' && (col_Name != 'Rank' && col_Name != 'ServiceAdvisor' && col_Name != 'StoreName')) {
  //       this.columnState = 'desc';
  //       this.columnName = col_Name;
  //       this.GetData(this.columnName, this.columnState);
  //     } else {
  //       this.columnState = 'asc';
  //       this.columnName = col_Name;
  //       this.GetData(this.columnName, this.columnState);
  //     }
  //   }
  //   console.log(this.columnName, this.columnState);
  // }
  GetData(sortdata?: any, sortstate?: any) {
    this.ServiceAdvisorData = [];
    this.shared.spinner.show();
    const obj = {
      StartDate: this.FromDate,
      EndDate: this.ToDate,
      StoreID:this.storeIds,

      Exp: sortdata,
      OrderType: sortstate,
      RankBy: this.storeorgroup,
      UserID: 0,
    };
    let startFrom = new Date().getTime();
    // const curl = environment.apiUrl + this.comm.routeEndpoint + 'GetPartsCounterPersonRankings';
    this.shared.api
      .postmethod(this.comm.routeEndpoint + 'GetPartsCounterPersonRankings', obj)
      .subscribe(
        (res) => {
          // const currentTitle = document.title;
          // this.shared.api.logSaving(curl, {}, '', res.message, currentTitle);
          if (res.status == 200) {
            if (res.response != undefined) {
              if (res.response.length > 0) {
                let resTime = (new Date().getTime() - startFrom) / 1000;
                // this.logSaving(
                //   this.solutionurl + this.comm.routeEndpoint+'GetPartsCounterPersonRankings',
                //   obj,
                //   resTime,
                //   'Success'
                // );
                this.ServiceAdvisorData = res.response;
                this.shared.spinner.hide();
                let position = this.scrollCurrentposition + 10
                setTimeout(() => {
                  this.scrollcent.nativeElement.scrollTop = position
                  // //console.log(position);

                }, 500);
                this.NoData = false;

                // this.ServiceAdvisorData.some(function (x: any) {
                //   x.Data2 = JSON.parse(x.Data2);
                //   x.Dealerx = '+';
                //   return false;
                // });
                // this.GetTotalData();
              } else {
                // this.toast.error('Empty Response', '');
                this.shared.spinner.hide();
                this.NoData = true;
              }
            } else {
              let resTime = (new Date().getTime() - startFrom) / 1000;
              // this.logSaving(
              //   this.solutionurl + this.comm.routeEndpoint+'GetPartsCounterPersonRankings',
              //   obj,
              //   resTime,
              //   'Error'
              // );
              // this.toast.error(res.status, '');
              this.shared.spinner.hide();
              this.NoData = true;
            }
          }
          else {
            // this.toast.error(res.status, '');
            this.shared.spinner.hide();
            this.NoData = true;
          }
        },
        (error) => {
          // this.toast.error('502 Bad Gate Way Error', '');
          this.shared.spinner.hide();
          this.NoData = true;
        }
      );
  }

  openDetails(Item:any) {
    //lsPartsPerson.componentInstance.Partsdetails = [
    //   {
    //     StartDate: this.FromDate,
    //     EndDate: this.ToDate,
    //     var1: 'DealerName',
    //     var2: 'AP_CounterPerson',
    //     var3: '',
    //     var1Value: Item.StoreName,
    //     var2Value: Item.CounterPerson,
    //     var3Value: '',
    //     userName: Item.CounterPerson,
    //     type: Item.type,
    //     Labortype: 'C,T,I',
    //     Saletype: 'R,W',
    //     Store:  Item.StoreName,
    //     PartsSource: ''
    //   },
    // ];
  }
  public inTheGreen(value: number): boolean {
    if (value >= 0) {
      return true;
    }
    return false;
  }
  expandorcollapse(ind: any, e: any, ref: any, Item: any) {
    let id = (e.target as Element).id;
    if (id == 'D_' + ind) {
      if (ref == '-') {
        Item.Dealerx = '+';
      }
      if (ref == '+') {
        Item.Dealerx = '-';
      }
    }
  }

  isDesc: boolean = false;
  column: string = 'CategoryName';
  sort(property: any) {
    this.isDesc = !this.isDesc; //change the direction
    this.column = property;
    let direction = this.isDesc ? 1 : -1;
    if (this.TotalReport == 'T') {
      var arr = this.ServiceAdvisorData.slice(
        1,
        this.ServiceAdvisorData.length
      );
      arr.sort(function (a: any, b: any) {
        if (a[property] < b[property]) {
          return -1 * direction;
        } else if (a[property] > b[property]) {
          return 1 * direction;
        } else {
          return 0;
        }
      });
      arr.unshift(this.ServiceAdvisorData[0]);
      this.ServiceAdvisorData = arr;
    } else {
      var arr = this.ServiceAdvisorData.slice(0, -1);
      arr.sort(function (a: any, b: any) {
        if (a[property] < b[property]) {
          return -1 * direction;
        } else if (a[property] > b[property]) {
          return 1 * direction;
        } else {
          return 0;
        }
      });
      arr.push(this.ServiceAdvisorData[this.ServiceAdvisorData.length - 1]);
      this.ServiceAdvisorData = arr;
    }
  }
  SARstate: any;
  ngAfterViewInit(): void {
    this.shared.api.getStores().subscribe((res: any) => {
      if (this.comm.pageName == 'Parts Counter Person Rankings') {
        if (res.obj.storesData != undefined) {
          this.groupsArray = res.obj.storesData;
          // this.groupId = this.ngChanges.groups;
          this.stores = this.shared.common.groupsandstores.filter((v: any) => v.sg_id == this.groupId)[0].Stores;
          // this.storeIds = this.ngChanges.storeIds;
          this.storeIds.length == this.stores.length ? this.groupName = this.stores[0].sg_name : this.groupName = ''
          this.storeIds.length == 1 ? this.storename = this.stores.filter((e: any) => e.ID == this.storeIds)[0].storename : this.storename = ''
          // // console.log(this.stores, this.groupsArray, 'Stores and Groups');
          this.getStoresandGroupsValues()
        }
      }
    })
    this.reportOpenSub = this.shared.api.GetReportOpening().subscribe((res) => {
      if (this.reportOpenSub != undefined) {
        // //console.log(res);
        if (res.obj.Module == 'Parts Counter Person Rankings') {
          document.getElementById('report')?.click()
        }
      }
    });
    this.reportGetting = this.shared.api.GetReports().subscribe((data) => {
      if (this.reportGetting != undefined) {

        if (data.obj.Reference == 'Parts Counter Person Rankings') {
          console.log(this.columnState);

          if (data.obj.header == undefined) {
            this.StoreVal = data.obj.storeValues;
            this.TotalReport = data.obj.TotalReport;
            this.storeorgrp = data.obj.storeorgroup;
            this.groups = data.obj.groups;
            this.selectedotherstoreids = data.obj.otherstoreids;
            if (data.obj.FromDate != undefined && data.obj.ToDate != undefined) {
              this.FromDate = data.obj.FromDate;
              this.ToDate = data.obj.ToDate;
              this.storeIds = data.obj.storeValues;
              this.dateType = data.obj.dateType;
              this.selectedotherstoreids = data.obj.otherstoreids;
              this.GetData(this.columnName, this.columnState);
            } else {
              this.FromDate = data.obj.FromDate;
              this.ToDate = data.obj.ToDate;
              this.storeIds = data.obj.storeValues;
              this.dateType = data.obj.dateType;
              this.selectedotherstoreids = data.obj.otherstoreids;
              this.GetData(this.columnName, this.columnState);
            }
          }
          else {
            if (data.obj.header == 'Yes') {


              this.StoreVal = data.obj.storeValues;
              //console.log(this.StoreVal);
              this.GetData(this.columnName, this.columnState);

            }
          }
          console.log(this.columnState);
          
          const headerdata = {
            title: 'Parts Counter Person Rankings',
            path1: '',
            path2: '',
            path3: '',
            stores: this.StoreVal,
            toporbottom: this.TotalReport,
            datetype: this.dateType,
            fromdate: this.FromDate,
            todate: this.ToDate,
            groups: this.groups,
            storeorgroup: this.storeorgrp,
          };
          this.shared.api.SetHeaderData({
            obj: headerdata,
          });
          this.header = [{
            type: 'Bar', storeIds: this.StoreVal, storeorgroup: this.storeorgrp, groups: this.groups, otherstoreids: this.otherstoreid, selectedotherstoreids: this.selectedotherstoreids
          }]
        }
      }
    });
    this.excel = this.shared.api.getExportToExcelAllReports().subscribe((res) => {
      if (this.excel != undefined) {
        this.SARstate = res.obj.state;
        if (res.obj.title == 'Parts Counter Person Rankings') {
          if (res.obj.state == true) {
            this.exportToExcel();
          }
        }
      }
    });

    this.print = this.shared.api.getExportToPrintAllReports().subscribe((res) => {
      if (this.print != undefined) {
        if (res.obj.title == 'Parts Counter Person Rankings') {
          if (res.obj.statePrint == true) {
            // this.GetPrintData();
          }
        }
      }
    });
    this.Pdf = this.shared.api.getExportToPDFAllReports().subscribe((res) => {
      if (this.Pdf != undefined) {
        if (res.obj.title == 'Parts Counter Person Rankings') {
          if (res.obj.statePDF == true) {
            // this.generatePDF();
          }
        }
      }
    });
    this.email = this.shared.api.getExportToEmailPDFAllReports().subscribe((res) => {
      if (this.email != undefined) {
        if (res.obj.title == 'Parts Counter Person Rankings') {
          if (res.obj.stateEmailPdf == true) {
            // this.sendEmailData(res.obj.Email, res.obj.notes, res.obj.from);
          }
        }
      }
    });

  }
  
  getStoresandGroupsValues() {


    //   this.stores = this.comm.groupsandstores.filter((v: any) => v.sg_id == this.groupId[0])[0].Stores;
    //   // console.log( this.stores)
    //   this.storeIds = []
    //   this.storeIds.push(1)
    //  // console.log( this.storeIds.length)
    //   // let data = this.comm.completeUserDetails;
    //   // data.Store_Ids.indexOf(',') > 0 ? this.storeIds.push(parseInt(data.Store_Ids.split(',')[0])) : this.storeIds.push(data.Store_Ids)
    //   this.storecount = this.storeIds.length
    //   if (this.storeIds.length == 1) {
    //     this.storename = this.stores.filter((val: any) => val.ID == this.storeIds.toString())[0].storename;
    //     this.storecount = null;
    //     this.storedisplayname = this.storename
    //   }
    //   else if (this.storeIds.length == this.stores.length) {
    //     this.groupName = this.groupsArray.filter((val: any) => val.sg_id == this.groupId[0])[0].sg_name;
    //     this.storecount = null;
    //     this.storedisplayname = this.groupName;
    //   }
    //   else if (this.storeIds.length > 1) {
    //     this.storecount = this.storeIds.length;
    //     this.storedisplayname = 'Selected'
    //   }
    //   else {
    //     this.storedisplayname = 'Select'
    //   }

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

    // this.setHeaderData();
    // this.GetData();

  }
  Favreports: any = [];



  StoresData(data: any) {
    // alert('Hi')
    console.log(data, 'Data');

    this.storeIds = data.storeids;
    this.groupId = data.groupId;
    this.storename = data.storename;
    this.groupName = data.groupName;
    this.storecount = data.storecount;
    this.storedisplayname = data.storedisplayname;
  }
  ngOnDestroy() {
    // this.reportOpenSub.unsubscribe()
    // this.reportGetting.unsubscribe()
    // this.Pdf.unsubscribe()
    // this.print.unsubscribe()
    // this.email.unsubscribe()
    // this.excel.unsubscribe()

    if (this.reportOpenSub != undefined) {
      this.reportOpenSub.unsubscribe()
    }
    if (this.reportGetting != undefined) {
      this.reportGetting.unsubscribe()
    }
    if (this.excel != undefined) {
      this.excel.unsubscribe()
    }
    if (this.Pdf != undefined) {
      this.Pdf.unsubscribe()
    }
    if (this.print != undefined) {
      this.print.unsubscribe()
    }
    if (this.email != undefined) {
      this.email.unsubscribe()
    }
  }
  // reportOpen(temp: any) {


  //   this.ngbmodalActive = this.ngbmodal.open(temp, {
  //     size: 'xl',
  //     backdrop: 'static',
  //   });
  // }

  // currentElement: string;

  // @ViewChild('scrollOne') scrollOne: ElementRef;
  // @ViewChild('scrollTwo') scrollTwo: ElementRef;

  // updateVerticalScroll(event): void {
  //   if (this.currentElement === 'scrollTwo') {
  //     this.scrollOne.nativeElement.scrollTop = event.target.scrollTop;
  //   } else if (this.currentElement === 'scrollOne') {
  //     this.scrollTwo.nativeElement.scrollTop = event.target.scrollTop;
  //   }
  // }

  // updateCurrentElement(element: 'scrollOne' | 'scrollTwo') {
  //   this.currentElement = element;
  // }

  // openDetails(Item) {
  //   this.CompleteComponentState = false;
  //   const DetailsSalesPeron = this.ngbmodal.open(SalespersonsDealsComponent, {
  //     // size:'xl',
  //     backdrop: 'static',
  //   });
  //   DetailsSalesPeron.componentInstance.Dealdetails = Item;
  //   DetailsSalesPeron.result.then(
  //     (data) => {},
  //     (reason) => {
  //       // on dismiss
  //       this.CompleteComponentState = true;
  //     }
  //   );
  // }

  logSaving(url: any, object: any, time: any, status: any) {
    let ip = localStorage.getItem('Browser');
    // //console.log(object);
    const data = JSON.parse(localStorage.getItem('UserDetails')!);
    // //console.log(data);
    if (
      data != 'None' &&
      data != undefined &&
      data != null &&
      data != '' &&
      this.LogCount == 1
    ) {
      const obj = {
        UL_DealerId: '1',
        UL_GroupId: '',
        UL_UserId: data.userid,
        UL_IpAddress: ip!.split(',')[1],
        UL_Browser: ip!.split(',')[0],
        UL_Absolute_URL: window.location.href,
        UL_Api_URL: url,
        UL_Api_Request: JSON.stringify(object),
        UL_PageName: 'Parts Counter Person Rankings',
        UL_ResponseTime: time,
        UL_Token: '',
        UL_ResponseStatus: status,
        UL_Groupings: '',
        UL_Timeframe: '',
        UL_Stores: '',
        UL_Filters: '',
        UL_Teams: '',
        UL_Status: 'Y',
      };
      // //console.log(obj);
      this.shared.api.postmethod('useractivitylog', obj).subscribe((val) => {
        // //console.log(val);
        this.LogCount = 0;
      });
    }
  }

  ExcelStoreNames: any = [];

  exportToExcel(): void {
    const workbook = this.shared.getWorkbook();
    const worksheet = workbook.addWorksheet('Parts Counter Person Rankings');
    const title = worksheet.addRow(['Parts Counter Person Rankings']);
    title.font = { size: 14, bold: true, name: 'Arial' };
    title.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.mergeCells('A1:L1');
    worksheet.addRow([]);
    const formattedFromDate = this.shared.datePipe.transform(this.FromDate, 'dd-MMM-yyyy');
    const formattedToDate = this.shared.datePipe.transform(this.ToDate, 'dd-MMM-yyyy');
  
    // ===== STORE VALUE FOR EXCEL (FROM UI SELECTION) =====
  
  let storeValue = '';
  
  const selectedStoreIds: string[] =
    this.storeIds && this.storeIds.length
      ? this.storeIds.map((id: any) => id.toString())
      : [];
  
  const allStores: any[] = Array.isArray(this.stores) ? this.stores : [];
  
  // ✅ Bind ONLY selected store names
  storeValue = allStores
    .filter((s: any) => selectedStoreIds.includes(s.ID.toString()))
    .map((s: any) => s.storename.trim())
    .filter(Boolean)
    .join(', ');
  
  // ✅ Final fallback (safety)
  if (!storeValue && selectedStoreIds.length) {
    storeValue = selectedStoreIds.join(', ');
  }
  const filters = [
    { name: 'Store:', values: storeValue },
      { name: 'Time Frame:', values: `${formattedFromDate} to ${formattedToDate}` },
      { name: 'Rank By:', values: this.storeorgroup == 'S' ? 'Store' : 'Group' },
      // { name: 'New/Used:', values: this.neworused || 'All' },
      // { name: 'Deal Type:', values: this.retailorlease || 'All' },
      // { name: 'Deal Status:', values: this.dealStatus || 'All' },
    ];
  
  
    let currentRow = worksheet.lastRow?.number ?? worksheet.rowCount;
    filters.forEach((filter) => {
      currentRow++;
  
  
      let value = Array.isArray(filter.values)
        ? filter.values.join(', ')
        : filter.values;
  
      const row = worksheet.addRow([filter.name, value]);
      row.getCell(1).font = { bold: true, name: 'Arial', size: 10 };
      row.getCell(2).font = { name: 'Arial', size: 10, color: { argb: 'FF1F497D' } }; // blue color for values
      worksheet.mergeCells(`B${currentRow}:F${currentRow}`);
    });
  
    worksheet.addRow([]);
  
  
  
    const firstHeader = [ '',  'MTD', '', '', '', '',  '', '', ''];
    const headerRow1 = worksheet.addRow(firstHeader);
  
  
    const secondHeader = [
      'Rank',
      'Counter person',
      'Store Name',
      'Total Sale',
      'Total Gross',
      'GP%',
      'Invoice Count',
      'Parts Count',
      'Parts per Invoice',
    ];
    const headerRow2 = worksheet.addRow(secondHeader);
  
    const headerRow1Index = headerRow1.number;
    const headerRow2Index = headerRow2.number;
  
  
    worksheet.mergeCells(`A${headerRow1Index}`);
    worksheet.mergeCells(`B${headerRow1Index}`);
    worksheet.mergeCells(`C${headerRow1Index}`);
    worksheet.mergeCells(`D${headerRow1Index}:H${headerRow1Index}`); // Back Gross
    worksheet.mergeCells(`I${headerRow1Index}`); // Unit Count
  
    [headerRow1, headerRow2].forEach(r => {
      r.height = 22;
      r.eachCell({ includeEmpty: false }, (cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2F5597' }, // deep blue
        };
      });
    });
  
  
  
    const bindingHeaders = [
      'Rank', 'CounterPerson', 'StoreName',
      'TotalSale', 'TotalGross',
      'GP', 'InvoiceCount', 'AP_Numberofparts', 'PartsPerInvoice'
    ];
  
    const currencyFields = ['TotalSale', 'TotalGross'];
  
    this.ServiceAdvisorData.forEach((info: any) => {
      const rowData = bindingHeaders.map((key) => {
        const val = info[key];
        return (val === 0 || val == null || val === '') ? '-' : val;
      });
  
      const dataRow = worksheet.addRow(rowData);
  
      bindingHeaders.forEach((key, index) => {
        const cell = dataRow.getCell(index + 1);
  
        if (currencyFields.includes(key) && typeof cell.value === 'number') {
          cell.numFmt = '"$"#,##0.00';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });
  
  
    worksheet.columns.forEach(col => col.width = 25);
  
  
    workbook.xlsx.writeBuffer().then(buffer => {
      this.shared.exportToExcel(workbook, 'Parts Counter Person Rankings');
    });
  }
  // comments code

  Scrollpercent: any = 0;
  scrollCurrentposition: any = 0
  @ViewChild('scrollcent') scrollcent!: ElementRef;
  updateVerticalScroll(event: any): void {

    this.scrollCurrentposition = event.target.scrollTop
    const scrollDemo = document.querySelector('#scrollcent') as HTMLElement;
    this.Scrollpercent = Math.round(
      (event.target.scrollTop /
        (event.target.scrollHeight - scrollDemo.clientHeight)) *
      100
    );
  }

  selBlock: any;
  screenheight: any = 0; divheight: any = 0; trposition: any = 0;
  commentopen(item: any, i: any, slblock: any = '') {
    this.index = '';
    this.screenheight = window.screen.height;
    this.divheight = (<HTMLInputElement>document.getElementById('scrollcent')).offsetHeight;
    this.trposition = (<HTMLInputElement>document.getElementById('DV_' + i)).offsetTop;
    //console.log('Selected Obj :', item);
    //return
    this.selBlock = slblock + i.toString();
    this.index = i.toString();
    this.commentobj = {
      TYPE: item.CounterPerson,
      NAME: item.LABLE1,
      STORES: item.StoreName,
      STORENAME: item.StoreName,
      Month: '',
      ModuleId: '87',
      ModuleRef: 'PCPR',
      state: 1,
      indexval: i,
    };
  }


  index = '';
  commentobj: any = {};

  addcmt(data: any) {
    // if (data == 'A') {
    //   this.index = '';
    //   const DetailsSF = this.ngbmodal.open({
    //     size: 'xl',
    //     backdrop: 'static',
    //   });
    //   // myObject['skillItem2'] = 15;
    //   this.commentobj['state'] = 0;
    //   (DetailsSF.componentInstance.SFComments = this.commentobj),
    //     DetailsSF.result.then(
    //       (data) => {
    //         //  //console.log(data);
    //       },
    //       (reason) => {
    //         //  //console.log(reason);

    //         if (reason == 'O') {
    //           this.commentobj['state'] = 1;
    //           this.index = this.commentobj['indexval'];
    //         } else {
    //           this.commentobj['state'] = 1;
    //           this.index = this.commentobj['indexval'];
    //           this.GetData(this.columnName, this.columnState);


    //         }
    //         // // on dismiss

    //         // const Data = {
    //         //   state: true,
    //         // };
    //         // this.apiSrvc.setBackgroundstate({ obj: Data });
    //         // this.GetData();
    //       }
    //     );
    // }
    // if (data == 'AD') {
    //   this.GetData(this.columnName, this.columnState);

    //   // if (this.Filter == 'VariableTrendsvsBudget') {
    //   //   this.GetData();
    //   // }
    //   // if (this.Filter == 'VariableTrendsvsStores') {
    //   //   this.GetData();
    //   // }
    // }
  }

  close(data: any) {
    //  //console.log(data);
    this.index = '';
  }
  activePopover: number = -1;
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = (event.target as HTMLElement).closest('.dropdown-toggle, .reportstores-card, .timeframe');
    if (!clickedInside) {
      this.activePopover = -1;
    }
  }

  togglePopover(popoverIndex: number) {
    this.activePopover = this.activePopover === popoverIndex ? -1 : popoverIndex;
  }
  updatedDates(data: any) {
    // console.log(data);
    this.FromDate = data.FromDate;
    this.ToDate = data.ToDate;
    this.DateType = data.DateType;
    this.displaytime = data.DisplayTime
  }
  setDates(type: any) {
    // localStorage.setItem('time', type);
    // this.datevaluetype=
    // console.log(type);

    this.displaytime = 'Time Frame (' + this.Dates.Types.filter((val: any) => val.code == type)[0].name + ')';
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
  storeorgroups(_block: any, val: string) {
    this.storeorgroup = val;
  }
  viewreport() {
    
    this.activePopover = -1;
   
      if (this.storeIds==0) {
      alert('Please select atleast one Store', );
    }
  
  
 else {
  const data = {
    Reference: 'Salesperson Rankings',
    FromDate: this.FromDate,
    ToDate: this.ToDate,
    // TotalReport: this.toporbottom[0],
    storeValues: this.storeIds.toString(),
    // == '' ? '0': this.selectedstorevalues.toString(),
    dateType: this.DateType,
    // groups: this.selectedGroups.toString(),
    storeorgroup: this.storeorgroup.toString(),
    // saleType: this.retailorlease.toString(),
    // dealStatus: this.dealStatus,
  };
    this.shared.api.SetReports({
    obj: data,
  });
this.closes();
this.GetData(this.columnName, this.columnState);


    }
  }
  closes() {
    this.shared.ngbmodal.dismissAll();
  }
//   GetPrintData() {
//     window.print();
//   }



//   generatePDF() {
//     this.shared.spinner.show();
//     const printContents = document.getElementById('PartsCounterPersonRankings')!.innerHTML;
//     const iframe = document.createElement('iframe');

//     // Make the iframe invisible
//     iframe.style.position = 'absolute';
//     iframe.style.width = '0px';
//     iframe.style.height = '0px';
//     iframe.style.border = 'none';

//     document.body.appendChild(iframe);

//     const doc = iframe.contentWindow?.document;
//     if (!doc) {
//       console.error('Failed to create iframe document');
//       return;
//     }

//     doc.open();
//     doc.write(`
//      <html>
//      <head>
//      <title>Parts Counter Person Rankings</title>
//      <style>
//      @font-face {
//       font-family: 'GothamBookRegular';
//       src: url('assets/fonts/Gotham\ Book\ Regular.otf') format('otf'), /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
//            url('assets/fonts/Gotham\ Book\ Regular.otf') format('opentype'); /* Chrome 4+, Firefox 3.5, Opera 10+, Safari 3—5 */
//     }
//     @font-face {
//       font-family: 'Roboto';
//       src: url('assets/fonts/Roboto-Regular.ttf') format('ttf'), /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
//            url('assets/fonts/Roboto-Regular.ttf') format('truetype'); /* Chrome 4+, Firefox 3.5, Opera 10+, Safari 3—5 */
//     }
//     @font-face {
//       font-family: 'RobotoBold';
//       src: url('assets/fonts/Roboto-Bold.ttf') format('ttf'), /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
//            url('assets/fonts/Roboto-Bold.ttf') format('truetype'); /* Chrome 4+, Firefox 3.5, Opera 10+, Safari 3—5 */
//     }
//     .performance-scorecard .table>:not(:first-child){
//       border-top:0px solid #ffa51a
//      }
//      .performance-scorecard  .table{
//       text-align: center;
//       text-transform: capitalize;
//       border: transparent;
 
//       width: 100%;
//      }
//      .performance-scorecard .table th,
//      .performance-scorecard .table td{
//       white-space: nowrap;
//       vertical-align: top;
//      }
//      .performance-scorecard .table th:first-child{
//       position: sticky;
//       left: 0;
//       z-index: 1;
//       // background-color: #337ab7;
//      }
//      .performance-scorecard .table td:first-child{
//       position: sticky;
//       left: 0;
//       z-index: 1;
//       // background-color: #337ab7;
//      }
   
//      .performance-scorecard .table tr:nth-child(odd){
//       background-color: #ffffff;
//      }
//      .performance-scorecard .table tr:nth-child(even){
//       background-color: #ffffff;
//      }
//      .performance-scorecard .table .spacer {
//       // width: 50px !important;
//       background-color: #cfd6de  !important;
//       border-left: 1px solid #cfd6de !important;
//       border-bottom: 1px solid #cfd6de !important;
//       border-top: 1px solid #cfd6de !important;
//      }
//      .performance-scorecard .table .hidden {
//       display: none !important;
//      }
//      .performance-scorecard .table .bdr-rt{
//       border-right: 1px solid #abd0ec;
//      }
//      .performance-scorecard .table thead{
//       position: sticky;
//       top: 0;
//       z-index: 99;
      
//       font-family: 'FaktPro-Bold';
//       font-size: 0.8rem;
//      }
//      .performance-scorecard .table thead th{
//       padding: 5px 10px;
//       margin: 0px; 
//     }
//     .performance-scorecard .table thead .bdr-btm {
//       border-bottom: #005fa3;
//     }
//      .performance-scorecard .table thead  tr:nth-child(1) {
//       background-color: #fff !important;
//       color: #000;
//       text-transform: uppercase; 
//       border-bottom: #cfd6de;
//      }
//      .performance-scorecard .table thead tr:nth-child(2) { 
//       background-color: #337ab7 !important;
//       color: #fff;
//       text-transform: uppercase; 
//       border-bottom: #cfd6de;
//       box-shadow: inset 0 1px 0 0 #cfd6de;
//     } 
//     .performance-scorecard .table thead tr:nth-child(3) { 
//       background-color: #337ab7 !important;
//       color: #fff;
//       text-transform: uppercase; 
//       border-bottom: #cfd6de;
//       box-shadow: inset 0 1px 0 0 #cfd6de;
//     }
//     .performance-scorecard .table thead tr:nth-child(3)  th :nth-child(1) {
//       background-color: #337ab7 !important;
//       color: #fff;
//     }
//     .performance-scorecard .table tbody{
//       font-family: 'FaktPro-Normal';
//       font-size: .9rem;
//     }
   
//     .performance-scorecard .table tbody  td{
//       padding:2px 10px;
//       margin: 0px; 
//       border: 1px solid #cfd6de 
//     }
//     .performance-scorecard .table tbody  tr{
//       border-bottom: 1px solid #37a6f8;
//       border-left: 1px solid #37a6f8
//     }
//     .performance-scorecard .table tbody td:first-child{
//       text-align: start;
//       box-shadow:inset -1px 0 0 0 #cfd6de ;
//     }
//     .performance-scorecard .table tbody tr td:not(:first-child){
//       text-align: right !important;
//     }
//     .performance-scorecard .table tbody .sub-title {
//       font-size: .8rem !important;
//     }
//     .performance-scorecard .table tbody .sub-subtitle{
//       font-size: .7rem !important;
//     }
//     .performance-scorecard .table tbody  td:nth-child(2){ 
//       padding: 2px 10px;
//       margin: 0px;
//     }
//     .performance-scorecard .table tbody .text-bold{
//       font-family: 'FaktPro-Bold';
//     }
//     .performance-scorecard .table tbody .darkred-bg{ 
//       background-color: #282828 !important;
//       color: #fff; 
//      }
//      .performance-scorecard .table tbody .lightblue-bg{ 
//       background-color: #94b6d1 !important;
//       color: #fff;
//      }
//      .performance-scorecard .table tbody .gold-bg{ 
//       background-color: #ffa51a;
//       color: #fff;
//      }  
  
//  </style>
//    </head>
//    <body id='content'>
//          ${printContents}
//          </body>
//            </html>`);
//     doc.close();

//     const div = doc.getElementById('content');
//     const options = {
//       logging: true,
//       allowTaint: false,
//       useCORS: true,
//     };
//     if (!div) {
//       console.error('Element not found');
//       return;
//     }
//     html2canvas(div, options)
//       .then((canvas) => {
//         let imgWidth = 286;
//         let pageHeight = 204;
//         let imgHeight = (canvas.height * imgWidth) / canvas.width;
//         let heightLeft = imgHeight;
//         const contentDataURL = canvas.toDataURL('image/png');
//         let pdfData = new jsPDF('l', 'mm', 'a4', true);
//         let position = 5;

//         function addExtraDataToPage(pdf: any, extraData: any, positionY: any) {
//           pdf.text(extraData, 10, positionY);
//         }

//         function addPageAndImage(pdf: any, contentDataURL: any, position: any) {
//           pdf.addPage();
//           pdf.addImage(
//             contentDataURL,
//             'PNG',
//             5,
//             position,
//             imgWidth,
//             imgHeight,
//             undefined,
//             'FAST'
//           );
//         }

//         pdfData.addImage(
//           contentDataURL,
//           'PNG',
//           5,
//           position,
//           imgWidth,
//           imgHeight,
//           undefined,
//           'FAST'
//         );
//         addExtraDataToPage(pdfData, '', position + imgHeight + 10);
//         heightLeft -= pageHeight;

//         while (heightLeft >= 0) {
//           position = heightLeft - imgHeight;
//           addPageAndImage(pdfData, contentDataURL, position);
//           addExtraDataToPage(pdfData, '', position + imgHeight + 10);
//           heightLeft -= pageHeight;
//         }

//         return pdfData;
//       })
//       .then((doc) => {
//         doc.save('Parts Counter Person Rankings.pdf');
//         // popupWin.close();
//         this.shared.spinner.hide();
//       });
//   }

//   sendEmailData(Email: any, notes: any, from: any) {


//     this.shared.spinner.show();
//     const printContents = document.getElementById('PartsCounterPersonRankings')!.innerHTML;
//     const iframe = document.createElement('iframe');

//     // Make the iframe invisible
//     iframe.style.position = 'absolute';
//     iframe.style.width = '0px';
//     iframe.style.height = '0px';
//     iframe.style.border = 'none';

//     document.body.appendChild(iframe);

//     const doc = iframe.contentWindow?.document;
//     if (!doc) {
//       console.error('Failed to create iframe document');
//       return;
//     }

//     doc.open();
//     doc.write(`
//          <html>
//              <head>
//              <title>Parts Counter Person Rankings</title>
//              <style>
//              @font-face {
//               font-family: 'GothamBookRegular';
//               src: url('assets/fonts/Gotham\ Book\ Regular.otf') format('otf'), /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
//                    url('assets/fonts/Gotham\ Book\ Regular.otf') format('opentype'); /* Chrome 4+, Firefox 3.5, Opera 10+, Safari 3—5 */
//             }
//             @font-face {
//               font-family: 'Roboto';
//               src: url('assets/fonts/Roboto-Regular.ttf') format('ttf'), /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
//                    url('assets/fonts/Roboto-Regular.ttf') format('truetype'); /* Chrome 4+, Firefox 3.5, Opera 10+, Safari 3—5 */
//             }
//             @font-face {
//               font-family: 'RobotoBold';
//               src: url('assets/fonts/Roboto-Bold.ttf') format('ttf'), /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
//                    url('assets/fonts/Roboto-Bold.ttf') format('truetype'); /* Chrome 4+, Firefox 3.5, Opera 10+, Safari 3—5 */
//             }
//             .performance-scorecard .table>:not(:first-child){
//               border-top:0px solid #ffa51a
//              }
//              .performance-scorecard  .table{
//               text-align: center;
//               text-transform: capitalize;
//               border: transparent;
        
//               width: 100%;
//              }
//              .performance-scorecard .table th,
//              .performance-scorecard .table td{
//               white-space: nowrap;
//               vertical-align: top;
//              }
//              .performance-scorecard .table th:first-child{
//               position: sticky;
//               left: 0;
//               z-index: 1;
//               // background-color: #337ab7;
//              }
//              .performance-scorecard .table td:first-child{
//               position: sticky;
//               left: 0;
//               z-index: 1;
//               // background-color: #337ab7;
//              }
           
//              .performance-scorecard .table tr:nth-child(odd){
//               background-color: #ffffff;
//              }
//              .performance-scorecard .table tr:nth-child(even){
//               background-color: #ffffff;
//              }
//              .performance-scorecard .table .spacer {
//               // width: 50px !important;
//               background-color: #cfd6de  !important;
//               border-left: 1px solid #cfd6de !important;
//               border-bottom: 1px solid #cfd6de !important;
//               border-top: 1px solid #cfd6de !important;
//              }
//              .performance-scorecard .table .hidden {
//               display: none !important;
//              }
//              .performance-scorecard .table .bdr-rt{
//               border-right: 1px solid #abd0ec;
//              }
//              .performance-scorecard .table thead{
//               position: sticky;
//               top: 0;
//               z-index: 99;
              
//               font-family: 'FaktPro-Bold';
//               font-size: 0.8rem;
//              }
//              .performance-scorecard .table thead th{
//               padding: 5px 10px;
//               margin: 0px; 
//             }
//             .performance-scorecard .table thead .bdr-btm {
//               border-bottom: #005fa3;
//             }
//              .performance-scorecard .table thead  tr:nth-child(1) {
//               background-color: #fff !important;
//               color: #000;
//               text-transform: uppercase; 
//               border-bottom: #cfd6de;
//              }
//              .performance-scorecard .table thead tr:nth-child(2) { 
//               background-color: #337ab7 !important;
//               color: #fff;
//               text-transform: uppercase; 
//               border-bottom: #cfd6de;
//               box-shadow: inset 0 1px 0 0 #cfd6de;
//             } 
//             .performance-scorecard .table thead tr:nth-child(3) { 
//               background-color: #337ab7 !important;
//               color: #fff;
//               text-transform: uppercase; 
//               border-bottom: #cfd6de;
//               box-shadow: inset 0 1px 0 0 #cfd6de;
//             }
//             .performance-scorecard .table thead tr:nth-child(3)  th :nth-child(1) {
//               background-color: #337ab7 !important;
//               color: #fff;
//             }
//             .performance-scorecard .table tbody{
//               font-family: 'FaktPro-Normal';
//               font-size: .9rem;
//             }
           
//             .performance-scorecard .table tbody  td{
//               padding:2px 10px;
//               margin: 0px; 
//               border: 1px solid #cfd6de 
//             }
//             .performance-scorecard .table tbody  tr{
//               border-bottom: 1px solid #37a6f8;
//               border-left: 1px solid #37a6f8
//             }
//             .performance-scorecard .table tbody td:first-child{
//               text-align: start;
//               box-shadow:inset -1px 0 0 0 #cfd6de ;
//             }
//             .performance-scorecard .table tbody tr td:not(:first-child){
//               text-align: right !important;
//             }
//             .performance-scorecard .table tbody .sub-title {
//               font-size: .8rem !important;
//             }
//             .performance-scorecard .table tbody .sub-subtitle{
//               font-size: .7rem !important;
//             }
//             .performance-scorecard .table tbody  td:nth-child(2){ 
//               padding: 2px 10px;
//               margin: 0px;
//             }
//             .performance-scorecard .table tbody .text-bold{
//               font-family: 'FaktPro-Bold';
//             }
//             .performance-scorecard .table tbody .darkred-bg{ 
//               background-color: #282828 !important;
//               color: #fff; 
//              }
//              .performance-scorecard .table tbody .lightblue-bg{ 
//               background-color: #94b6d1 !important;
//               color: #fff;
//              }
//              .performance-scorecard .table tbody .gold-bg{ 
//               background-color: #ffa51a;
//               color: #fff;
//              }  
          
//          </style>
//              </head>
//              <body id='content'>
//                  ${printContents}
//              </body>
//          </html>
//      `);

//     doc.close();

//     const div = doc.getElementById('content');
//     if (!div) {
//       console.error('Element not found');
//       return;
//     }

//     const options = {
//       logging: true,
//       allowTaint: false,
//       useCORS: true,
//       scale: 1 // Adjust scale to fit the page better
//     };

//     html2canvas(div, options)
//       .then((canvas) => {
//         let imgWidth = 286;
//         let pageHeight = 204;
//         let imgHeight = (canvas.height * imgWidth) / canvas.width;
//         let heightLeft = imgHeight;
//         const contentDataURL = canvas.toDataURL('image/png');
//         let pdfData = new jsPDF('l', 'mm', 'a4', true);
//         let position = 5;
//         pdfData.addImage(
//           contentDataURL,
//           'PNG',
//           5,
//           position,
//           imgWidth,
//           imgHeight,
//           undefined,
//           'FAST'
//         );
//         heightLeft -= pageHeight;
//         while (heightLeft >= 0) {
//           position = heightLeft - imgHeight;
//           pdfData.addPage();
//           pdfData.addImage(
//             contentDataURL,
//             'PNG',
//             5,
//             position,
//             imgWidth,
//             imgHeight,
//             undefined,
//             'FAST'
//           );
//           heightLeft -= pageHeight;
//         }

//         const pdfBlob = pdfData.output('blob');
//         const pdfFile = this.blobToFile(pdfBlob, 'Parts Counter Person Rankings.pdf');
//         const formData = new FormData();
//         formData.append('to_email', Email);
//         formData.append('subject', 'Parts Counter Person Rankings');
//         formData.append('file', pdfFile);
//         formData.append('notes', notes);
//         formData.append('from', from);
//         this.shared.api.postmethod(this.comm.routeEndpoint + 'mail', formData).subscribe(
//           (res: any) => {
//             console.log('Response:', res);
//             if (res.status === 200) {
//               // alert(res.response);
//               // this.toast.success(res.response)
//             } else {
//               alert('Invalid Details');
//             }
//           },
//           (error) => {
//             console.error('Error:', error);
//           }
//         );
//       })
//       .catch((error) => {
//         console.error('html2canvas error:', error);
//       })
//       .finally(() => {
//         this.shared.spinner.hide();
//         // popupWin.close();
//       });
//   }
//   public blobToFile = (theBlob: Blob, fileName: string): File => {
//     return new File([theBlob], fileName, {
//       lastModified: new Date().getTime(),
//       type: theBlob.type,
//     });
//   };
}
