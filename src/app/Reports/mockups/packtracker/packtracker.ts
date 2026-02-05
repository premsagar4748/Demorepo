import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
// import { ApiService } from '../../core/services/api.service';
import { Sharedservice } from '../../../Core/Providers/Shared/sharedservice';
import { SalesgrossReports } from '../salesgross-reports/salesgross-reports';

@Component({
  selector: 'app-packtracker',
  imports: [CommonModule, SalesgrossReports],
  templateUrl: './packtracker.html',
  styleUrl: './packtracker.scss'
})
export class Packtracker implements OnInit {
  BackGross: any = [];
  SalesData: any = [];
  DateType: any = 'MTD';
  GridView = 'Global';
  path1: any = 'store';
  path2: any = 'ad_dealtype';
  path3: any = '';
  path1name: any = 'All Dealerships';
  path2name: any = 'New/Used';
  path3name: any = '';
  path1id: any = 1;
  path2id: any = 2;
  path3id: any = '';

  TotalReport: any = 'B';
  groups: any = 8;
  storeIds: any = [71];
  salesPersonId: any = '0';
  salesManagerId: any = '0';
  financeManagerId: any = '0';
  dealType: any = ['New', 'Used'];
  saleType: any = ['Retail', 'Lease', 'Misc', 'Special Order'];
  dealStatus: any = ['Delivered', 'Capped', 'Finalized'];
  FromDate: any = '';
  ToDate: any = '';
  acquisition: any = ['All'];
  otherstoreid: any = '';
  selectedotherstoreids: any = ''
  target: any = [];
  source: any = [];
  includecharge: any = [];
  pack: any = [];

  header: any = [
    {
      type: 'Bar',
      storeIds: this.storeIds,
      fromDate: this.FromDate,
      toDate: this.ToDate,
      ReportTotal: this.TotalReport,
      groups: this.groups, sp: this.salesPersonId,
      sm: this.salesManagerId,
      fm: this.financeManagerId,
      as: this.acquisition,
      gridview: this.GridView,
      otherstoreids: this.otherstoreid,
      selectedotherstoreids: this.selectedotherstoreids,
      datevaluetype: this.DateType,
      dealType: this.dealType,
      saleType: this.saleType,
      dealStatus: this.dealStatus,

    },
  ]

  constructor(private shared: Sharedservice) {

    // if (typeof window !== 'undefined') {
    //   if (localStorage.getItem('userInfo') != null && localStorage.getItem('userInfo') != undefined) {
    //     this.storeIds = ['71']
    //   }

    // }
    // this.setHeaderData();
    this.setHeaderData()

  }

  ngOnInit(): void {
    this.setHeaderData();

    this.getPackTrackerData();
  }

  getPackTrackerData() {
    this.shared.api.getMethodST('axelone/GetPacktrackerData').subscribe((res: any) => {

      // this.shared.salesDataService().subscribe((res: any) => {
      if (res.status === 200) {

        this.SalesData = res.data.map((item: any) => {
          return {
            ...item,
            data2: item.data2
              ? this.safeJsonParse(item.data2)
              : []
          };
        });

        console.log(this.SalesData);
      }
    });
  }

  safeJsonParse(value: any) {
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (e) {
      console.error('JSON parse error:', e);
      return [];
    }
  }

  datetype() {
    if (this.DateType == 'PM') {
      return 'SP';
    }
    else if (this.DateType == 'C') {
      return 'C'
    }
    return this.DateType;
  }

  back2grid() {
    this.GridView = 'Global';
    // this.getPeopleList()

    // this.getSalesData();
  }

  public inTheGreen(value: number): boolean {
    if (value >= 0) {
      return true;
    } else if (value < 0) {
      return false;
    }
    return true;
  }

  value = 0;
  public inTheGreen1(a: number, b: number): boolean {
    const t = Number((a ?? 0).toString().replace(/,/g, ''));
    const m = Number((b ?? 0).toString().replace(/,/g, ''));

    // if total is negative & mtd is positive → add
    if (t < 0 && m > 0) {
      this.value = t + m;
    }
    else {
      this.value = t - m;
    }
    if (this.value >= 0) {
      return true;
    } else if (this.value < 0) {
      return false;
    }
    return true;
  }

  getGrossDiff(total: any, mtd: any): number {
    const t = Number((total ?? 0).toString().replace(/,/g, ''));
    const m = Number((mtd ?? 0).toString().replace(/,/g, ''));

    // if total is negative & mtd is positive → add
    if (t < 0 && m > 0) {
      return t + m;
    }

    // otherwise normal subtraction
    return t - m;
  }

  setHeaderData() {
    const data = {
      title: 'Sales Gross',
      path1: this.path1name,
      path2: this.path2name,
      path3: this.path3name,
      path1id: this.path1id,
      path2id: this.path2id,
      path3id: this.path3id,
      stores: this.storeIds,
      salespresons: '',
      salesmanagers: '',
      financemanagers: '',
      dealType: this.dealType,
      saleType: this.saleType,
      dealStatus: this.dealStatus,
      target: this.target,
      source: this.source,
      includecharge: this.includecharge,
      pack: this.pack,
      toporbottom: this.TotalReport,
      fromdate: this.FromDate,
      todate: this.ToDate,
      GridView: this.GridView,
      groups: 1,
      count: 0,
      as: this.acquisition

    };
    console.log(data,'Dataaaaaaaaaaaaaaa');
    
    this.shared.api.SetHeaderData({ obj: data });

    this.header = [
      {
        type: 'Bar',
        storeIds: this.storeIds,
        fromDate: this.FromDate,
        toDate: this.ToDate,
        ReportTotal: this.TotalReport,
        groups: this.groups, sp: this.salesPersonId,
        sm: this.salesManagerId,
        fm: this.financeManagerId,
        as: this.acquisition,
        gridview: this.GridView,
        otherstoreids: this.otherstoreid,
        selectedotherstoreids: this.selectedotherstoreids,
        datevaluetype: this.DateType,
        dealType: this.dealType,
        saleType: this.saleType,
        dealStatus: this.dealStatus,

      },
    ]
    // this.AOapi.SetHeaderData({ obj: HeaderData });

  }

}
