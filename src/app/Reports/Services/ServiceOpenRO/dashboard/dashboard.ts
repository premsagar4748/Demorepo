import { AfterViewChecked, AfterViewInit, Component, effect, ElementRef, inject, OnInit, signal, untracked, ViewChild } from '@angular/core';
// import { Apiservice } from '../../../../providers/services/apiservice';
import { ServiceopenroReport } from '../serviceopenro-report/serviceopenro-report';
// import { ApiService } from '../../../../core/api.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CurrencyPipe, DatePipe, DecimalPipe, NgClass, NgStyle, SlicePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
// import { SidebarService } from '../../../../core/sidebar.service';
// import { ToastrService } from 'ngx-toastr';
import { ServiceopenroDetails } from '../serviceopenro-details/serviceopenro-details';
import { Title } from '@angular/platform-browser';
import { common } from '../../../../common';
import { Sharedservice } from '../../../../Core/Providers/Shared/sharedservice';
import { SharedModule } from '../../../../Core/Providers/Shared/shared.module';
// import * as FileSaver from 'file-saver';
// import { ExternalmenuComponent } from '../../../../shared/externalmenu/externalmenu';
import FileSaver from 'file-saver';
import { Workbook } from 'exceljs';
const EXCEL_EXTENSION = '.xlsx';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ServiceopenroReport, SharedModule, NgxSpinnerModule, NgClass, SlicePipe, NgStyle, DecimalPipe, ServiceopenroDetails],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  providers: [CurrencyPipe, DatePipe]
})
export class Dashboard implements OnInit, AfterViewInit {
  asofnow = signal<any>('');
  @ViewChild('scrollcent') scrollcent!: ElementRef;
  index = '';

  // toast = inject(ToastrService);
  title = inject(Title);
  // private api = Inject(Api);
  serviceOpenRoData = signal<any[]>([]);
  expandedRows: Set<number> = new Set<number>();
  viewTable = signal<any>('Overview'); NoData = signal<boolean>(false);
  DateType: any = 'MTD'

  filterData: any = {
    title: 'SERVICE OPEN RO',
    StoreID: '',
    startdate: '',
    enddate: '',
    ROSTATUS: '',
    PaytypeCP: 'Y',
    PaytypeWarranty: 'Y',
    PaytypeInternal: 'Y',
    Department: '',
    GrossTypeLabor: 'Y',
    GrossTypeParts: 'Y',
    GrossTypeMisc: '',
    GrossTypeSublet: '',
    CName: '',
    CZip: "",
    CState: "",
    RO_OpenDate: "",
    Inventory: '',
    var1: 'Store_Name',
    var2: '',
    var3: '',
    type: '',
    minage: 1,
    maxage: 1000,
    Oldro: '',
    topBottom: 'T',
    groupNames: ['Store'],
       "groups": 8,
    "datetype": this.DateType
  };
  responseStatus: any = '';
  userInfo:any = '';
  userId = signal<any>(''); ustores = signal<any>('');

  spinner = inject(NgxSpinnerService);
  modal = inject(NgbModal);
  currencyPipe = inject(CurrencyPipe);
  common = inject(common);
  FromDate: any; ToDate: any
  isSidebarCollapsed = signal<boolean>(false);

  datepipe = inject(DatePipe)

