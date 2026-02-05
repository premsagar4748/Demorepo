import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
// import { ApiService } from '../../core/services/api.service';
import { Stores } from '../stores/stores';
//import { BsDaterangepickerDirective,BsDatepickerModule } from 'ngx';
import { Sharedservice } from '../../../Core/Providers/Shared/sharedservice';


@Component({
  selector: 'app-buyerranking',
  imports: [CommonModule, Stores,
   // BsDaterangepickerDirective, BsDatepickerModule.forRoot(),
  ],
  templateUrl: './buyerranking.html',
  styleUrl: './buyerranking.scss'
})
export class Buyerranking implements OnInit {

  activePopover: number = -1;
  burysData: any[] = [];
  sortedGroups: string[] = [];
  activeTimeframe: string = 'MTD';

  constructor(private shared: Sharedservice) { 
    this.setHeaderData();
  }

  ngOnInit(): void {
    this.loadBuyerData();

  }

  loadBuyerData() {
        this.shared.api.getMethodST('axelone/GetBuyerData').subscribe({

    // this.api.getBuyerData().subscribe({
      next: (res:any) => {
        this.burysData = res.data.records;
      },
      error: (err:any) => {
        console.error('API Error', err);
      }
    });
  }


  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = (event.target as HTMLElement).closest('.dropdown-toggle, .reportstores-card, .timeframe');
    if (!clickedInside) {
      this.activePopover = -1;
    }
  }

  storesFilterData: any = {};

  togglePopover(popoverIndex: number) {
    this.activePopover = this.activePopover === popoverIndex ? -1 : popoverIndex;
  }

  // StoresData(data: any) {
  // }

  setTimeframe(value: string, event: MouseEvent) {
  event.stopPropagation(); 
  this.activeTimeframe = value;
}

  bsRangeValue: Date[] = [];
  maxDate: Date = new Date();
 // @ViewChild('datepicker') datepicker!: BsDaterangepickerDirective;
  
  dateRangeCreated(event: Date[]): void {
    console.log('Got date:', event);
  }


  openbardate() {
 //   this.datepicker.show(); // Open the calendar
  }

 setHeaderData() {
    const HeaderData = {
      title: 'Buyer Rankings',
    };
     this.shared.api.SetHeaderData({ obj: HeaderData });
          // this.AOapi.SetHeaderData({ obj: HeaderData });

  }

}
