import { Component, HostListener } from '@angular/core';
import { Sharedservice } from '../../../Core/Providers/Shared/sharedservice';
// import { SharedModule } from '../../../Core/Providers/Shared/shared.module';
// import { CommonModule } from '@angular/common';

// import { Stores } from '../../../CommonFilters/stores/stores';
import { Stores } from '../stores/stores';
import { DateRangePicker } from '../date-range-picker/date-range-picker';
import { CommonModule } from '@angular/common';
// import { ApiService } from '../../core/services/api.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import { DateRangePicker } from '../../../../CommonFilters/date-range-picker/date-range-picker';
import { WashoutDetails } from '../washout-details/washout-details';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-washout-report',
  imports: [CommonModule, Stores],
  templateUrl: './washout-report.html',
  styleUrl: './washout-report.scss'
})
export class WashoutReport {


  //////////////////////  REPORT CODE /////////////////////////////////////////////
  activePopover: number = -1;
  custom: boolean = false;
  bsRangeValue!: Date[];

  storesFilterData: any = {
  };
  FromDate: any = '';
  ToDate: any = '';
  minDate!: Date;
  maxDate!: Date;
  DateType: any = 'MTD';
  displaytime: any = '';
  Dates: any = [
      { 'code': 'MTD', 'name': 'MTD' },
      { 'code': 'QTD', 'name': 'QTD' },
      { 'code': 'YTD', 'name': 'YTD' },
      { 'code': 'PYTD', 'name': 'PYTD' },
      { 'code': 'LY', 'name': 'Last Year' },
      { 'code': 'LM', 'name': 'Last Month' },
      { 'code': 'PM', 'name': 'Same Month PY' },
    ]


  constructor(public shared: Sharedservice,    private ngbmodal: NgbModal,
) {
    this.setHeaderData();
    this.getwashoutreports();
      this.setDates(this.DateType)
  }

  avgrecords:any;
  records:any;
  getwashoutreports() {
            // this.shared.getMethodST('axelone/GetWashoutData').subscribe(
// 
    this.shared.api.getMethodST('axelone/GetWashoutData').subscribe(
      (res:any) => {
        console.log(res);
        let totalrecords = res.data.records;
        this.avgrecords = [totalrecords[0]];
        this.records = totalrecords.slice(1);
        console.log(this.avgrecords)
        console.log(this.records)
        // const result:any = [];
        // let currentDealer:any = null;

        // this.records.forEach((row:any) => {

        //   // Report Averages Row
        //   if (row.col_1 === 'Report Averages:') {
        //     result.push({
        //       type: 'report',
        //       data: row
        //     });
        //   }

        //   // Dealership Row
        //   else if (row.col_1 && !row.col_2) {

        //     currentDealer = {
        //       type: 'dealer',
        //       name: row.col_1,
        //       metrics: row,
        //       buyers: []
        //     };

        //     result.push(currentDealer);
        //   }

        //   // Buyer Row
        //   else if (!row.col_1 && row.col_2) {

        //     if (currentDealer) {
        //       currentDealer.buyers.push(row);
        //     }

        //   }

        // });

        // console.log(result);

      },
      (error:any) => {
        console.log(error);
      }
    );
  }

  removeComma(value: any): string {
  if (!value) return '';
  return value.toString().split(',').join('');
}
 

 setHeaderData() {
    const HeaderData = {
      title: 'Washout',
    };
     this.shared.api.SetHeaderData({ obj: HeaderData });
          // this.AOapi.SetHeaderData({ obj: HeaderData });

  } 

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

  StoresData(data: any) {
  }

  formatTradePercent(row: any): string {

  const val = row['Trade %'];

  if (val === null || val === undefined) {
    return '0%';
  }

  const percent = val * 100;

  return percent.toFixed(1) + '%';
}

getNoDecimal(value: number): number {
  return Math.round(value);
}

viewdetails(){
   const modalRef = this.ngbmodal.open(WashoutDetails, { size: 'xl', windowClass: 'compModal' });
    // modalRef.componentInstance.data = { dealno: dealData.Deal, storeid: dealData.storeid, stock: dealData.StockNumner, vin: dealData.vin, custno: dealData?.CustomerNumber }; // Pass data to the modal component    
    modalRef.result.then((result:any) => {
      console.log(result); // Handle modal close result
    }, (reason:any) => {
      console.log(`Dismissed: ${reason}`); // Handle dismiss reason
    });
}

  dateType: any = 'MTD';

  updatedDates(data: any) {
    // console.log(data);
    this.FromDate = data.FromDate;
    this.ToDate = data.ToDate;
    this.DateType = data.DateType;
    this.displaytime = data.DisplayTime
  }

    setDates(type: any) {
    this.displaytime = 'Time Frame (' + this.Dates.filter((val: any) => val.code == type)[0].name + ')';
    this.maxDate = new Date();
    this.minDate = new Date();
    this.minDate.setFullYear(this.maxDate.getFullYear() - 3);
    this.maxDate.setDate(this.maxDate.getDate());
    this.Dates.FromDate = this.FromDate;
    this.Dates.ToDate = this.ToDate;
    this.Dates.MinDate = this.minDate;
    this.Dates.MaxDate = this.maxDate;
    this.Dates.DateType = 'MTD';
    console.log(this.Dates.datetype)
    this.Dates.DisplayTime = this.displaytime;
  }

      activeTimeframe: string = 'MTD';

    setTimeframe(value: string, event: MouseEvent) {
  event.stopPropagation(); 
  this.activeTimeframe = value;
  this.displaytime = 'Time Frame (' +value+')'
}
}
