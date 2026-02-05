import { AfterViewChecked, AfterViewInit, Component, effect, inject, OnInit, signal, untracked } from '@angular/core';
// import { Apiservice } from '../../../../providers/services/apiservice';
import { Sharedservice } from '../../../../Core/Providers/Shared/sharedservice';
import { SharedModule } from '../../../../Core/Providers/Shared/shared.module';
import { ValueExistencePipe } from '../../../../Core/Providers/pipes/valueexistence';
// import { Filters } from '../filters/filters';
// import { ApiService } from '../../../../core/api.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import { Details } from '../details/details';
import { ServicegrossDetails } from '../servicegross-details/servicegross-details';
import { CurrencyPipe, DatePipe, NgClass, NgStyle, SlicePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
// import { SidebarService } from '../../../../core/sidebar.service';
import { common } from '../../../../common';
import { Title } from '@angular/platform-browser';
import { ServicegrossReport } from '../servicegross-report/servicegross-report';
// import { Workbook } from 'exceljs';
// import FileSaver from 'file-saver';
// const EXCEL_EXTENSION = '.xlsx';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ValueExistencePipe, NgxSpinnerModule, DatePipe, NgClass, NgStyle, SlicePipe, SharedModule, ServicegrossReport],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  providers: [CurrencyPipe, DatePipe]
})
export class Dashboard implements OnInit, AfterViewInit {

  serviceData = signal<any[]>([]); serviceTotalData = signal<any>([]);
  viewTable = signal<any>('Overview'); NoData = signal<boolean>(false);

  responseStatus = signal<any>('');
  userInfo:any='';
  userId = signal<any>(''); ustores = signal<any>('');

  spinner = inject(NgxSpinnerService);
  modal = inject(NgbModal);
  currencyPipe = inject(CurrencyPipe);
  datepipe = inject(DatePipe);
  common = inject(common);
  title = inject(Title);
  DateType: any = 'MTD'
  FromDate = signal<any>(''); ToDate = signal<any>('');