  constructor(public shared: Sharedservice,) {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      let uData = JSON.parse(storedUser)
      this.userInfo = uData?.user_Info;
    }
    //console.log('User Info dash ', this.userInfo());
    this.userId.set(this.userInfo.userid);
    this.ustores.set(this.userInfo.ustores);
    // this.getServiceGross();
    this.title.setTitle(this.common.titleName + '-Service Open Ro');
    let obj = {
      title: 'SERVICE OPEN RO'
    }
    this.shared.api.SetHeaderData({ obj });
    let today = new Date();
    let enddate = new Date(today.setDate(today.getDate() - 1));
    this.FromDate = ('0' + (enddate.getMonth() + 1)).slice(-2) + '-01' + '-' + enddate.getFullYear();
    this.ToDate = ('0' + (enddate.getMonth() + 1)).slice(-2) + '-' + ('0' + enddate.getDate()).slice(-2) + '-' + enddate.getFullYear();
    this.getStoreList().then(() => {
      let obj1 = {
        title: 'SERVICE OPEN RO',
        StoreID: '',
        startdate: '',
        enddate: '',
        ROSTATUS: '',
        PaytypeCP: 'Y',
        PaytypeWarranty: 'Y',
        PaytypeInternal: 'Y',
        Department: '',
        GrossTypeLabor: 'Y',
        GrossTypeParts: 'Y',
        GrossTypeMisc: '',
        GrossTypeSublet: '',
        CName: '',
        CZip: "",
        CState: "",
        RO_OpenDate: "",
        Inventory: '',
        var1: 'Store_Name',
        var2: '',
        var3: '',
        type: '',
        minage: 1,
        maxage: 1000,
        Oldro: '',
        topBottom: 'T',
        groupNames: ['Store'],
        "groups": 8,
        "datetype": this.DateType
      }
      this.filterData = obj1;
      this.settingExcelArrays();
      this.getShowDates();
      this.spinner.show();
      this.getServiceData();
    })
  }

  ngOnInit() {
    // this.sidebarService.isCollapsed$.subscribe(collapsed => {
    //   //alert(collapsed);
    //   this.isSidebarCollapsed.set(collapsed);
    // });
    this.RunServiceOpenLoad('');
  }

  ngAfterViewInit() {
    this.shared.api.getExportToExcelAllReports().subscribe((res: { obj: { state: boolean; title: string; }; }) => {
      if (res.obj.title == 'SERVICE OPEN RO') {
        if (res.obj.state == true) {
          // this.exportToExcel();
        }
      }
    });
  }

  sortedStores = signal<any>([]); selectedStores = signal<any>([]);
  // Store_G: any = []; Store_H: any = [];
  async getStoreList(): Promise<void> {
    let obj = {
      "userid": this.userId()
    }
    try {
      const res: any = await firstValueFrom(this.shared.api.postmethod(this.common.routeEndpoint + 'GetStoresList', obj));
      if (res.status == 200) {
        this.sortedStores.set(res.response);
        this.selectedStores.set(this.sortedStores().map((val: any) => {
          return val.ID
        }))
      } else {
        this.sortedStores.set([]);
      }
    } catch {
      this.sortedStores.set([]);
    }
    // this.api.postMethod('GetStoresList', obj)
    //   .subscribe((res: any) => {
    //     if (res.status == 200) {
    //       this.sortedStores.set(res.response);
    //       this.selectedStores.set(this.sortedStores().map((val: any) => {
    //         return val.ID
    //       }))

    //       // for (let i = 0; i < this.sortedStores().length; i++) {
    //       //   this.Store_G.push(this.sortedStores()[i].sg_name)
    //       //   this.Store_H.push(this.sortedStores()[i].storename)
    //       // }
    //     } else {
    //       this.sortedStores.set([]);
    //     }
    //     console.log(this.sortedStores(), ' store list');
    //   })
  }

  Load(action: any) {
    this.spinner.show()
    this.RunServiceOpenLoad(action)
  }

  loadbtnFlag = signal<any>('');
  RunServiceOpenLoad(action: any) {
    const obj = {
      "ACTION": action
    }
    this.shared.api.postmethod(this.common.routeEndpoint + 'RunServiceOpenLoad', obj).subscribe((res: any) => {
      if (res && res.response) {
        if (action == '') {
          this.asofnow.set(res.response.substring(2));
          this.loadbtnFlag.set(res.response.substring(0, 1));
        } else {
          this.RunServiceOpenLoad('');
          this.getServiceData();
        }

      }
    })
  }

  getServiceData() {
    if (this.ustores()) {
      this.responseStatus = '';
      this.spinner.show();
      const obj = {
        startdate: this.filterData?.startdate,
        enddate: this.filterData?.enddate,
        // enddate: "11-20-2023",
        StoreID: this.filterData?.StoreID,
        AdvisorNumber: '',
        AdvisorName: '',
        ROSTATUS: this.filterData?.ROSTATUS,
        PaytypeCP: this.filterData?.PaytypeCP,
        PaytypeWarranty: this.filterData?.PaytypeWarranty,
        PaytypeInternal: this.filterData?.PaytypeInternal,
        Department: this.filterData?.Department,
        GrossTypeLabor: this.filterData?.GrossTypeLabor,
        GrossTypeParts: this.filterData?.GrossTypeParts,
        GrossTypeMisc: this.filterData?.GrossTypeMisc,
        GrossTypeSublet: this.filterData?.GrossTypeSublet,
        // GrossTypeMisc: this.Grosstype[2] == 'Misc_2' ? 'Y' : '',
        // GrossTypeSublet: this.Grosstype[3] == 'Sublet_3' ? 'Y' : '',
        vehicle_Year: '',
        vehicle_Make: '',
        Vehicle_Model: '',
        Vehicle_Odometer: '',
        CName: '',
        CZip: '',
        CState: '',
        RO_OpenDate: '',
        Inventory: this.filterData?.Inventory,
        var1: '',
        var2: this.filterData?.var2,
        var3: this.filterData?.var3,
        type: '',
        minage: this.filterData?.minage,
        maxage: this.filterData?.maxage,
        Oldro: this.filterData?.Oldro,

      };
      this.GetData(obj);
      this.GetTotalData(obj);
    } else {
    }
  }

  scrollpositionstoring: any;
  IndividualServiceGross = signal<any>([]);
  GetData(obj: any) {

    this.IndividualServiceGross.set([]);

    const payload = {
      ...obj,
      type: 'D',
      var1: 'Store_Name'
    };
    this.shared.api.postmethod(this.common.routeEndpoint + 'GetServiceSummaryBetaOpen', payload).subscribe((res: any) => {
      // this.apiSrvc.logSaving(curl, {}, '', res.message, currentTitle);
      if (res.status == 200) {
        if (res.response != undefined) {
          if (res.response.length > 0) {
            this.IndividualServiceGross.set(res.response);
            this.responseStatus = this.responseStatus + 'I';
            this.NoData.set(false);
            let path2 = this.filterData?.var2;
            let topfive = this.filterData?.Oldro == 'Y' ? true : false;
            let length = this.IndividualServiceGross.length
            this.IndividualServiceGross().some(function (x: any) {
              if (x.RoInfo != undefined) {
                x.RoInfo = JSON.parse(x.RoInfo);
                x.Dealer = '+'
              } else {
                x.Dealer = '+'
              }
              // if (x.Comments != undefined && x.Comments != null) {
              //   x.Comments = JSON.parse(x.Comments);
              // }
              if (x.Data2 != undefined) {
                x.Data2 = JSON.parse(x.Data2);
                x.Data2 = x.Data2.map((v: any) => ({
                  ...v,
                  SubData: [],
                  data2sign: '+',
                }));
              }
              if (path2 == '' && length == 1) {
                x.Dealer = '-';
              }
              else if (path2 != '') {
                x.Dealer = '-'
              }
            });
            this.combineIndividualandTotal();
            let position = this.scrollpositionstoring + 10
            setTimeout(() => {
              this.scrollcent.nativeElement.scrollTop = position
            }, 500);
          } else {
            // alert('Empty Response', '');
            this.spinner.hide();
            this.NoData.set(true);
          }
        } else {
          //  alert('Empty Response', '');
          this.spinner.hide();
          this.NoData.set(true);
        }
      } else {
        // alert('No Response', '');
        this.spinner.hide();
        this.NoData.set(true);
      }
    })
  }

  TotalServiceGross = signal<any>([]);
  GetTotalData(obj: any) {
    // if (obj.var1 == 'Store_Name') {
    //   obj.var1 = 'Store_Name';
    // }
    obj.type = 'T';
    this.shared.api.postmethod(this.common.routeEndpoint + 'GetServiceSummaryBetaOpen', obj).subscribe((totalres: any) => {
      if (totalres.status == 200) {
        if (totalres.response != undefined) {
          if (totalres.response.length > 0) {
            this.TotalServiceGross.set(totalres.response.map((v: any) => ({
              ...v,
              data1: 'REPORT TOTALS',
              Dealer: '+',
              Data2: [],
            })));
            this.responseStatus = this.responseStatus + 'T';
            this.combineIndividualandTotal();
          } else {
            // alert('Empty Response', '');
            this.spinner.hide();
            this.NoData.set(true);
          }
        } else {
          // alert('Empty Response', '');
          this.spinner.hide();
          this.NoData.set(true);
        }
      } else {
        // alert('No Response', '');
        this.spinner.hide();
        this.NoData.set(true);
      }
    },
      (error) => {
        // alert('502 Bad Gate Way Error', '');
        this.spinner.hide();
        this.NoData.set(true);
      })
  }

  applyClickEvent(event: any) {
    if (event.title.toLowerCase() == 'service open ro') {
      const data = event;
      this.filterData = data;
      this.FromDate = data.startdate;
      this.ToDate = data.enddate;
      this.settingExcelArrays();
      this.getShowDates();
      this.spinner.show();
      this.getServiceData();
    }
  }

  expandOpen(i: any, ref: any, item: any, data: any) {
    if (ref == true) {
      item.Dealer = false;
    }
    if (ref == false) {
      item.Dealer = true;
    };
  }

  ServiceData = signal<any>([]);
  combineIndividualandTotal() {
    let topfive = this.filterData?.Oldro == 'Y' ? true : false;
    if (this.responseStatus == 'IT' || this.responseStatus == 'TI') {
      if (this.filterData?.topBottom == 'B') {
        this.IndividualServiceGross.update(arr => [...arr, this.TotalServiceGross()[0]]);
        this.ServiceData.set(this.IndividualServiceGross());
        // if (this.filterData?.var2 == '' && this.ServiceData().length == 2) {
        //   console.log(this.ServiceData, this.filterData?.Oldro);
        // setTimeout(() => {
        //   // if(this.topfive == false)
        //   (<HTMLInputElement>document.getElementById('D_1')).click();
        // }, 300);
        // }
        if (topfive == true) {
          setTimeout(() => {
            this.ServiceData().forEach((val: any, i: any) => {
              if (i < this.ServiceData().length - 1) {
                setTimeout(() => {
                  val.Dealer = '-'
                  if (this.filterData?.var2 == '') {
                    this.openRODetails(val);
                  } else {
                    val.Data2.forEach((sub: any, j: any) => {
                      sub.data2sign = '-'
                      this.openRODetails(sub, val);
                    })
                  }
                }, 100);
              }
            })
          }, 300);
        }
      } else {
        this.IndividualServiceGross.update(arr => [this.TotalServiceGross()[0], ...arr]);
        this.ServiceData.set(this.IndividualServiceGross());
        // if (this.filterData?.var2 == '' && this.ServiceData().length == 2) {
        // setTimeout(() => {
        //   // if(this.topfive == false)
        //   (<HTMLInputElement>document.getElementById('D_1')).click();
        // }, 300);
        // alert('Hi')
        // }
        if (topfive == true) {
          this.ServiceData().forEach((val: any, i: any) => {
            if (i > 0) {
              setTimeout(() => {
                val.Dealer = '-'
                if (this.filterData?.var2 == '') {
                  this.openRODetails(val);
                } else {
                  val.Data2.forEach((sub: any, j: any) => {
                    sub.data2sign = '-'
                    this.openRODetails(sub, val);
                  })
                }
              }, 100);
            }
          })
        }
      }
      // if (this.path2 == '' && this.IndividualServiceGross.length == 1) {
      //   // this.IndividualServiceGross[0].Dealer = '-';
      //   setTimeout(() => {
      //   }, 200);
      //   //
      // } else {
      //   // x.Dealer = '+';
      // }
      this.spinner.hide();
    } else if (this.responseStatus == 'T') {
      this.ServiceData.set(this.TotalServiceGross());
    } else if (this.responseStatus == 'I') {
      this.ServiceData.set(this.IndividualServiceGross());
    } else {
      this.NoData.set(true);
    }
  }

  RODetailsObjectMain: any = [];
  openRODetails(Item?: any, ParentItem?: any, subParentItem?: any, ref?: any) {
    // console.log(Item);
    let topfive = this.filterData?.Oldro == 'Y' ? true : false;
    if (Item?.data1 != 'REPORT TOTALS') {
      if (topfive == true) {
        this.RODetailsObjectMain = [
          {
            StartDate: this.filterData?.startdate,
            EndDate: this.filterData?.enddate,
            var1: this.filterData?.var1,
            var2: this.filterData?.var2,
            GrossTypeLabor: this.filterData?.GrossTypeLabor,
            GrossTypeParts: this.filterData?.GrossTypeParts,
            GrossTypeMisc: this.filterData?.GrossTypeMisc,
            GrossTypeSublet: this.filterData?.GrossTypeSublet,
            PaytypeCP: this.filterData?.PaytypeCP,
            PaytypeWarranty: this.filterData?.PaytypeWarranty,
            PaytypeInternal: this.filterData?.PaytypeInternal,
            AgeFrom: this.filterData?.minage,
            AgeTo: this.filterData?.maxage,
            dataLength: this.ServiceData().length,
            inventory: this.filterData?.Inventory,
            ROSTATUS: this.filterData?.ROSTATUS,
            topfive: this.filterData?.Oldro,
            data: Item,
            Total: Item.RoInfo ? Item.RoInfo.length : 0
          },
        ];
      } else {
        this.RODetailsObjectMain = [
          {
            StartDate: this.filterData?.startdate,
            EndDate: this.filterData?.enddate,
            var1: this.filterData?.var1,
            var2: this.filterData?.var2,
            // var3: this.path3,
            var1Value: ParentItem.data1,
            var2Value: Item.data2 != undefined ? Item.data2 : '',
            GrossTypeLabor: this.filterData?.GrossTypeLabor,
            GrossTypeParts: this.filterData?.GrossTypeParts,
            GrossTypeMisc: this.filterData?.GrossTypeMisc,
            GrossTypeSublet: this.filterData?.GrossTypeSublet,
            PaytypeCP: this.filterData?.PaytypeCP,
            PaytypeWarranty: this.filterData?.PaytypeWarranty,
            PaytypeInternal: this.filterData?.PaytypeInternal,
            AgeFrom: this.filterData?.minage,
            AgeTo: this.filterData?.maxage,
            dataLength: this.ServiceData().length,
            inventory: this.filterData?.Inventory,
            ROSTATUS: this.filterData?.ROSTATUS,
            topfive: '',
            Total: Item.Repair_Orders
            // var3Value: Item.data3,
            // userName: Item.data3,
          },
        ];
      }
    }
  }

  Scrollpercent: any = 0;
  scrollCurrentposition: any = 0
  updateVerticalScroll(event: any): void {
    this.scrollCurrentposition = event.target.scrollTop
    const scrollDemo = document.querySelector('#scrollcent') as HTMLElement;
    this.Scrollpercent = Math.round(
      (event.target.scrollTop /
        (event.target.scrollHeight - scrollDemo.clientHeight)) *
      100
    );
  }


  valueCheck(val: any): string {
    if (val === 0 || val === null || val === undefined || val === '-') {
      return '-';
    }
    return this.currencyPipe.transform(val, 'USD', 'symbol', '1.0-0') ?? '-';
  }

  public inTheGreen(value: number): boolean {
    if (value >= 0) {
      return true;
    }
    else if (value < 0) {
      return false;
    }
    return true
  }

  toggleAction: any = '-';
  expandorcollapse(ind: any, e: any, ref: any, Item: any, parentData: any) {
    let id = (e.target as Element).id;
    this.toggleAction = ref;
    if (id == 'D_' + ind) {
      if (ref == '-') {
        Item.Dealer = '+';
      }
      if (ref == '+') {
        Item.Dealer = '-';
      }
      if (this.filterData?.var2 == '') {
        this.openRODetails(Item, Item, '1', '');
      }
    }
    if (id == 'DN_' + ind) {
      if (ref == '-') {
        Item.data2sign = '+';
      }
      if (ref == '+') {
        Item.data2sign = '-';
        Item.Dealer = '-';
        this.openRODetails(Item, parentData, '1', '');
      }
    }
  }

  isDesc = signal<boolean>(false);
  column = signal<string>('CategoryName');
  sort(property: any, data: any) {
    this.isDesc.set(!this.isDesc); //change the direction
    this.column.set(property);
    let direction = this.isDesc() ? 1 : -1;
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

  groups = signal<any>(2); Paytype = signal<any>(''); roStatus = signal<any>('');
  Department = signal<any>(''); store = signal<any>(0);
  settingExcelArrays() {
    // console.log('setting data : ', this.filterData);
    const payT: any[] = [this.filterData.PaytypeCP == 'Y' ? 'Customer Pay' : '', this.filterData.PaytypeWarranty == 'Y' ? 'Warranty' : '', this.filterData.PaytypeInternal == 'Y' ? 'Internal' : ''];
    const removePayEmpty = payT.filter((item: any) => item != '');
    this.Paytype.set(removePayEmpty.toString());

    const dep: any[] = [this.filterData?.GrossTypeLabor == 'Y' ? 'Service' : '', this.filterData?.GrossTypeParts == 'Y' ? 'Parts' : ''];
    const removedepEmpty = dep.filter((item: any) => item != '');
    this.Department.set(removedepEmpty.toString());

    const roS: any[] = [this.filterData?.ROSTATUS == '' ? 'All' : '', this.filterData?.ROSTATUS.includes('R') ? 'Ready To Post' : '', this.filterData?.ROSTATUS.includes('P') ? 'Pre - Invoiced' : ''];
    const roStatus = roS.filter((item: any) => item != '');
    this.roStatus.set(roStatus.toString());

    this.store.set(this.filterData?.StoreID);
  }

  showDate = signal<any>('');
  getShowDates() {
    let dates: any;
    let month: any, date: any, year: any;
    // console.log(this.filterData);
    if (this.filterData?.startdate != '') {
      if (this.datepipe.transform(this.filterData?.startdate, 'MMMM') != this.datepipe.transform(this.filterData?.enddate, 'MMMM')) {
        month = this.datepipe.transform(this.filterData?.startdate, 'MMMM') + ' - ' + this.datepipe.transform(this.filterData?.enddate, 'MMMM');
      } else {
        month = this.datepipe.transform(this.filterData?.startdate, 'MMMM')
      }

      if (this.datepipe.transform(this.filterData?.startdate, 'yyyy') != this.datepipe.transform(this.filterData?.enddate, 'yyyy')) {
        date = this.datepipe.transform(this.filterData?.startdate, 'dd') + ', ' + this.datepipe.transform(this.filterData?.enddate, 'yyyy') + ' - ' +
          this.datepipe.transform(this.filterData?.enddate, 'dd') + ', ' + this.datepipe.transform(this.filterData?.enddate, 'yyyy');
      } else {
        date = this.datepipe.transform(this.filterData?.startdate, 'dd') + ' - ' + this.datepipe.transform(this.filterData?.enddate, 'dd') + ', ' +
          this.datepipe.transform(this.filterData?.startdate, 'yyyy')
      }
      // console.log(dates = month + ': ' + date);
      dates = month + ': ' + date;
      this.showDate.set(dates);
    } else {
      this.showDate.set("All Open RO's");
    }
    // console.log('Showing Date : ', this.showDate());
  }


  ExcelStoreNames: any = []; path1name: any = ''; path2name: any = '';
  exportToExcel() {
    let storeNames: any = [];
    let store = this.store().split(',');
    this.getShowDates();
    storeNames = this.common.groupsandstores.filter((v: any) => v.sg_id == this.groups())[0].Stores.filter((item: any) =>
      store.some((cat: any) => cat === item.ID.toString())
    );
    if (store.length == this.common.groupsandstores.filter((v: any) => v.sg_id == this.groups())[0].Stores.length) {
      if (store.length == 1) {
        this.ExcelStoreNames = storeNames.map(function (a: any) {
          return a.storename;
        });
      } else {
        this.ExcelStoreNames = 'All Stores'
      }
    } else {
      this.ExcelStoreNames = storeNames.map(function (a: any) {
        return a.storename;
      });
    }
    const ServiceData = this.ServiceData().map((_arrayElement: any) =>
      Object.assign({}, _arrayElement)
    );
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Service Open RO');
    worksheet.views = [
      {
        showGridLines: false,
      },
    ];
    worksheet.addRow('');
    const titleRow = worksheet.addRow(['Service Open RO']);
    titleRow.eachCell((cell: any, number: any) => {
      cell.alignment = { indent: 1, vertical: 'middle', horizontal: 'left' };
    });
    titleRow.font = { name: 'Arial', family: 4, size: 12, bold: true };
    titleRow.worksheet.mergeCells('A2', 'D2');
    worksheet.addRow('');
    const PresentMonth = this.datepipe.transform(this.FromDate, 'MMMM');
    const PresentYear = this.datepipe.transform(this.FromDate, 'yyyy');
    const FromDate = this.datepipe.transform(this.FromDate, 'dd');
    const ToDate = this.datepipe.transform(this.ToDate, 'dd');
    const DateToday = this.datepipe.transform(
      new Date(),
      'MM.dd.yyyy h:mm:ss a'
    );
    const DATE_EXTENSION = this.datepipe.transform(
      new Date(),
      'MMddyyyy'
    );
    worksheet.addRow([DateToday]).font = { name: 'Arial', family: 4, size: 9 };
    const ReportFilter = worksheet.addRow(['']);
    ReportFilter.font = { name: 'Arial', family: 4, size: 10, bold: true };
    const Groupings = worksheet.addRow(['Groupings :']);
    Groupings.getCell(1).font = {
      name: 'Arial',
      family: 4,
      size: 9,
      bold: true,
    };
    const groupings = worksheet.getCell('B6');
    groupings.value = this.filterData?.groupNames.join(',');
    groupings.font = { name: 'Arial', family: 4, size: 9 };
    const Timeframe = worksheet.addRow(['Time Frame :']);
    Timeframe.getCell(1).font = {
      name: 'Arial',
      family: 4,
      size: 9,
      bold: true,
    };
    const timeframe = worksheet.getCell('B7');
    timeframe.value = this.FromDate != '' ? this.FromDate + ' to ' + this.ToDate : '';
    timeframe.font = { name: 'Arial', family: 4, size: 9 };
    const Stores = worksheet.addRow(['Store :']);
    Stores.getCell(1).font = { name: 'Arial', family: 4, size: 9, bold: true };
    // const Groups = worksheet.getCell('B8');
    // Groups.value = 'Group :';
    // const groups = worksheet.getCell('C8');
    // groups.value = this.common.groupsandstores.filter((val: any) => val.sg_id == this.groups().toString())[0].sg_name;
    // groups.font = { name: 'Arial', family: 4, size: 9 };
    // const Brands = worksheet.getCell('B9');
    // Brands.value = 'Brands :';
    // const brands = worksheet.getCell('C9');
    // brands.value = '-';
    // brands.font = { name: 'Arial', family: 4, size: 9 };
    // const Stores1 = worksheet.getCell('B10');
    // Stores1.value = 'Stores :';
    // worksheet.mergeCells('D10', 'O12');
    const stores1 = worksheet.getCell('B8');
    stores1.value = this.ExcelStoreNames == 0
      ? 'All Stores'
      : this.ExcelStoreNames == null
        ? '-'
        : this.ExcelStoreNames.toString().replaceAll(',', ', ');
    stores1.font = { name: 'Arial', family: 4, size: 9 };
    stores1.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    const Filters = worksheet.addRow(['Filters :']);
    Filters.getCell(1).font = { name: 'Arial', family: 4, size: 9, bold: true };

    const Department = worksheet.getCell('B10');
    Department.value = 'Department :';
    const department = worksheet.getCell('C10');
    department.value = this.Department() == ''
      ? '-'
      : this.Department() == null
        ? '-'
        : this.Department().toString().replaceAll(',', ', ');
    department.font = { name: 'Arial', family: 4, size: 9 };

    const PayType = worksheet.getCell('B11');
    PayType.value = 'Pay Type :';
    const paytype = worksheet.getCell('C11');
    let paytypeformat = this.Paytype().toString().replace(/[0-9_]/g, '')
    paytype.value = paytypeformat.replaceAll(',', ',  ')
    paytypeformat == ''
      ? '-'
      : paytypeformat == null
        ? '-'
        : paytypeformat.replaceAll(',', ',  ');
    paytype.font = { name: 'Arial', family: 4, size: 9 };

    const roSta = worksheet.getCell('B12');
    roSta.value = "RO Status :";
    const selectRosta = worksheet.getCell('C12');
    selectRosta.value = this.roStatus().replaceAll(',', ', ');
    selectRosta.font = { name: 'Arial', family: 4, size: 9 };

    const SelectTarget = worksheet.getCell('B13');
    SelectTarget.value = "Inventory RO's :";
    const selecttarget = worksheet.getCell('C13');
    selecttarget.value = this.filterData?.Inventory == ''
      ? 'All'
      : 'Inventory'
    selecttarget.font = { name: 'Arial', family: 4, size: 9 };

    const ReportTotals = worksheet.getCell('B14');
    ReportTotals.value = 'Report Totals :';
    const reporttotals = worksheet.getCell('C14');
    reporttotals.value = this.filterData?.topBottom == 'T' ? 'Top' : 'Bottom';
    reporttotals.font = { name: 'Arial', family: 4, size: 9 };

    // const GrossType = worksheet.getCell('B15');
    // GrossType.value = 'Gross Type :';
    // const grosstype = worksheet.getCell('D15');
    // grosstype.value =
    // this.Grosstype == ''
    // ? '-'
    // : this.Grosstype == null
    // ? '-'
    // : this.Grosstype.toString().replaceAll(',', ', ');
    // grosstype.font = { name: 'Arial', family: 4, size: 9 };
    // const Source = worksheet.getCell('B16');
    // Source.value = 'Source :';
    // const source = worksheet.getCell('D16');
    // source.value =this.Transactorgl == 'T' ? 'Transaction' : (this.Transactorgl == 'G' ? 'GL' : '');
    // source.font = { name: 'Arial', family: 4, size: 9 };
    worksheet.addRow('');
    let dateYear = worksheet.getCell('A16');
    dateYear.value = this.showDate();
    dateYear.alignment = { vertical: 'middle', horizontal: 'center' };
    dateYear.font = {
      name: 'Arial',
      family: 4,
      size: 9,
      bold: true,
      color: { argb: 'FFFFFF' },
    };
    dateYear.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2a91f0' },
      bgColor: { argb: 'FF0000FF' },
    };
    dateYear.border = { right: { style: 'thin' } };
    worksheet.mergeCells('B16', 'C16');
    let units = worksheet.getCell('B16');
    units.value = 'Open RO';
    units.alignment = { vertical: 'middle', horizontal: 'center' };
    units.font = {
      name: 'Arial',
      family: 4,
      size: 9,
      bold: true,
      color: { argb: 'FFFFFF' },
    };
    units.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2a91f0' },
      bgColor: { argb: 'FF0000FF' },
    };
    units.border = { right: { style: 'thin' } };
    worksheet.mergeCells('D16', 'G16');
    let frontgross = worksheet.getCell('G16');
    frontgross.value = 'Labor';
    frontgross.alignment = { vertical: 'middle', horizontal: 'center' };
    frontgross.font = {
      name: 'Arial',
      family: 4,
      size: 9,
      bold: true,
      color: { argb: 'FFFFFF' },
    };
    frontgross.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2a91f0' },
      bgColor: { argb: 'FF0000FF' },
    };
    frontgross.border = { right: { style: 'thin' } };
    worksheet.mergeCells('H16', 'K16');
    let backgross = worksheet.getCell('K16');
    backgross.value = 'Parts';
    backgross.alignment = { vertical: 'middle', horizontal: 'center' };
    backgross.font = {
      name: 'Arial',
      family: 4,
      size: 9,
      bold: true,
      color: { argb: 'FFFFFF' },
    };
    backgross.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2a91f0' },
      bgColor: { argb: 'FF0000FF' },
    };
    backgross.border = { right: { style: 'thin' } };
    worksheet.mergeCells('L16', 'M16');
    let totalgross = worksheet.getCell('M16');
    totalgross.value = '';
    totalgross.alignment = { vertical: 'middle', horizontal: 'center' };
    totalgross.font = {
      name: 'Arial',
      family: 4,
      size: 9,
      bold: true,
      color: { argb: 'FFFFFF' },
    };
    totalgross.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2a91f0' },
      bgColor: { argb: 'FF0000FF' },
    };
    totalgross.border = { right: { style: 'thin' } };
    //console.log(FromDate, ToDate, '........From Date and To Date');
    let Headings = [
      '',
      'Qty',
      // 'Guide',
      'Hours',
      'Labor Sales',
      'Labor Cost',
      'Discounts',
      'Labor Gross',
      'Parts Sales',
      'Parts Cost',
      'Discounts',
      'Parts Gross',
      'Total Sales',
      'Total Gross',
      // 'Total Gross PR',
      // 'PR GP',
    ];
    const headerRow = worksheet.addRow(Headings);
    headerRow.font = {
      name: 'Arial',
      family: 4,
      size: 9,
      bold: false,
      color: { argb: 'FFFFFF' },
    };
    headerRow.alignment = { indent: 1, vertical: 'middle', horizontal: 'center' };
    headerRow.eachCell((cell: any, number: any) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '788494' },
        bgColor: { argb: 'FF0000FF' },
      };
      cell.border = { right: { style: 'thin' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    for (const d of ServiceData) {
      var obj = [
        d.data1 == '' ? '-' : d.data1 == null ? '-' : d.data1,
        d.Repair_Orders == '' ? '-' : d.Repair_Orders == null ? '-' : d.Repair_Orders,
        // d.Guide == '' ? '-' : d.Guide == null ? '-' : d.Guide,
        d.Total_Hours == '' ? '-' : d.Total_Hours == null ? '-' : d.Total_Hours,
        d.laborsale == '' ? '-' : d.laborsale == null ? '-' : d.laborsale,
        d.laborcost == '' ? '-' : d.laborcost == null ? '-' : d.laborcost,
        d.ServiceDiscount == '' ? '-' : d.ServiceDiscount == null ? '-' : d.ServiceDiscount,
        d.laborgross == '' ? '-' : d.laborgross == null ? '-' : d.laborgross,
        d.PartsSale == '' ? '-' : d.PartsSale == null ? '-' : d.PartsSale,
        d.PartsCost == '' ? '-' : d.PartsCost == null ? '-' : d.PartsCost,
        d.partsDiscount == '' ? '-' : d.partsDiscount == null ? '-' : d.partsDiscount,
        d.partsgross == '' ? '-' : d.partsgross == null ? '-' : d.partsgross,
        d.TotalSale == '' ? '-' : d.TotalSale == null ? '-' : d.TotalSale,
        d.Total_Gross == '' ? '-' : d.Total_Gross == null ? '-' : d.Total_Gross,
        // d.Total_Gross_PR == '' ? '-' : d.Total_Gross_PR == null ? '-' : d.Total_Gross_PR,
        // d.PR_GP == '' ? '-' : d.PR_GP == null ? '-' : d.PR_GP + '%',
      ]
      const Data1 = worksheet.addRow(obj);
      // Data1.outlineLevel = 1; // Grouping level 1
      Data1.font = { name: 'Arial', family: 4, size: 9 };
      Data1.getCell(1).alignment = {
        indent: 1,
        vertical: 'middle',
        horizontal: 'left',
      };
      Data1.eachCell((cell: any, number: any) => {
        cell.border = { right: { style: 'thin' } };
        if (
          // (number > 1 && number < 7) ||
          number == 2
        ) {
          cell.numFmt = '#,##0';
        } if (number == 4) {
          // cell.numFmt = '#,##0.00';
        } if (number >= 4) {
          cell.numFmt = '_($* #,##0_);_($* -#,##0_);_($* "-"??_);_(@_)';
        }
        if (number > 1 && obj[number] != undefined) {
          // cell.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
          if (obj[number] < 0) {
            Data1.getCell(number + 1).font = { name: 'Arial', family: 4, size: 9, color: { argb: 'FFFF0000' } };
          }
        }
        if (number == 1) {
          if (obj[number] < 0) {
            Data1.getCell(number + 1).font = { name: 'Arial', family: 4, size: 9, color: { argb: 'FFFF0000' }, bold: true };
          }
        }
      });
      if (Data1.number % 2) {
        Data1.eachCell((cell, number) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'e5e5e5' },
            bgColor: { argb: 'FF0000FF' },
          };
        });
      }
      // if (d.data1 === 'REPORT TOTALS') {
      //   Data1.eachCell((cell, number: any) => {
      //     cell.font = { name: 'Arial', family: 4, size: 9, bold: true };
      //     if (number > 1 && obj[number] != undefined) {
      //       if (obj[number] < 0) {
      //         Data1.getCell(number + 1).font = { name: 'Arial', family: 4, size: 9, color: { argb: 'FFFF0000' } };
      //       }
      //     }
      //   });
      // }
      if (d.Data2 != undefined) {
        //console.log('Hellooo..................');
        for (const d1 of d.Data2) {
          var obj = [
            d1.data2 == '' ? '-' : d1.data2 == null ? '-' : d1.data2,
            d1.Repair_Orders == '' ? '-' : d1.Repair_Orders == null ? '-' : d1.Repair_Orders,
            // d.Guide == '' ? '-' : d.Guide == null ? '-' : d.Guide,
            d1.Total_Hours == '' ? '-' : d1.Total_Hours == null ? '-' : d1.Total_Hours,
            d1.laborsale == '' ? '-' : d1.laborsale == null ? '-' : d1.laborsale,
            d1.laborcost == '' ? '-' : d1.laborcost == null ? '-' : d1.laborcost,
            d1.ServiceDiscount == '' ? '-' : d1.ServiceDiscount == null ? '-' : d1.ServiceDiscount,
            d1.laborgross == '' ? '-' : d1.laborgross == null ? '-' : d1.laborgross,
            d1.PartsSale == '' ? '-' : d1.PartsSale == null ? '-' : d1.PartsSale,
            d1.PartsCost == '' ? '-' : d1.PartsCost == null ? '-' : d1.PartsCost,
            d1.partsDiscount == '' ? '-' : d1.partsDiscount == null ? '-' : d1.partsDiscount,
            d1.partsgross == '' ? '-' : d1.partsgross == null ? '-' : d1.partsgross,
            d1.TotalSale == '' ? '-' : d1.TotalSale == null ? '-' : d1.TotalSale,
            d1.Total_Gross == '' ? '-' : d1.Total_Gross == null ? '-' : d1.Total_Gross,
            // d1.Total_Gross_PR == '' ? '-' : d1.Total_Gross_PR == null ? '-' : d1.Total_Gross_PR,
            // d1.PR_GP == '' ? '-' : d1.PR_GP == null ? '-' : d1.PR_GP + '%',
          ]
          const Data2 = worksheet.addRow(obj);
          Data2.outlineLevel = 1; // Grouping level 2
          Data2.font = { name: 'Arial', family: 4, size: 8 };
          Data2.getCell(1).alignment = {
            indent: 2,
            vertical: 'middle',
            horizontal: 'left',
          };
          Data2.eachCell((cell: any, number: any) => {
            cell.border = { right: { style: 'thin' } };
            if (
              // (number > 1 && number < 7) ||
              number == 2
            ) {
              cell.numFmt = '#,##0';
            } if (number == 4) {
              // cell.numFmt = '#,##0.00';
            } if (number >= 4) {
              cell.numFmt = '_($* #,##0_);_($* -#,##0_);_($* "-"??_);_(@_)';
            }
            if (number > 1 && obj[number] != undefined) {
              // cell.alignment = { horizontal: 'right', vertical: 'middle', indent: 2 };
              if (obj[number] < 0) {
                Data2.getCell(number + 1).font = { name: 'Arial', family: 4, size: 9, color: { argb: 'FFFF0000' } };
              }
            }
          });
          if (Data2.number % 2) {
            Data2.eachCell((cell, number) => {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'e5e5e5' },
                bgColor: { argb: 'FF0000FF' },
              };
            });
          }
        }
      }
    }
    worksheet.eachRow((row, rowIndex) => {
      row.eachCell((cell, colIndex) => {
        if (rowIndex > 1 && rowIndex < 15) { // Skip the header row
          // Apply conditional alignment based on your conditions
          if (colIndex === 1) {
            // Apply right alignment to the second column
            cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
          }
        }
      });
    });
    // worksheet.getColumn(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    worksheet.getColumn(1).width = 30;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 15;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 15;
    worksheet.getColumn(6).width = 15;
    worksheet.getColumn(7).width = 15;
    worksheet.getColumn(8).width = 15;
    worksheet.getColumn(9).width = 15;
    worksheet.getColumn(10).width = 15;
    worksheet.getColumn(11).width = 15;
    worksheet.getColumn(12).width = 15;
    worksheet.getColumn(13).width = 15;
    worksheet.getColumn(14).width = 15;
    worksheet.getColumn(15).width = 15;
    worksheet.getColumn(16).width = 15;
    worksheet.getColumn(17).width = 15;
    worksheet.getColumn(18).width = 15;
    worksheet.getColumn(19).width = 15;
    worksheet.getColumn(20).width = 15;
    worksheet.getColumn(21).width = 15;
    worksheet.addRow([]);
    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      FileSaver.saveAs(blob, 'Service Open RO_' + DATE_EXTENSION + EXCEL_EXTENSION);
    });
    // })
  }
}