  isSidebarCollapsed = signal<boolean>(false);
  filterData = signal<any>({
    "topBottom": 'T',
    "startdate": '',
    "enddate": '',
    "StoreID": '',
    "AdvisorNumber": "",
    "AdvisorName": "",
    "ROSTATUS": "",
    "PaytypeC": 'C',
    "PaytypeW": 'W',
    "PaytypeI": 'I',
    "DepartmentS": '',
    "DepartmentP": '',
    "DepartmentQ": '',
    "DepartmentB": '',
    "DepartmentD": '',
    "GrossTypeM": '',
    "GrossTypeL": '',
    "GrossTypeS": '',
    "GrossTypeP": "",
    "PolicyAccount": "N",
    "excludeZeroHours": 'N',
    "vehicle_Year": "",
    "vehicle_Make": "",
    "Vehicle_Model": "",
    "Vehicle_Odometer": "",
    "CName": "",
    "CZip": "",
    "CState": "",
    "RO_CloseDate": "",
    "var1": 'Store_Name',
    "var2": 'ServiceAdvisor_Name',
    "var3": '',
    "type": "",
    "LaborTypes":"",
    "groupNames": ['Service', 'Advisor Name'],
    "groups": 8,
    "datetype": this.DateType
  });
  constructor(public shared: Sharedservice,) {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      let uData = JSON.parse(storedUser)
      this.userInfo=uData?.user_Info;
    }
    this.userId.set(this.userInfo.userid);
    this.ustores.set(this.userInfo.ustores);
    // this.getServiceGross();
    this.title.setTitle(this.common.titleName + '-Service Gross');
    let obj = {
      title: 'SERVICE GROSS'
    }
    this.shared.api.SetHeaderData({ obj });
    this.getStoreList();
    this.getLaborTypes('A').then(() => {
      const ltypes = this.labortypes.map((item: any) => item.ASD_labortype).join(',');
      let today = new Date();
      let enddate = new Date(today.setDate(today.getDate() - 1));
      const fromdateCheck = ('0' + (enddate.getMonth() + 1)).slice(-2) + '-01' + '-' + enddate.getFullYear();
      this.FromDate.set(fromdateCheck);
      const todateCheck = ('0' + (enddate.getMonth() + 1)).slice(-2) + '-' + ('0' + enddate.getDate()).slice(-2) + '-' + enddate.getFullYear();
      this.ToDate.set(todateCheck);

      let firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      let lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      // this.FromDate = this.datepipe.transform(firstDayOfLastMonth, 'MM-dd-yyyy');
      // this.ToDate = this.datepipe.transform(lastDayOfLastMonth, 'MM-dd-yyyy');


      const D = localStorage.getItem('department');
      const T = localStorage.getItem('stime');
      // console.log('D-T',Dep,TFrame,this.FromDate(),this.ToDate(),firstDayOfLastMonth,lastDayOfLastMonth);
      // console.log('Date',this.datepipe.transform(firstDayOfLastMonth, 'MM-dd-yyyy'), this.FromDate());

      var monthType: any = ''
      var Check_Dep: any = ''
      if (D == 'Service') {
        Check_Dep = 'S'
      }
      else {
        Check_Dep = 'ALL'
      }

      if (T == 'LM') {
        monthType = 'LM'
      }
      else {
        monthType = 'MTD'
      }

      let obj1 = {
        "topBottom": 'T',
        "startdate": monthType == 'MTD' ? this.FromDate() : this.datepipe.transform(firstDayOfLastMonth, 'MM-dd-yyyy'),
        "enddate": monthType == 'MTD' ? this.ToDate() : this.datepipe.transform(lastDayOfLastMonth, 'MM-dd-yyyy'),
        "StoreID": this.selectedStores().join(','),
        "AdvisorNumber": "",
        "AdvisorName": "",
        "ROSTATUS": "",
        "PaytypeC": 'C',
        "PaytypeW": 'W',
        "PaytypeI": 'I',
        "DepartmentS": Check_Dep == 'S' ? 'S' : 'S',
        "DepartmentP": Check_Dep == 'S' ? '' : 'P',
        "DepartmentQ": Check_Dep == 'S' ? '' : 'Q',
        "DepartmentB": '',
        "DepartmentD": '',
        "GrossTypeM": '',
        "GrossTypeL": '',
        "GrossTypeS": '',
        "GrossTypeP": "",
        "PolicyAccount": "N",
        "excludeZeroHours": 'N',
        "vehicle_Year": "",
        "vehicle_Make": "",
        "Vehicle_Model": "",
        "Vehicle_Odometer": "",
        "CName": "",
        "CZip": "",
        "CState": "",
        "RO_CloseDate": "",
        "var1": 'Store_Name',
        "var2": 'ServiceAdvisor_Name',
        "var3": '',
        "type": "",
        "LaborTypes": this.labortypes.map((item: any) => item.ASD_labortype).join(','),
        "groupNames": ['Service', 'Advisor Name'],
        "groups": 8,
        "datetype": this.DateType
      }
      // console.log(obj1);
      this.filterData.set(obj1);
      this.settingExcelArrays();
      this.spinner.show();
      this.getServiceGross(obj1);
      this.getShowDates();
    })
  }

  ngOnInit() {
    // this.sidebarService.isCollapsed$.subscribe((collapsed: any) => {
    //   //alert(collapsed);
    //   this.isSidebarCollapsed.set(collapsed);
    // });
  }

  ngAfterViewInit() {
    this.shared.api.getExportToExcelAllReports().subscribe((res: { obj: { title: string; state: boolean; }; }) => {
      if (res.obj.title == 'SERVICE GROSS') {
        if (res.obj.state == true) {
          this.exportToExcel();
        }
      }
    });
  }

  applyClickEvent(event: any) {
    const data = event;
    this.filterData.set(data);
    this.settingExcelArrays();
    this.getShowDates();
    this.spinner.show();
    if (this.viewTable() == 'Overview') {
      this.getServiceGross(data);
    }

    if (this.viewTable() == 'Gross') {
      this.getServiceTypes(data);
    }

    if (this.viewTable() == 'Hours') {
      this.getServiceHours(data);
    }

    if (this.viewTable() == 'Ro') {
      this.getServiceRos(data);
    }
  }

  sortedStores = signal<any>([]); selectedStores = signal<any>([]);
  Store_G: any = []; Store_H: any = [];
  getStoreList() {
    let obj = {
      "userid": this.userId()
    }
    this.shared.api.postmethod(this.common.routeEndpoint + 'GetStoresList', obj)
      .subscribe((res: any) => {
        if (res.status == 200) {
          this.sortedStores.set(res.response);
          this.selectedStores.set(this.sortedStores().map((val: any) => {
            return val.ID
          }))

          for (let i = 0; i < this.sortedStores().length; i++) {
            this.Store_G.push(this.sortedStores()[i].sg_name)
            this.Store_H.push(this.sortedStores()[i].storename)
          }
        } else {
          this.sortedStores.set([]);
        }
        // console.log(this.sortedStores(), ' store list');
      })
  }

  labortypes: any = [];
  async getLaborTypes(type: any): Promise<void> {
    const obj = { StoreId: this.ustores(), type };
    try {
      const res: any = await firstValueFrom(this.shared.api.postmethod(this.common.routeEndpoint + 'GetLaborTypesTechEfficiency', obj));
      if (res.status === 200) {
        this.labortypes = res.response ?? [];
      } else {
        this.labortypes = [];
      }
    } catch (err) {
      this.labortypes = [];
    }
  }

  expandOpen(i: any, ref: any, item: any, data: any) {
    if (ref == true) {
      item.open = false;
    }
    if (ref == false) {
      item.open = true;
    };
  }

  getServiceGross(obj: any) {
    this.responseStatus.set('');
    this.NoData.set(false);
    this.serviceData.set([]);
    localStorage.setItem('department', 'ALL');
    localStorage.setItem('stime', 'MTD');

    let obj1 = {
      "startdate": obj.startdate,
      "enddate": obj.enddate,
      "StoreID": obj.StoreID,
      "AdvisorNumber": "",
      "AdvisorName": "",
      "ROSTATUS": "",
      "PaytypeC": obj.PaytypeC,
      "PaytypeW": obj.PaytypeW,
      "PaytypeI": obj.PaytypeI,
      "DepartmentS": obj.DepartmentS,
      "DepartmentP": obj.DepartmentP,
      "DepartmentQ": obj.DepartmentQ,
      "DepartmentB": obj.DepartmentB,
      "DepartmentD": obj.DepartmentD,
      "GrossTypeM": obj.GrossTypeM,
      "GrossTypeL": obj.GrossTypeL,
      "GrossTypeS": obj.GrossTypeS,
      "GrossTypeP": "",
      "PolicyAccount": "N",
      "excludeZeroHours": obj.excludeZeroHours,
      "vehicle_Year": "",
      "vehicle_Make": "",
      "Vehicle_Model": "",
      "Vehicle_Odometer": "",
      "CName": "",
      "CZip": "",
      "CState": "",
      "RO_CloseDate": "",
      "var1": obj.var1,
      "var2": obj.var2,
      "var3": obj.var3,
      "type": "",
      "LaborTypes": obj.LaborTypes
    }
    this.spinner.show();
    this.getServiceData(obj1);
    this.getServiceTotalData(obj1);
  }

  serviceGrossData = signal<any>([]);
  getServiceData(obj: any) {
    obj.type = 'D';
    this.serviceGrossData.set([]);
    this.shared.api.postmethod(this.common.routeEndpoint + 'GetServiceSummaryBetaDetailsV2', obj).subscribe((data: any) => {
      if (data.status == 200) {
        if (data.response.length > 0) {
          this.serviceGrossData.set(data.response);
          // this.serviceGrossData.set(data.response.map((item: any) => ({
          //   ...item,
          //   Data2: item.Data2 ? JSON.parse(item.Data2) : [],
          //   open: true
          // })))
          let path2 = this.filterData()?.var2;
          this.serviceGrossData().some(function (x: any) {
            if (x.Data2 != undefined) {
              x.Data2 = JSON.parse(x.Data2);
              x.Data2 = x.Data2.map((v: any) => ({
                ...v,
                SubData: [],
                data2sign: true,
              }));
            }
            if (x.Data3 != undefined) {
              x.Data3 = JSON.parse(x.Data3);
              x.Data2.forEach((val: any) => {
                x.Data3.forEach((ele: any) => {
                  if (val.data2 == ele.data2) {
                    val.SubData.push(ele);
                  }
                });
              });
            }
            if (path2 == '') {
              x.open = false;
            } else {
              x.open = true;
            }
          });
          this.responseStatus.set(this.responseStatus() + 'I');
          this.combineIndividualandTotal();
          this.spinner.hide();
        } else {
          this.serviceGrossData.set([]);
          this.NoData.set(true);
          this.spinner.hide();
        }
      } else {
        this.serviceGrossData.set([]);
        this.NoData.set(true);
        this.spinner.hide();
      }
    }, (err: any) => {
      this.spinner.hide();
      this.serviceGrossData.set([]);
    })
  }

  getServiceTotalData(obj: any) {
    if (obj.var1 == 'Store_Name') {
      obj.var1 = '';
    }
    obj.type = 'T';
    this.shared.api.postmethod(this.common.routeEndpoint + 'GetServiceSummaryBetaDetailsV2', obj).subscribe((data: any) => {
      if (data.status == 200) {
        if (data.response.length > 0) {
          this.serviceTotalData.set(data.response.map((item: any) => ({
            ...item,
            data1: 'REPORT TOTALS',
            Data2: [],
            open: false
          })))
          this.responseStatus.set(this.responseStatus() + 'T')
          this.combineIndividualandTotal();
        }
      } else {
        this.serviceTotalData.set([]);
      }
    }, (err: any) => {
      this.spinner.hide();
      this.serviceTotalData.set([]);
    })
  }

  combineIndividualandTotal() {
    this.serviceData.set([]);
    if (this.responseStatus() == 'IT' || this.responseStatus() == 'TI') {
      //console.log(this.filterData.topBottom);
      if (this.filterData()?.topBottom == 'B') {
        this.serviceGrossData.update((arr: any) => [...arr, this.serviceTotalData()[0]]);
        this.serviceData.set(this.serviceGrossData());
      } else {
        this.serviceGrossData.update((arr: any) => [this.serviceTotalData()[0], ...arr]);
        this.serviceData.set(this.serviceGrossData());
      }
      this.spinner.hide();
    } else if (this.responseStatus() == 'T') {
      this.serviceData.set(this.serviceTotalData());
    } else if (this.responseStatus() == 'I') {
      this.serviceData.set(this.serviceGrossData());
    } else {
      this.NoData.set(true);
    }
    // console.log('service gross data : ', this.serviceData());
  }


  openDetails(Item: any, ParentItem: any, ref: any) {
    if (ref == '1') {
      if (Item.data1 != undefined && Item.data1 != 'REPORT TOTALS') {
        const DetailsServicePerson = this.modal.open(ServicegrossDetails,
          {
            size: 'xl',
            // backdrop: 'static',
          }
        );
        DetailsServicePerson.componentInstance.Servicedetails = [
          {
            // "storeId": Item.data1,
            // "SrvcName": Item.ServiceAdvisor_Name,
            StartDate: this.filterData()?.startdate,
            EndDate: this.filterData()?.enddate,
            var1: this.filterData()?.var1,
            var2: '',
            var3: '',
            var1Value: Item.data1 == undefined || Item.data1 == '' || Item.data1 == null ? '' : Item.data1,
            var2Value: '',
            var3Value: '',
            PaytypeC: this.filterData()?.PaytypeC,
            PaytypeW: this.filterData()?.PaytypeW,
            PaytypeI: this.filterData()?.PaytypeI,
            DepartmentS: this.filterData()?.DepartmentS,
            DepartmentP: this.filterData()?.DepartmentP,// DepartmentP: '',
            DepartmentQ: this.filterData()?.DepartmentQ,
            DepartmentB: this.filterData()?.DepartmentB,
            DepartmentPDI: this.filterData()?.DepartmentPDI,

            PolicyAccount: 'N',
            userName: Item.data1,
            Grosstype: '',
            layer: 1,
            zeroHours: (this.filterData()?.excludeZeroHours == 'N') ? 'N' : 'Y',
            laborTypes: this.filterData()?.LaborTypes
          },
        ];
      }
    }
    // //console.log(Item)
    if (ref == '2') {
      // if (Item.data2 != undefined) {
      const DetailsServicePerson = this.modal.open(ServicegrossDetails,
        {
          size: 'xl',
          // backdrop: 'static',
          centered: true
        }
      );
      DetailsServicePerson.componentInstance.Servicedetails = [
        {
          // "storeId": ParentItem.Store,
          //  "SrvcName": Item.ServiceAdvisor_Name,
          StartDate: this.filterData()?.startdate,
          EndDate: this.filterData()?.enddate,
          var1: this.filterData()?.var1,
          var2: this.filterData()?.var2,
          var3: '',
          var1Value: ParentItem.data1,
          var2Value: Item.data2 == undefined || Item.data2 == '' || Item.data2 == null ? '' : Item.data2,
          var3Value: '',
          PaytypeC: this.filterData()?.PaytypeC,
          PaytypeW: this.filterData()?.PaytypeW,
          PaytypeI: this.filterData()?.PaytypeI,
          DepartmentS: this.filterData()?.DepartmentS,
          DepartmentP: this.filterData()?.DepartmentP,// DepartmentP: '',
          DepartmentQ: this.filterData()?.DepartmentQ,
          DepartmentB: this.filterData()?.DepartmentB,
          DepartmentPDI: '',

          PolicyAccount: 'N',
          userName: Item.data2,
          Grosstype: '',
          layer: 2,
          zeroHours: (this.filterData()?.excludeZeroHours == 'N') ? 'N' : 'Y',
          laborTypes: this.filterData()?.LaborTypes
        },
      ];
      // }
    }

    if (ref == '3') {
      // if (Item.data3 != undefined) {
      const DetailsServicePerson = this.modal.open(
        ServicegrossDetails,
        {
          size: 'xl',
          // backdrop: 'static',
        }
      );
      DetailsServicePerson.componentInstance.Servicedetails = [
        {
          StartDate: this.filterData()?.startdate,
          EndDate: this.filterData()?.enddate,
          var1: this.filterData()?.var1,
          var2: this.filterData()?.var2,
          var3: this.filterData()?.var3,
          var1Value: ParentItem.data1,
          var2Value: Item.data2 == undefined || Item.data2 == '' || Item.data2 == null ? '' : Item.data2,
          var3Value: Item.data3 == undefined || Item.data3 == '' || Item.data3 == null ? '' : Item.data3,
          PaytypeC: this.filterData()?.PaytypeC,
          PaytypeW: this.filterData()?.PaytypeW,
          PaytypeI: this.filterData()?.PaytypeI,
          DepartmentS: this.filterData()?.DepartmentS,
          DepartmentP: this.filterData()?.DepartmentP,// DepartmentP: '',
          DepartmentQ: this.filterData()?.DepartmentQ,
          DepartmentB: this.filterData()?.DepartmentB,
          DepartmentPDI: '',

          PolicyAccount: 'N',
          userName: Item.data3,
          Grosstype: '',
          layer: 3,
          zeroHours: (this.filterData()?.excludeZeroHours == 'N') ? 'N' : 'Y',
          laborTypes: this.filterData()?.LaborTypes
        },
      ];
      // DetailsServicePerson.result.then(
      //   (data) => { },
      //   (reason) => {
      //     // on dismiss
      //   }
      // );
      // }
    }
  }

  PayTypeGrid(val: any) {
    this.spinner.show();
    this.NoData.set(false);
    if (val == 'G') {
      this.viewTable.set('Gross');
      this.getServiceTypes(this.filterData());
    }

    if (val == 'H') {
      this.viewTable.set('Hours');
      this.getServiceHours(this.filterData());
    }

    if (val == 'R') {
      this.viewTable.set('Ro');
      this.getServiceRos(this.filterData());
    }
  }

  backToOverview() {
    this.spinner.show();
    this.viewTable.set('Overview');
    this.NoData.set(false);
    this.getServiceGross(this.filterData());
  }

  getServiceTypes(obj: any) {
    this.responseStatus.set('');
    this.NoData.set(false);
    this.serviceTypes.set([]);
    const obj1 = {
      startdate: obj.startdate,
      enddate: obj.enddate,
      StoreID: obj.StoreID,
      AdvisorNumber: '',
      AdvisorName: '',
      ROSTATUS: '',
      PaytypeC: obj.PaytypeC,
      PaytypeW: obj.PaytypeW,
      PaytypeI: obj.PaytypeI,
      DepartmentS: obj.DepartmentS,
      DepartmentP: obj.DepartmentP,
      DepartmentQ: obj.DepartmentQ,
      DepartmentB: obj.DepartmentB,
      DepartmentD: obj.DepartmentD,
      GrossTypeM: obj.GrossTypeM,
      GrossTypeL: obj.GrossTypeL,
      GrossTypeS: obj.GrossTypeS,
      GrossTypeP: obj.GrossTypeP,
      PolicyAccount: obj.PolicyAccount,
      excludeZeroHours: obj.excludeZeroHours,
      vehicle_Year: '',
      vehicle_Make: '',
      Vehicle_Model: '',
      Vehicle_Odometer: '',
      CName: '',
      CZip: '',
      CState: '',
      RO_CloseDate: '',
      var1: obj.var1,
      var2: obj.var2,
      var3: obj.var3,
      type: '',
      LaborTypes: obj.LaborTypes
    };
    this.spinner.show();
    this.getPayTypeData(obj1);
    this.getPayTypeTotalData(obj1);
    //console.log(this.filterData);
  }

  serviceTypeData = signal<any>([]); serviceTypeTotalData = signal<any>([]);
  getPayTypeData(obj: any) {
    this.serviceTypeData.set([]);
    obj.type = 'D';
    this.shared.api.postmethod(this.common.routeEndpoint + 'GetServiceSummaryBetaPaytypeV2Sublet', obj).subscribe((data: any) => {
      //console.log('pay type data : ', data);
      if (data.status == 200) {
        if (data.response.length > 0) {
          this.serviceTypeData.set(data.response);
          let path2 = this.filterData()?.var2;
          this.serviceTypeData().some(function (x: any) {
            if (x.Data2 != undefined) {
              x.Data2 = JSON.parse(x.Data2);
              x.Data2 = x.Data2.map((v: any) => ({
                ...v,
                SubData: [],
                data2sign: true,
              }));
            }
            if (x.Data3 != undefined) {
              x.Data3 = JSON.parse(x.Data3);
              x.Data2.forEach((val: any) => {
                x.Data3.forEach((ele: any) => {
                  if (val.data2 == ele.data2) {
                    val.SubData.push(ele);
                  }
                });
              });
            }
            if (path2 == '') {
              x.open = false;
            } else {
              x.open = true;
            }
          });
          this.responseStatus.set(this.responseStatus() + 'I');
          this.combinePayType()
          this.spinner.hide();
        } else {
          this.serviceTypeData.set([]);
          this.NoData.set(true);
          this.spinner.hide();
        }
      } else {
        this.serviceTypeData.set([]);
        this.NoData.set(true);
        this.spinner.hide();
      }
    }, (err: any) => {
      this.serviceTypeData.set([]);
      this.NoData.set(true);
      this.spinner.hide();
    })
  }

  getPayTypeTotalData(obj: any) {
    this.serviceTypeTotalData.set([]);
    if (obj.var1 == 'Store_Name') {
      obj.var1 = '';
    }
    obj.type = 'T';
    this.shared.api.postmethod(this.common.routeEndpoint + 'GetServiceSummaryBetaPaytypeV2Sublet', obj).subscribe((data: any) => {
      //console.log('pay type data : ', data);
      if (data.status == 200) {
        if (data.response.length > 0) {
          this.serviceTypeTotalData.set(data.response.map((item: any) => ({
            ...item,
            data1: 'REPORT TOTALS',
            Data2: [],
            open: false
          })))
          this.responseStatus.set(this.responseStatus() + 'T');
          this.combinePayType();
        }
      } else {
        this.serviceTypeTotalData.set([]);
        this.spinner.hide();
      }
    }, (err: any) => {
      this.serviceTypeTotalData.set([]);
      this.spinner.hide();
    })
  }

  serviceTypes = signal<any>([]);
  combinePayType() {
    this.serviceTypes.set([]);
    if (this.responseStatus() == 'IT' || this.responseStatus() == 'TI') {
      //console.log(this.filterData.topBottom);
      if (this.filterData()?.topBottom == 'B') {
        this.serviceTypeData.update((arr: any) => [...arr, this.serviceTypeTotalData()[0]]);
        this.serviceTypes.set(this.serviceTypeData());
      } else {
        this.serviceTypeData.update((arr: any) => [this.serviceTypeTotalData()[0], ...arr]);
        this.serviceTypes.set(this.serviceTypeData());
      }
      this.spinner.hide();
    } else if (this.responseStatus() == 'T') {
      this.serviceTypes.set(this.serviceTypeTotalData());
    } else if (this.responseStatus() == 'I') {
      this.serviceTypes.set(this.serviceTypeData());
    } else {
      this.NoData.set(true);
    }
  }

  getServiceHours(obj: any) {
    this.responseStatus.set('');
    this.NoData.set(false);
    this.serviceHours.set([]);
    let obj1 = {
      "startdate": obj.startdate,
      "enddate": obj.enddate,
      "StoreID": obj.StoreID,
      "AdvisorNumber": "",
      "AdvisorName": "",
      "ROSTATUS": "",
      "PaytypeC": obj.PaytypeC,
      "PaytypeW": obj.PaytypeW,
      "PaytypeI": obj.PaytypeI,
      "DepartmentS": obj.DepartmentS,
      "DepartmentP": obj.DepartmentP,
      "DepartmentQ": obj.DepartmentQ,
      "DepartmentB": obj.DepartmentB,
      "DepartmentD": obj.DepartmentD,
      "GrossTypeM": obj.GrossTypeM,
      "GrossTypeL": obj.GrossTypeL,
      "GrossTypeS": obj.GrossTypeS,
      "GrossTypeP": "",
      "PolicyAccount": obj.PolicyAccount,
      "excludeZeroHours": obj.excludeZeroHours,
      "vehicle_Year": "",
      "vehicle_Make": "",
      "Vehicle_Model": "",
      "Vehicle_Odometer": "",
      "CName": "",
      "CZip": "",
      "CState": "",
      "RO_CloseDate": "",
      "var1": obj.var1,
      "var2": obj.var2,
      "var3": obj.var3,
      "type": '',
      "LaborTypes": obj.LaborTypes
    }
    this.spinner.show();
    this.getServiceHoursData(obj1);
    this.getServiceHoursTotalData(obj1);
  }

  serviceHoursData = signal<any>([]); serviceHoursTotalData = signal<any>([]);
  getServiceHoursData(obj: any) {
    obj.type = 'D';
    this.serviceHoursData.set([]);
    this.shared.api.postmethod(this.common.routeEndpoint + 'GetServiceSummaryHoursPaytypeV2Sublet', obj).subscribe((data: any) => {
      if (data.status == 200) {
        if (data.response.length > 0) {
          // this.serviceHoursData.set(data.response.map((item: any) => ({
          //   ...item,
          //   Data2: item.Data2 ? JSON.parse(item.Data2) : [],
          //   open: true
          // })))
          this.serviceHoursData.set(data.response);
          let path2 = this.filterData()?.var2;
          this.serviceHoursData().some(function (x: any) {
            if (x.Data2 != undefined) {
              x.Data2 = JSON.parse(x.Data2);
              x.Data2 = x.Data2.map((v: any) => ({
                ...v,
                SubData: [],
                data2sign: true,
              }));
            }
            if (x.Data3 != undefined) {
              x.Data3 = JSON.parse(x.Data3);
              x.Data2.forEach((val: any) => {
                x.Data3.forEach((ele: any) => {
                  if (val.data2 == ele.data2) {
                    val.SubData.push(ele);
                  }
                });
              });
            }
            if (path2 == '') {
              x.open = false;
            } else {
              x.open = true;
            }
          });
          this.responseStatus.set(this.responseStatus() + 'I');
          this.combineHours();
          this.spinner.hide();
        } else {
          this.serviceHoursData.set([]);
          this.NoData.set(true);
          this.spinner.hide();
        }
      } else {
        this.serviceHoursData.set([]);
        this.NoData.set(true);
        this.spinner.hide();
      }
    }, (err: any) => {
      this.serviceHoursData.set([]);
      this.NoData.set(true);
      this.spinner.hide();
    })
  }

  getServiceHoursTotalData(obj: any) {
    if (obj.var1 == 'Store_Name') {
      obj.var1 = '';
    }
    obj.type = 'T';
    this.serviceHoursTotalData.set([]);
    this.shared.api.postmethod(this.common.routeEndpoint + 'GetServiceSummaryHoursPaytypeV2Sublet', obj).subscribe((data: any) => {
      if (data.status == 200) {
        if (data.response.length > 0) {
          this.serviceHoursTotalData.set(data.response.map((item: any) => ({
            ...item,
            data1: 'REPORT TOTALS',
            Data2: [],
            open: false
          })))
          this.responseStatus.set(this.responseStatus() + 'T');
          this.combineHours();
        }
      } else {
        this.serviceHoursTotalData.set([]);
      }
    }, (error: any) => {
      this.serviceHoursTotalData.set([]);
      this.spinner.hide();
    })
  }

  serviceHours = signal<any>([]);
  combineHours() {
    this.serviceHours.set([]);
    if (this.responseStatus() == 'IT' || this.responseStatus() == 'TI') {
      if (this.filterData()?.topBottom == 'B') {
        this.serviceHoursData.update((arr: any) => [...arr, this.serviceHoursTotalData()[0]]);
        this.serviceHours.set(this.serviceHoursData());
      } else {
        this.serviceHoursData.update((arr: any) => [this.serviceHoursTotalData()[0], ...arr]);
        this.serviceHours.set(this.serviceHoursData());
      }
      this.spinner.hide();
    } else if (this.responseStatus() == 'T') {
      this.serviceHours.set(this.serviceHoursTotalData());
    } else if (this.responseStatus() == 'I') {
      this.serviceHours.set(this.serviceHoursData());
    } else {
      this.NoData.set(true);
    }
  }

  getServiceRos(obj: any) {
    this.responseStatus.set('');
    this.NoData.set(false);
    this.serviceRos.set([]);
    let obj1 = {
      "startdate": obj.startdate,
      "enddate": obj.enddate,
      "StoreID": obj.StoreID,
      "AdvisorNumber": "",
      "AdvisorName": "",
      "ROSTATUS": "",
      "PaytypeC": obj.PaytypeC,
      "PaytypeW": obj.PaytypeW,
      "PaytypeI": obj.PaytypeI,
      "DepartmentS": obj.DepartmentS,
      "DepartmentP": obj.DepartmentP,
      "DepartmentQ": obj.DepartmentQ,
      "DepartmentB": obj.DepartmentB,
      "DepartmentD": obj.DepartmentD,
      "GrossTypeM": obj.GrossTypeM,
      "GrossTypeL": obj.GrossTypeL,
      "GrossTypeS": obj.GrossTypeS,
      "GrossTypeP": "",
      "PolicyAccount": obj.PolicyAccount,
      "excludeZeroHours": obj.excludeZeroHours,
      "vehicle_Year": "",
      "vehicle_Make": "",
      "Vehicle_Model": "",
      "Vehicle_Odometer": "",
      "CName": "",
      "CZip": "",
      "CState": "",
      "RO_CloseDate": "",
      "var1": obj.var1,
      "var2": obj.var2,
      "var3": obj.var3,
      "type": '',
      "LaborTypes": obj.LaborTypes
    }
    this.spinner.show();
    this.getServiceRoData(obj1);
    this.getServiceRoTotalData(obj1);
  }

  serviceRoData = signal<any>([]); serviceRoTotalData = signal<any>([]);
  getServiceRoData(obj: any) {
    obj.type = 'D';
    this.serviceRoData.set([]);
    this.shared.api.postmethod(this.common.routeEndpoint + 'GetServiceSummaryROPaytypeV2Sublet', obj).subscribe((data: any) => {
      if (data.status == 200) {
        if (data.response.length > 0) {
          this.serviceRoData.set(data.response);
          let path2 = this.filterData()?.var2;
          // this.serviceRoData.set(data.response.map((item: any) => ({
          //   ...item,
          //   Data2: item.Data2 ? JSON.parse(item.Data2) : [],
          //   open: true
          // })))
          this.serviceRoData().some(function (x: any) {
            if (x.Data2 != undefined) {
              x.Data2 = JSON.parse(x.Data2);
              x.Data2 = x.Data2.map((v: any) => ({
                ...v,
                SubData: [],
                data2sign: true,
              }));
            }
            if (x.Data3 != undefined) {
              x.Data3 = JSON.parse(x.Data3);
              x.Data2.forEach((val: any) => {
                x.Data3.forEach((ele: any) => {
                  if (val.data2 == ele.data2) {
                    val.SubData.push(ele);
                  }
                });
              });
            }
            if (path2 == '') {
              x.open = false;
            } else {
              x.open = true;
            }
          });
          this.responseStatus.set(this.responseStatus() + 'I');
          this.combineRos();
          this.spinner.hide();
        } else {
          this.serviceRoData.set([]);
          this.NoData.set(true);
          this.spinner.hide();
        }
      } else {
        this.serviceRoData.set([]);
        this.NoData.set(true);
        this.spinner.hide();
      }
    }, (err: any) => {
      this.serviceRoData.set([]);
      this.NoData.set(true);
      this.spinner.hide();
    })
  }

  getServiceRoTotalData(obj: any) {
    this.serviceRoTotalData.set([]);
    if (obj.var1 == 'Store_Name') {
      obj.var1 = '';
    }
    obj.type = 'T';
    this.shared.api.postmethod(this.common.routeEndpoint + 'GetServiceSummaryROPaytypeV2Sublet', obj).subscribe((data: any) => {
      //console.log('ro ptype data : ', data);
      if (data.status == 200) {
        if (data.response.length > 0) {
          this.serviceRoTotalData.set(data.response.map((item: any) => ({
            ...item,
            data1: 'REPORT TOTALS',
            Data2: [],
            open: false
          })))
          this.responseStatus.set(this.responseStatus() + 'T');
          this.combineRos();
        }
      } else {
        this.serviceRoTotalData.set([]);
        this.spinner.hide();
      }
    }, (err: any) => {
      this.serviceRoTotalData.set([]);
      this.spinner.hide();
    })
  }

  serviceRos = signal<any>([]);
  combineRos() {
    this.serviceRos.set([]);
    if (this.responseStatus() == 'IT' || this.responseStatus() == 'TI') {
      //console.log(this.filterData.topBottom);
      if (this.filterData()?.topBottom == 'B') {
        this.serviceRoData.update((arr: any) => [...arr, this.serviceRoTotalData()[0]]);
        this.serviceRos.set(this.serviceRoData());
      } else {
        this.serviceRoData.update((arr: any) => [this.serviceRoTotalData()[0], ...arr]);
        this.serviceRos.set(this.serviceRoData());
      }
      this.spinner.hide();
    } else if (this.responseStatus() == 'T') {
      this.serviceRos.set(this.serviceRoTotalData());
    } else if (this.responseStatus() == 'I') {
      this.serviceRos.set(this.serviceRoData());
    } else {
      this.NoData.set(true);
    }
  }

  valueCheck(val: any): any {
    if (val === 0 || val === null || val === undefined || val === '-') {
      return { symbol: '', value: '-' };
    }
    let formatted = this.currencyPipe.transform(val, 'USD', '', '1.0-0') ?? '-';
    return { symbol: formatted != '-' ? '$' : '', value: formatted }
  }

  dateCheck(val: any) {
    const getfrom = new Date(this.filterData()?.startdate);
    const getto = new Date(this.filterData()?.enddate);
    if (getfrom.getMonth() + 1 == getto.getMonth() + 1) {
      return val;
    } else {
      // if (val == '-') {
      //   return '';
      // } else {
      return '-';
      // }
    }
  }

  public inTheGreen(value: number): boolean {
    const getfrom = new Date(this.filterData()?.startdate);
    const getto = new Date(this.filterData()?.enddate);
    if (value >= 0 && (getfrom.getMonth() + 1 == getto.getMonth() + 1)) {
      return true;
    }
    else if (value < 0) {
      return false;
    }
    return true
  }

  public getColorClass(value: number | null | undefined): string {
    if (value === null || value === undefined || value === 0) {
      return ''; // No class applied
    }
    return value > 0 ? 'positivebg' : 'negativebg';
  }

  isDesc = signal<boolean>(false);
  column = signal<string>('CategoryName');

  sort(property: any, data: any) {
    this.isDesc.set(!this.isDesc); //change the direction
    this.column.set(property);
    let direction = this.isDesc() ? 1 : -1;
    // console.log(property)
    data.sort(function (a: any, b: any) {
      if (a[property] < b[property]) {
        return -1 * direction;
      } else if (a[property] > b[property]) {
        return 1 * direction;
      } else {
        return 0;
      }
    });
  }

  groups = signal<any>(2); Paytype = signal<any>(''); labortype = signal<any>(''); include = signal<any>('');
  Department = signal<any>(''); store = signal<any>(0);
  settingExcelArrays() {
    console.log('setting data : ', this.filterData());
    const payT: any[] = [this.filterData()?.PaytypeC != '' ? 'Customer Pay' : '', this.filterData().PaytypeW != '' ? 'Warranty' : '', this.filterData().PaytypeI != '' ? 'Internal' : ''];
    const removePayEmpty = payT.filter((item: any) => item != '');
    this.Paytype.set(removePayEmpty.toString());

    const dep: any[] = [this.filterData()?.DepartmentS != '' ? 'Service' : '', this.filterData()?.DepartmentP != '' ? 'Parts' : '', this.filterData()?.DepartmentQ != '' ? 'Quick Lube' : '',
    this.filterData()?.DepartmentB != '' ? 'Bodyshop' : '', this.filterData()?.DepartmentD != '' ? 'Details' : ''];
    const removedepEmpty = dep.filter((item: any) => item != '');
    this.Department.set(removedepEmpty.toString());

    const inc: any[] = [this.filterData()?.excludeZeroHours == 'Y' ? 'Zero Hours' : '', this.filterData()?.GrossTypeS != '' ? 'Sublet' : '', this.filterData().GrossTypeP != '' ? '' : '', this.filterData().GrossTypeM != '' ? 'Misc' : '', this.filterData().GrossTypeL != '' ? 'Lube' : ''];
    console.group(inc);
    const removeInc = inc.filter((item: any) => item != '');
    this.include.set(removeInc.toString());
    console.log(this.include());

    this.store.set(this.filterData()?.StoreID);
    this.labortype.set(this.filterData()?.LaborTypes);
  }

  showDate = signal<any>('');
  getShowDates() {
    let dates: any;
    let month: any, date: any, year: any;
    if (this.datepipe.transform(this.filterData()?.startdate, 'MMMM') != this.datepipe.transform(this.filterData()?.enddate, 'MMMM')) {
      month = this.datepipe.transform(this.filterData()?.startdate, 'MMMM') + ' - ' + this.datepipe.transform(this.filterData()?.enddate, 'MMMM');
    } else {
      month = this.datepipe.transform(this.filterData()?.startdate, 'MMMM')
    }

    if (this.datepipe.transform(this.filterData()?.startdate, 'yyyy') != this.datepipe.transform(this.filterData()?.enddate, 'yyyy')) {
      date = this.datepipe.transform(this.filterData()?.startdate, 'dd') + ', ' + this.datepipe.transform(this.filterData()?.enddate, 'yyyy') + ' - ' +
        this.datepipe.transform(this.filterData()?.enddate, 'dd') + ', ' + this.datepipe.transform(this.filterData()?.enddate, 'yyyy');
    } else {
      date = this.datepipe.transform(this.filterData()?.startdate, 'dd') + ' - ' + this.datepipe.transform(this.filterData()?.enddate, 'dd') + ', ' +
        this.datepipe.transform(this.filterData()?.startdate, 'yyyy')
    }
    dates = month + ': ' + date;
    this.showDate.set(dates);
  }
  parseData(value: any): any[] {
    if (!value) return [];

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    return Array.isArray(value) ? value : [];
  }
  exportToExcel(): void {
    const workbook = this.shared.getWorkbook();
    const worksheet = workbook.addWorksheet('Service Gross');
    worksheet.views = [{ showGridLines: false }];

    /* ================= TITLE ================= */
    const titleRow = worksheet.addRow(['Service Gross']);
    titleRow.font = { bold: true, size: 12 };
    worksheet.mergeCells('A1:V1');

    /* ================= FILTERS ================= */
    let storeValue = 'All Stores';

    const filters = [
      { name: 'Groupings :', values: this.filterData()?.groupNames.join(', ') },
      { name: 'Time Frame :', values: this.FromDate() + ' to ' + this.ToDate() },
      { name: 'Store :', values: storeValue },
      { name: 'Labor Type :', values: this.labortype().replaceAll(',', ', ') },
      { name: 'Department :', values: this.Department().replaceAll(',', ', ') },
      { name: 'Pay Type :', values: this.Paytype() },
      { name: 'Include :', values: this.include().replaceAll(',', ', ') },
      {
        name: 'Report Totals :',
        values: this.filterData()?.topBottom === 'T' ? 'Top' : 'Bottom'
      }
    ];

    let rowIndex = 2;
    filters.forEach(f => {
      rowIndex++;
      worksheet.addRow([]);
      worksheet.mergeCells(`B${rowIndex}:G${rowIndex}`);
      worksheet.getCell(`A${rowIndex}`).value = f.name;
      worksheet.getCell(`B${rowIndex}`).value = f.values || '-';
      worksheet.getCell(`A${rowIndex}`).font = { bold: true };
    });

    worksheet.addRow([]);

    /* ================= HEADERS ================= */
    const headers = [
      'Service',
      'Service Sale',
      'Total Gross',
      'Gross Pace',
      'Gross Target',
      'Diff',
      'Discount',
      'Hours Total',
      'Hours Pace',
      'Hours Target',
      'Hours Diff',
      'RO Total',
      'RO Pace',
      'RO Target',
      'RO Diff',
      'Hours/RO',
      'Sales/RO',
      'Parts/RO',
      'Avg RO',
      'ELR',
      'GP %',
      'MPI %'
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2F5597' }
      };
    });

    /* ================= COLUMN KEYS ================= */
    const keys = [
      'data1',
      'TotalSale',
      'Total_Gross',
      'TotalGross_Pace',
      'Gross_Target',
      'Diff',
      'Discount',
      'Total_Hours',
      'TotalHours_PACE',
      'ROHours_Target',
      'HoursDiff',
      'Repair_Orders',
      'Total_ROPACE',
      'RO_Target',
      'ROCountDiff',
      'Hours_per_RO',
      'Sales_Per_RO',
      'Parts_Per_RO',
      'Average_RO',
      'ELR',
      'Retention',
      'MPI'
    ];

    /* ================= ADD ROW FUNCTION ================= */
    const addRow = (row: any, isSecondRow = false) => {
      const rowData = keys.map((key, index) => {

        // FIRST COLUMN
        if (index === 0) {
          return isSecondRow ? (row.data2 || '-') : (row.data1 || '-');
        }

        let val = row[key];

        if (key === 'Retention' || key === 'MPI') {
          return val ? `${val}%` : '-';
        }

        return val === null || val === undefined || val === '' ? '-' : val;
      });

      const excelRow = worksheet.addRow(rowData);

      excelRow.eachCell((cell, col) => {
        cell.alignment = {
          vertical: 'middle',
          horizontal: col === 1 ? 'left' : 'right'
        };
        if (col !== 1) {
          cell.numFmt = '_( #,##0.00_);_( -#,##0.00_);_( "-"??_);_(@_)';
        }
      });
    };

    /* ================= DATA EXPORT (UI STATE BASED) ================= */
    this.serviceData().forEach((item: any) => {

      // MAIN ROW → ALWAYS
      addRow(item, false);

      // SECOND ROW → ONLY IF USER CLICKED (+)
      if (item.open === true) {
        const secondRows = this.parseData(item.Data2);
        secondRows.forEach((sub: any) => {
          addRow(sub, true);
        });
      }

    });

    /* ================= COLUMN WIDTH ================= */
    worksheet.columns.forEach(col => (col.width = 18));

    /* ================= DOWNLOAD ================= */
    workbook.xlsx.writeBuffer().then(() => {
      this.shared.exportToExcel(workbook, 'Service Gross');
    });
  }

  // exportToExcel(): void {
  //   const workbook = this.shared.getWorkbook();
  //   const worksheet = workbook.addWorksheet('Service Gross');
  //   worksheet.views = [{ showGridLines: false }];


  //   const titleRow = worksheet.addRow(['Service Gross']);
  //   titleRow.font = { bold: true, size: 12 };
  //   worksheet.mergeCells('A1:V1');
  //   let storeValue = 'All Stores';
  //     // if (
  //     //   this.store() &&
  //     //   this.store().length > 0 &&
  //     //   this.store().length !== this.stores.length
  //     // ) {
  //     //   storeValue = this.stores
  //     //     .filter((s: any) => this.store().includes(s.ID.toString()))
  //     //     .map((s: any) => s.storename)
  //     //     .join(', ');
  //     // }

  //     // /* ---------------- TITLE ---------------- */
  //     // // const titleRow = worksheet.addRow(['Service Gross']);
  //     // // titleRow.font = { name: 'Arial', size: 12, bold: true };
  //     // // worksheet.mergeCells('A1:D1');

  //     /* ---------------- FILTERS ---------------- */
  //     const filters = [
  //       { name: 'Groupings :', values: this.filterData()?.groupNames.join(', ') },
  //       { name: 'Time Frame :', values: this.FromDate() + ' to ' + this.ToDate() },
  //       { name: 'Store :', values: storeValue },
  //       { name: 'Labor Type :', values: this.labortype().replaceAll(',', ', ') },
  //       { name: 'Department :', values: this.Department().replaceAll(',', ', ') },
  //       { name: 'Pay Type :', values: this.Paytype() },
  //       { name: 'Include :', values: this.include().replaceAll(',', ', ') },
  //       {
  //         name: 'Report Totals :',
  //         values: this.filterData()?.topBottom === 'T' ? 'Top' : 'Bottom'
  //       }
  //     ];

  //     let rowIndex = 2;
  //     filters.forEach(f => {
  //       rowIndex++;
  //       worksheet.addRow([]);
  //       worksheet.mergeCells(`B${rowIndex}:G${rowIndex}`);
  //       worksheet.getCell(`A${rowIndex}`).value = f.name;
  //       worksheet.getCell(`B${rowIndex}`).value = f.values;
  //       worksheet.getCell(`A${rowIndex}`).font = { bold: true };
  //     });

  //     worksheet.addRow([]);
  //   // ================= HEADERS ================= 
  //   const headers = [
  //     'Service',
  //     'Service Sale',
  //     'Total Gross',
  //     'Gross Pace',
  //     'Gross Target',
  //     'Diff',
  //     'Discount',
  //     'Hours Total',
  //     'Hours Pace',
  //     'Hours Target',
  //     'Hours Diff',
  //     'RO Total',
  //     'RO Pace',
  //     'RO Target',
  //     'RO Diff',
  //     'Hours/RO',
  //     'Sales/RO',
  //     'Parts/RO',
  //     'Avg RO',
  //     'ELR',
  //     'GP %',
  //     'MPI %'
  //   ];

  //   const headerRow = worksheet.addRow(headers);
  //   headerRow.eachCell(cell => {
  //     cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  //     cell.alignment = { horizontal: 'center', vertical: 'middle' };
  //     cell.fill = {
  //       type: 'pattern',
  //       pattern: 'solid',
  //       fgColor: { argb: 'FF2F5597' }
  //     };
  //   });

  //   /* ================= COLUMN KEYS ================= */
  //   const keys = [
  //     'data1',
  //     'TotalSale',
  //     'Total_Gross',
  //     'TotalGross_Pace',
  //     'Gross_Target',
  //     'Diff',
  //     'Discount',
  //     'Total_Hours',
  //     'TotalHours_PACE',
  //     'ROHours_Target',
  //     'HoursDiff',
  //     'Repair_Orders',
  //     'Total_ROPACE',
  //     'RO_Target',
  //     'ROCountDiff',
  //     'Hours_per_RO',
  //     'Sales_Per_RO',
  //     'Parts_Per_RO',
  //     'Average_RO',
  //     'ELR',
  //     'Retention',
  //     'MPI'
  //   ];

  //   const dataStartRow = worksheet.rowCount + 1;

  //   /* ================= ROW ADD FUNCTION ================= */
  //   const addRow = (row: any, isSecondRow = false) => {

  //     const rowData = keys.map((key, index) => {

  //       // FIRST COLUMN FIX (IMPORTANT)
  //       if (index === 0) {
  //         return isSecondRow ? (row.data2 || '-') : (row.data1 || '-');
  //       }

  //       let val = row[key];

  //       if (key === 'Retention' || key === 'MPI') {
  //         return val ? `${val}%` : '-';
  //       }

  //       return val === null || val === undefined || val === '' ? '-' : val;
  //     });

  //     const excelRow = worksheet.addRow(rowData);

  //     excelRow.eachCell((cell, col) => {
  //       cell.alignment = {
  //         vertical: 'middle',
  //         horizontal: col === 1 ? 'left' : 'right'
  //       };
  //       if (col !== 1) {
  //         cell.numFmt = '_( #,##0.00_);_( -#,##0.00_);_( "-"??_);_(@_)';
  //       }
  //     });
  //   };

  //   /* ================= DATA EXPORT ================= */
  //   this.serviceData().forEach((item: any) => {

  //     // MAIN ROW (data1)
  //     addRow(item, false);

  //     // SECOND ROWS (Data2 → data2)
  //     const secondRows = this.parseData(item.Data2);
  //     secondRows.forEach((sub: any) => {
  //       addRow(sub, true);
  //     });

  //   });


  //   worksheet.columns.forEach(col => (col.width = 18));


  //   workbook.xlsx.writeBuffer().then(() => {
  //     this.shared.exportToExcel(workbook, 'Service Gross');
  //   });
  // }

  // exportToExcel(): void {
  //   const workbook = this.shared.getWorkbook();
  //   const worksheet = workbook.addWorksheet('Service Gross');
  //   worksheet.views = [{ showGridLines: false }];

  //   /* ---------------- STORE VALUE ---------------- */
  //   let storeValue = 'All Stores';
  //   // if (
  //   //   this.store() &&
  //   //   this.store().length > 0 &&
  //   //   this.store().length !== this.stores.length
  //   // ) {
  //   //   storeValue = this.stores
  //   //     .filter((s: any) => this.store().includes(s.ID.toString()))
  //   //     .map((s: any) => s.storename)
  //   //     .join(', ');
  //   // }

  //   /* ---------------- TITLE ---------------- */
  //   const titleRow = worksheet.addRow(['Service Gross']);
  //   titleRow.font = { name: 'Arial', size: 12, bold: true };
  //   worksheet.mergeCells('A1:D1');

  //   /* ---------------- FILTERS ---------------- */
  //   const filters = [
  //     { name: 'Groupings :', values: this.filterData()?.groupNames.join(', ') },
  //     { name: 'Time Frame :', values: this.FromDate() + ' to ' + this.ToDate() },
  //     { name: 'Store :', values: storeValue },
  //     { name: 'Labor Type :', values: this.labortype().replaceAll(',', ', ') },
  //     { name: 'Department :', values: this.Department().replaceAll(',', ', ') },
  //     { name: 'Pay Type :', values: this.Paytype() },
  //     { name: 'Include :', values: this.include().replaceAll(',', ', ') },
  //     {
  //       name: 'Report Totals :',
  //       values: this.filterData()?.topBottom === 'T' ? 'Top' : 'Bottom'
  //     }
  //   ];

  //   let rowIndex = 2;
  //   filters.forEach(f => {
  //     rowIndex++;
  //     worksheet.addRow([]);
  //     worksheet.mergeCells(`B${rowIndex}:G${rowIndex}`);
  //     worksheet.getCell(`A${rowIndex}`).value = f.name;
  //     worksheet.getCell(`B${rowIndex}`).value = f.values;
  //     worksheet.getCell(`A${rowIndex}`).font = { bold: true };
  //   });

  //   worksheet.addRow([]);

  //   /* ---------------- HEADERS ---------------- */
  //   const headers = [
  //     'Service Sale', 'Total', 'Pace', 'Target', 'Diff', 'Discounts',
  //     'Hours Total', 'Hours Pace', 'Hours Target', 'Hours Diff',
  //     'RO Total', 'RO Pace', 'RO Target', 'RO Diff',
  //     'Hours/RO', 'Sales/RO', 'Parts/RO', 'Avg RO', 'ELR', 'GP%', 'MPI%'
  //   ];

  //   const headerRow = worksheet.addRow(headers);
  //   headerRow.height = 25;

  //   headerRow.eachCell(cell => {
  //     cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  //     cell.alignment = { vertical: 'middle', horizontal: 'center' };
  //     cell.fill = {
  //       type: 'pattern',
  //       pattern: 'solid',
  //       fgColor: { argb: 'FF2F5597' }
  //     };
  //   });

  //   /* ---------------- DATA BINDING ---------------- */
  //   const bindingKeys = [
  //     'data1',
  //     'TotalSale',
  //     'Total_Gross',
  //     'TotalGross_Pace',
  //     'Gross_Target',
  //     'Diff',
  //     'Discount',
  //     'Total_Hours',
  //     'TotalHours_PACE',
  //     'ROHours_Target',
  //     'HoursDiff',
  //     'Repair_Orders',
  //     'Total_ROPACE',
  //     'RO_Target',
  //     'ROCountDiff',
  //     'Hours_per_RO',
  //     'Sales_Per_RO',
  //     'Parts_Per_RO',
  //     'Average_RO',
  //     'ELR',
  //     'Retention',
  //     'MPI'
  //   ];

  //   const serviceData = this.serviceData().map((d: any) => ({ ...d }));

  //   serviceData.forEach((row: any, index: number) => {
  //     const rowData = bindingKeys.map(key => {
  //       let val = row[key];

  //       if (key === 'Retention' || key === 'MPI') {
  //         return val ? val + '%' : '-';
  //       }

  //       return val === 0 || val == null || val === '' ? '-' : val;
  //     });

  //     const dataRow = worksheet.addRow(rowData);

  //     dataRow.eachCell((cell, colIndex) => {
  //       cell.alignment = {
  //         vertical: 'middle',
  //         horizontal: colIndex === 1 ? 'left' : 'right'
  //       };
  //       cell.border = { right: { style: 'thin' } };

  //       if (colIndex !== 1) {
  //         cell.numFmt = '_( #,##0.00_);_( -#,##0.00_);_( "-"??_);_(@_)';
  //       }
  //     });

  //     /* Alternate row shading */
  //     if (index % 2 === 1) {
  //       dataRow.eachCell(cell => {
  //         cell.fill = {
  //           type: 'pattern',
  //           pattern: 'solid',
  //           fgColor: { argb: 'E5E5E5' }
  //         };
  //       });
  //     }
  //   });

  //   /* ---------------- COLUMN WIDTHS ---------------- */
  //   worksheet.columns.forEach(col => (col.width = 18));

  //   /* ---------------- EXPORT ---------------- */
  //   workbook.xlsx.writeBuffer().then((buffer: any) => {
  //     const blob = new Blob([buffer], {
  //       type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  //     });
  //     this.shared.exportToExcel(workbook, 'Service Gross');
  //   });
  // }

  // ExcelStoreNames: any = []; path1name: any = ''; path2name: any = ''; path3name: any = '';
  // exportToExcel() {
  //   let storeNames: any = [];
  //   let store = this.store().split(',');
  //   this.getShowDates();
  //   storeNames = this.common.groupsandstores.filter((v: any) => v.sg_id == this.groups())[0].Stores
  //     .filter((item: any) =>
  //       store.some((cat: any) => cat === item.ID.toString())
  //     );
  //   if (store.length == this.common.groupsandstores.filter((v: any) => v.sg_id == this.groups())[0].Stores
  //     .length) {
  //     if (store.length == 1) {
  //       this.ExcelStoreNames = storeNames.map(function (a: any) {
  //         return a.storename;
  //       });
  //     } else {
  //       this.ExcelStoreNames = 'All Stores'
  //     }
  //   } else {
  //     this.ExcelStoreNames = storeNames.map(function (a: any) {
  //       return a.storename;
  //     });
  //   }
  //   const ServiceData = this.serviceData().map((_arrayElement: any) =>
  //     Object.assign({}, _arrayElement)
  //   );

  //   const workbook = new Workbook();
  //   const worksheet = workbook.addWorksheet('Service Gross');
  //   worksheet.views = [
  //     {
  //       showGridLines: false,
  //     },
  //   ];
  //   worksheet.addRow('');
  //   const titleRow = worksheet.addRow(['Service Gross']);
  //   titleRow.eachCell((cell: any, number: any) => {
  //     cell.alignment = { indent: 1, vertical: 'top', horizontal: 'left' };
  //   });
  //   titleRow.font = { name: 'Arial', family: 4, size: 12, bold: true };
  //   titleRow.worksheet.mergeCells('A2', 'D2');
  //   worksheet.addRow('');
  //   const PresentMonth = this.datepipe.transform(this.FromDate(), 'MMMM');
  //   const PresentYear = this.datepipe.transform(this.FromDate(), 'yyyy');
  //   const FromDate = this.datepipe.transform(this.FromDate(), 'dd');
  //   const ToDate = this.datepipe.transform(this.ToDate(), 'dd');
  //   const DateToday = this.datepipe.transform(
  //     new Date(),
  //     'MM.dd.yyyy h:mm:ss a'
  //   );
  //   const DATE_EXTENSION = this.datepipe.transform(
  //     new Date(),
  //     'MMddyyyy'
  //   );
  //   worksheet.addRow([DateToday]).font = { name: 'Arial', family: 4, size: 9 };

  //   const ReportFilter = worksheet.addRow(['']);
  //   ReportFilter.font = { name: 'Arial', family: 4, size: 10, bold: true };

  //   const Groupings = worksheet.addRow(['Groupings :']);
  //   Groupings.getCell(1).font = {
  //     name: 'Arial',
  //     family: 4,
  //     size: 9,
  //     bold: true,
  //   };
  //   const groupings = worksheet.getCell('B6');
  //   groupings.value = this.filterData()?.groupNames.join(',');
  //   groupings.font = { name: 'Arial', family: 4, size: 9 };

  //   const Timeframe = worksheet.addRow(['Time Frame :']);
  //   Timeframe.getCell(1).font = {
  //     name: 'Arial',
  //     family: 4,
  //     size: 9,
  //     bold: true,
  //   };
  //   const timeframe = worksheet.getCell('B7');
  //   timeframe.value = this.FromDate() + ' to ' + this.ToDate();
  //   timeframe.font = { name: 'Arial', family: 4, size: 9 };

  //   const Stores = worksheet.addRow(['Store :']);
  //   Stores.getCell(1).font = { name: 'Arial', family: 4, size: 9, bold: true };
  //   // const Groups = worksheet.getCell('B8');
  //   // Groups.value = 'Groups :';
  //   // const groups = worksheet.getCell('C8');
  //   // groups.value = this.common.groupsandstores.filter((val: any) => val.sg_id == this.groups().toString())[0].sg_name;

  //   // groups.font = { name: 'Arial', family: 4, size: 9 };
  //   // const Brands = worksheet.getCell('B9');
  //   // Brands.value = 'Brands :';
  //   // const brands = worksheet.getCell('C9');
  //   // brands.value = '-';
  //   // brands.font = { name: 'Arial', family: 4, size: 9 };
  //   // const Stores1 = worksheet.getCell('B9');
  //   // Stores1.value = 'Stores :';
  //   const stores1 = worksheet.getCell('B8');
  //   stores1.value = this.ExcelStoreNames == 0
  //     ? 'All Stores'
  //     : this.ExcelStoreNames == null
  //       ? '-'
  //       : this.ExcelStoreNames.toString().replaceAll(',', ', ');
  //   stores1.font = { name: 'Arial', family: 4, size: 9 };

  //   const Filters = worksheet.addRow(['Filters :']);
  //   Filters.getCell(1).font = { name: 'Arial', family: 4, size: 9, bold: true };
  //   const ROType = worksheet.getCell('B10');
  //   ROType.value = 'Labor Type :';
  //   const rotype = worksheet.getCell('C10');
  //   rotype.value = this.labortype().replaceAll(',', ', ');
  //   rotype.font = { name: 'Arial', family: 4, size: 9 };

  //   const Department = worksheet.getCell('B11');
  //   Department.value = 'Department :';
  //   const department = worksheet.getCell('C11');
  //   department.value = this.Department().replaceAll(',', ', ');
  //   department.font = { name: 'Arial', family: 4, size: 9 };

  //   const PayType = worksheet.getCell('B12');
  //   PayType.value = 'Pay Type :';
  //   const paytype = worksheet.getCell('C12');
  //   paytype.value = this.Paytype();
  //   paytype.font = { name: 'Arial', family: 4, size: 9 };

  //   const Inc = worksheet.getCell('B13');
  //   Inc.value = 'Include :';
  //   const incVal = worksheet.getCell('C13');
  //   incVal.value = this.include().replaceAll(',', ', ');
  //   incVal.font = { name: 'Arial', family: 4, size: 9 };

  //   const ReportTotals = worksheet.getCell('B14');
  //   ReportTotals.value = 'Report Totals :';
  //   const reporttotals = worksheet.getCell('C14');
  //   reporttotals.value = this.filterData()?.topBottom == 'T' ? 'Top' : 'Bottom';
  //   reporttotals.font = { name: 'Arial', family: 4, size: 9 };
  //   worksheet.addRow('');

  //   let dateYear = worksheet.getCell('A16');
  //   dateYear.value = this.showDate();
  //   dateYear.alignment = { vertical: 'middle', horizontal: 'center' };
  //   dateYear.font = {
  //     name: 'Arial',
  //     family: 4,
  //     size: 9,
  //     bold: true,
  //     color: { argb: 'FFFFFF' },
  //   };
  //   dateYear.fill = {
  //     type: 'pattern',
  //     pattern: 'solid',
  //     fgColor: { argb: '2a91f0' },
  //     bgColor: { argb: 'FF0000FF' },
  //   };
  //   dateYear.border = { right: { style: 'dotted' } };

  //   worksheet.mergeCells('B16', 'G16');
  //   let units = worksheet.getCell('B16');
  //   units.value = 'Gross';
  //   units.alignment = { vertical: 'middle', horizontal: 'center' };
  //   units.font = {
  //     name: 'Arial',
  //     family: 4,
  //     size: 9,
  //     bold: true,
  //     color: { argb: 'FFFFFF' },
  //   };
  //   units.fill = {
  //     type: 'pattern',
  //     pattern: 'solid',
  //     fgColor: { argb: '2a91f0' },
  //     bgColor: { argb: 'FF0000FF' },
  //   };
  //   units.border = { right: { style: 'dotted' } };

  //   worksheet.mergeCells('H16', 'K16');
  //   let frontgross = worksheet.getCell('H16');
  //   frontgross.value = 'Hours';
  //   frontgross.alignment = { vertical: 'middle', horizontal: 'center' };
  //   frontgross.font = {
  //     name: 'Arial',
  //     family: 4,
  //     size: 9,
  //     bold: true,
  //     color: { argb: 'FFFFFF' },
  //   };
  //   frontgross.fill = {
  //     type: 'pattern',
  //     pattern: 'solid',
  //     fgColor: { argb: '2a91f0' },
  //     bgColor: { argb: 'FF0000FF' },
  //   };
  //   frontgross.border = { right: { style: 'dotted' } };

  //   worksheet.mergeCells('L16', 'O16');
  //   let backgross = worksheet.getCell('L16');
  //   backgross.value = 'Repair Orders';
  //   backgross.alignment = { vertical: 'middle', horizontal: 'center' };
  //   backgross.font = {
  //     name: 'Arial',
  //     family: 4,
  //     size: 9,
  //     bold: true,
  //     color: { argb: 'FFFFFF' },
  //   };
  //   backgross.fill = {
  //     type: 'pattern',
  //     pattern: 'solid',
  //     fgColor: { argb: '2a91f0' },
  //     bgColor: { argb: 'FF0000FF' },
  //   };
  //   backgross.border = { right: { style: 'dotted' } };

  //   worksheet.mergeCells('P16', 'V16');
  //   let totalgross = worksheet.getCell('P16');
  //   totalgross.value = 'Performance';
  //   totalgross.alignment = { vertical: 'middle', horizontal: 'center' };
  //   totalgross.font = {
  //     name: 'Arial',
  //     family: 4,
  //     size: 9,
  //     bold: true,
  //     color: { argb: 'FFFFFF' },
  //   };
  //   totalgross.fill = {
  //     type: 'pattern',
  //     pattern: 'solid',
  //     fgColor: { argb: '2a91f0' },
  //     bgColor: { argb: 'FF0000FF' },
  //   };
  //   totalgross.border = { right: { style: 'thin' } };

  //   let Headings = [
  //     '',
  //     'Service Sale',
  //     'Total',
  //     'Pace',
  //     'Target',
  //     'Diff',
  //     'Discounts',
  //     'Total',
  //     'Pace',
  //     'Target',
  //     'Diff',
  //     'Total',
  //     'Pace',
  //     'Target',
  //     'Diff',
  //     'Hours/RO	',
  //     'Sales/RO',
  //     'Parts/RO	',
  //     'Avg RO',
  //     'ELR',
  //     'GP%',
  //     'MPI%',
  //   ];
  //   const headerRow = worksheet.addRow(Headings);
  //   headerRow.font = {
  //     name: 'Arial',
  //     family: 4,
  //     size: 9,
  //     bold: false,
  //     color: { argb: 'Black' },
  //   };
  //   headerRow.alignment = { indent: 1, vertical: 'top', horizontal: 'center' };
  //   headerRow.eachCell((cell: any, number: any) => {
  //     cell.fill = {
  //       type: 'pattern',
  //       pattern: 'solid',
  //       fgColor: { argb: 'D9D9D9' },
  //       bgColor: { argb: 'FF0000FF' },
  //     };
  //     cell.border = { right: { style: 'thin' } };
  //     cell.alignment = { vertical: 'top', horizontal: 'center' };
  //   });

  //   for (const d of ServiceData) {
  //     const Data1 = worksheet.addRow([
  //       d.data1 == '' ? '-' : d.data1 == null ? '-' : d.data1,
  //       d.TotalSale == '' ? '-' : d.TotalSale == null ? '-' : d.TotalSale,
  //       d.Total_Gross == '' ? '-' : d.Total_Gross == null ? '-' : d.Total_Gross,
  //       d.TotalGross_Pace == ''
  //         ? '-'
  //         : d.TotalGross_Pace == null
  //           ? '-'
  //           : d.TotalGross_Pace,
  //       d.Gross_Target == ''
  //         ? '-'
  //         : d.Gross_Target == null
  //           ? '-'
  //           : d.Gross_Target,
  //       d.Diff == '' ? '-' : d.Diff == null ? '-' : d.Diff,
  //       d.Discount == '' ? '-' : d.Discount == null ? '-' : d.Discount,
  //       d.Total_Hours == '' ? '-' : d.Total_Hours == null ? '-' : d.Total_Hours,
  //       d.TotalHours_PACE == ''
  //         ? '-'
  //         : d.TotalHours_PACE == null
  //           ? '-'
  //           : d.TotalHours_PACE,
  //       d.ROHours_Target == ''
  //         ? '-'
  //         : d.ROHours_Target == null
  //           ? '-'
  //           : d.ROHours_Target,
  //       d.HoursDiff == '' ? '-' : d.HoursDiff == null ? '-' : d.HoursDiff,
  //       d.Repair_Orders == ''
  //         ? '-'
  //         : d.Repair_Orders == null
  //           ? '-'
  //           : d.Repair_Orders,
  //       d.Total_ROPACE == ''
  //         ? '-'
  //         : d.Total_ROPACE == null
  //           ? '-'
  //           : d.Total_ROPACE,
  //       d.RO_Target == '' ? '-' : d.RO_Target == null ? '-' : d.RO_Target,
  //       d.ROCountDiff == '' ? '-' : d.ROCountDiff == null ? '-' : d.ROCountDiff,
  //       d.Hours_per_RO == ''
  //         ? '-'
  //         : d.Hours_per_RO == null
  //           ? '-'
  //           : d.Hours_per_RO,
  //       d.Sales_Per_RO == ''
  //         ? '-'
  //         : d.Sales_Per_RO == null
  //           ? '-'
  //           : d.Sales_Per_RO,
  //       d.Parts_Per_RO == ''
  //         ? '-'
  //         : d.Parts_Per_RO == null
  //           ? '-'
  //           : d.Parts_Per_RO,
  //       d.Average_RO == '' ? '-' : d.Average_RO == null ? '-' : d.Average_RO,
  //       d.ELR == '' ? '-' : d.ELR == null ? '-' : d.ELR,
  //       d.Retention == ''
  //         ? '-'
  //         : d.Retention == null
  //           ? '-'
  //           : d.Retention + '%',
  //       d.MPI == '' ? '-' : d.MPI == null ? '-' : d.MPI + '%',
  //     ]);
  //     // Data1.outlineLevel = 1; // Grouping level 1
  //     Data1.font = { name: 'Arial', family: 4, size: 9 };
  //     Data1.getCell(1).alignment = {
  //       indent: 1,
  //       vertical: 'top',
  //       horizontal: 'left',
  //     };
  //     Data1.eachCell((cell: any, number: any) => {
  //       cell.border = { right: { style: 'thin' } };
  //       if (
  //         (number > 1 && number < 8) ||
  //         number == 17 ||
  //         number == 19
  //       ) {
  //         cell.numFmt = '_($* #,##0.00_);_($* -#,##0.00_);_($* "-"??_);_(@_)';
  //       }
  //       if (number > 8 && number < 16) {
  //         cell.numFmt = '_( #,##0.00_);_( -#,##0.00_);_( "-"??_);_(@_)';
  //       }
  //       if (number == 16 || number == 21 || number == 22 ||
  //         number == 20) {
  //         cell.numFmt = '_( #,##0.00_);_( -#,##0.00_);_( "-"??_);_(@_)';
  //       }
  //       if (number == 18 || number == 8) {
  //         cell.numFmt ='_( #,##0.00_);_( -#,##0.00_);_( "-"??_);_(@_)';
  //       }
  //       if (number != 1) {
  //         cell.alignment = { vertical: 'top', horizontal: 'right', indent: 1 };
  //       }
  //     });
  //     if (Data1.number % 2) {
  //       Data1.eachCell((cell: { fill: { type: string; pattern: string; fgColor: { argb: string; }; bgColor: { argb: string; }; }; }, number: any) => {
  //         cell.fill = {
  //           type: 'pattern',
  //           pattern: 'solid',
  //           fgColor: { argb: 'e5e5e5' },
  //           bgColor: { argb: 'FF0000FF' },
  //         };
  //       });
  //     }
  //     if (d.Data2 != undefined) {
  //       for (const d1 of d.Data2) {
  //         const Data2 = worksheet.addRow([
  //           d1.data2 == '' ? '-' : d1.data2 == null ? '-' : d1.data2,
  //           d1.TotalSale == ''
  //             ? '-'
  //             : d1.TotalSale == null
  //               ? '-'
  //               : d1.TotalSale,
  //           d1.Total_Gross == ''
  //             ? '-'
  //             : d1.Total_Gross == null
  //               ? '-'
  //               : d1.Total_Gross,
  //           d1.TotalGross_Pace == ''
  //             ? '-'
  //             : d1.TotalGross_Pace == null
  //               ? '-'
  //               : d1.TotalGross_Pace,
  //           '-',
  //           '-',
  //           d1.Discount == '' ? '-' : d1.Discount == null ? '-' : d1.Discount,

  //           d1.Total_Hours == ''
  //             ? '-'
  //             : d1.Total_Hours == null
  //               ? '-'
  //               : d1.Total_Hours,
  //           d1.TotalHours_PACE == ''
  //             ? '-'
  //             : d1.TotalHours_PACE == null
  //               ? '-'
  //               : d1.TotalHours_PACE,
  //           '-',
  //           '-',

  //           d1.Repair_Orders == ''
  //             ? '-'
  //             : d1.Repair_Orders == null
  //               ? '-'
  //               : d1.Repair_Orders,
  //           d1.Total_ROPACE == ''
  //             ? '-'
  //             : d1.Total_ROPACE == null
  //               ? '-'
  //               : d1.Total_ROPACE,
  //           '-',
  //           '-',

  //           d1.Hours_per_RO == ''
  //             ? '-'
  //             : d1.Hours_per_RO == null
  //               ? '-'
  //               : d1.Hours_per_RO,
  //           d1.Sales_Per_RO == ''
  //             ? '-'
  //             : d1.Sales_Per_RO == null
  //               ? '-'
  //               : d1.Sales_Per_RO,
  //           d1.Parts_Per_RO == ''
  //             ? '-'
  //             : d1.Parts_Per_RO == null
  //               ? '-'
  //               : d1.Parts_Per_RO,
  //           d1.Average_RO == ''
  //             ? '-'
  //             : d1.Average_RO == null
  //               ? '-'
  //               : d1.Average_RO,
  //           d1.ELR == '' ? '-' : d1.ELR == null ? '-' : d1.ELR,
  //           d1.Retention == ''
  //             ? '-'
  //             : d1.Retention == null
  //               ? '-'
  //               : d1.Retention + '%',
  //           d1.MPI == '' ? '-' : d1.MPI == null ? '-' : d1.MPI + '%',
  //         ]);
  //         Data2.outlineLevel = 1; // Grouping level 2
  //         Data2.font = { name: 'Arial', family: 4, size: 8 };
  //         Data2.getCell(1).alignment = {
  //           indent: 2,
  //           vertical: 'top',
  //           horizontal: 'left',
  //         };
  //         Data2.eachCell((cell: any, number: any) => {
  //           cell.border = { right: { style: 'thin' } };
  //           if (
  //             (number > 1 && number < 8) ||
  //             number == 17 ||
  //             number == 19

  //           ) {
  //             cell.numFmt = '_($* #,##0.00_);_($* -#,##0.00_);_($* "-"??_);_(@_)';
  //           }
  //           if (number > 8 && number < 16) {
  //             cell.numFmt =  '_( #,##0.00_);_( -#,##0.00_);_( "-"??_);_(@_)';
  //           }
  //           if (number == 16 || number == 21 || number == 22 || number == 20) {
  //             cell.numFmt = '_( #,##0.00_);_( -#,##0.00_);_( "-"??_);_(@_)';
  //           }
  //           if (number == 18 || number == 8) {
  //             cell.numFmt = '_( #,##0.00_);_( -#,##0.00_);_( "-"??_);_(@_)';
  //           }
  //           if (number != 1) {
  //             cell.alignment = {
  //               vertical: 'top',
  //               horizontal: 'right',
  //               indent: 1,
  //             };
  //           }
  //         });
  //         if (Data2.number % 2) {
  //           Data2.eachCell((cell: { fill: { type: string; pattern: string; fgColor: { argb: string; }; bgColor: { argb: string; }; }; }, number: any) => {
  //             cell.fill = {
  //               type: 'pattern',
  //               pattern: 'solid',
  //               fgColor: { argb: 'e5e5e5' },
  //               bgColor: { argb: 'FF0000FF' },
  //             };
  //           });
  //         }
  //         if (d1.SubData != undefined) {
  //           for (const d2 of d1.SubData) {
  //             const Data3 = worksheet.addRow([
  //               d2.data3 == '' ? '-' : d2.data3 == null ? '-' : d2.data3,
  //               d2.TotalSale == ''
  //                 ? '-'
  //                 : d2.TotalSale == null
  //                   ? '-'
  //                   : d2.TotalSale,
  //               d2.Total_Gross == ''
  //                 ? '-'
  //                 : d2.Total_Gross == null
  //                   ? '-'
  //                   : d2.Total_Gross,
  //               d2.TotalGross_Pace == ''
  //                 ? '-'
  //                 : d2.TotalGross_Pace == null
  //                   ? '-'
  //                   : d2.TotalGross_Pace,
  //               '-',
  //               '-',
  //               d2.Discount == '' ? '-' : d2.Discount == null ? '-' : d2.Discount,

  //               d2.Total_Hours == ''
  //                 ? '-'
  //                 : d2.Total_Hours == null
  //                   ? '-'
  //                   : d2.Total_Hours,
  //               d2.TotalHours_PACE == ''
  //                 ? '-'
  //                 : d2.TotalHours_PACE == null
  //                   ? '-'
  //                   : d2.TotalHours_PACE,
  //               '-',
  //               '-',

  //               d2.Repair_Orders == ''
  //                 ? '-'
  //                 : d2.Repair_Orders == null
  //                   ? '-'
  //                   : d2.Repair_Orders,
  //               d2.RO_PACE == ''
  //                 ? '-'
  //                 : d2.RO_PACE == null
  //                   ? '-'
  //                   : d2.RO_PACE,
  //               '-',
  //               '-',

  //               d2.Hours_per_RO == ''
  //                 ? '-'
  //                 : d2.Hours_per_RO == null
  //                   ? '-'
  //                   : d2.Hours_per_RO,
  //               d2.Sales_Per_RO == ''
  //                 ? '-'
  //                 : d2.Sales_Per_RO == null
  //                   ? '-'
  //                   : d2.Sales_Per_RO,
  //               d2.Parts_Per_RO == ''
  //                 ? '-'
  //                 : d2.Parts_Per_RO == null
  //                   ? '-'
  //                   : d2.Parts_Per_RO,

  //               d2.Average_RO == ''
  //                 ? '-'
  //                 : d2.Average_RO == null
  //                   ? '-'
  //                   : d2.Average_RO,
  //               d2.ELR == '' ? '-' : d2.ELR == null ? '-' : d2.ELR,
  //               d2.Retention == ''
  //                 ? '-'
  //                 : d2.Retention == null
  //                   ? '-'
  //                   : d2.Retention + '%',
  //               d2.MPI == '' ? '-' : d2.MPI == null ? '-' : d2.MPI + '%',
  //             ]);
  //             Data3.outlineLevel = 2; // Grouping level 2
  //             Data3.font = { name: 'Arial', family: 4, size: 8 };
  //             Data3.alignment = {
  //               vertical: 'middle',
  //               horizontal: 'center',
  //             };
  //             Data3.getCell(1).alignment = {
  //               indent: 3,
  //               vertical: 'middle',
  //               horizontal: 'left',
  //             };
  //             Data3.eachCell((cell: any, number: any) => {
  //               cell.border = { right: { style: 'dotted' } };
  //               cell.numFmt = '_($* #,##0.00_);_($* -#,##0.00_);_($* "-"??_);_(@_)';
  //               if (
  //                 (number > 1 && number < 8) ||
  //                 number == 17 ||
  //                 number == 19
  //               ) {
  //                 cell.numFmt = '_($* #,##0.00_);_($* -#,##0.00_);_($* "-"??_);_(@_)';
  //               }
  //               if (number > 8 && number < 16) {
  //                 cell.numFmt = '_( #,##0.00_);_( -#,##0.00_);_( "-"??_);_(@_)';
  //               }
  //               if (number == 16 || number == 21 || number == 22 ||
  //                 number == 20) {
  //                 cell.numFmt = '_( #,##0.00_);_( -#,##0.00_);_( "-"??_);_(@_)';
  //               }
  //               if (number == 18 || number == 8) {
  //                 cell.numFmt = '_( #,##0.00_);_( -#,##0.00_);_( "-"??_);_(@_)';
  //               }
  //               if (number != 1) {
  //                 cell.alignment = {
  //                   vertical: 'top',
  //                   horizontal: 'right',
  //                   indent: 1,
  //                 };
  //               }
  //             });
  //             if (Data3.number % 2) {
  //               Data3.eachCell((cell: { fill: { type: string; pattern: string; fgColor: { argb: string; }; bgColor: { argb: string; }; }; }, number: any) => {
  //                 cell.fill = {
  //                   type: 'pattern',
  //                   pattern: 'solid',
  //                   fgColor: { argb: 'e5e5e5' },
  //                   bgColor: { argb: 'FF0000FF' },
  //                 };
  //               });
  //             }

  //           }
  //         }
  //       }
  //     }
  //   }
  //   worksheet.eachRow((row: { eachCell: (arg0: (cell: any, colIndex: any) => void) => void; }, rowIndex: number) => {
  //     row.eachCell((cell: { alignment: { horizontal: string; vertical: string; indent: number; }; }, colIndex: number) => {
  //       if (rowIndex > 1 && rowIndex < 19) { // Skip the header row
  //         // Apply conditional alignment based on your conditions
  //         if (colIndex === 1) {
  //           // Apply right alignment to the second column
  //           cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  //         }
  //       }
  //     });
  //   });
  //   worksheet.getColumn(1).width = 30;
  //   worksheet.getColumn(2).width = 15;
  //   worksheet.getColumn(3).width = 15;
  //   worksheet.getColumn(4).width = 15;
  //   worksheet.getColumn(5).width = 15;
  //   worksheet.getColumn(6).width = 15;
  //   worksheet.getColumn(7).width = 15;
  //   worksheet.getColumn(8).width = 15;
  //   worksheet.getColumn(9).width = 15;
  //   worksheet.getColumn(10).width = 15;
  //   worksheet.getColumn(11).width = 15;
  //   worksheet.getColumn(12).width = 15;
  //   worksheet.getColumn(13).width = 15;
  //   worksheet.getColumn(14).width = 15;
  //   worksheet.getColumn(15).width = 15;
  //   worksheet.getColumn(16).width = 15;
  //   worksheet.getColumn(17).width = 15;
  //   worksheet.getColumn(18).width = 15;
  //   worksheet.getColumn(19).width = 15;
  //   worksheet.getColumn(20).width = 15;
  //   worksheet.getColumn(21).width = 15;
  //   worksheet.addRow([]);
  //   workbook.xlsx.writeBuffer().then((data: any) => {
  //     const blob = new Blob([data], {
  //       type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  //     });
  //     FileSaver.saveAs(blob, 'Service Gross V2_' + DATE_EXTENSION + EXCEL_EXTENSION);
  //   });
  //   // })
  // }
}