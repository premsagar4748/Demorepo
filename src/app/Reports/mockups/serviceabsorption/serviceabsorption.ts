import { Component, HostListener } from '@angular/core';
import { Stores } from '../stores/stores';
import { CommonModule } from '@angular/common';
// import { ApiService } from '../../core/services/api.service';
import { log } from 'console';
import { Sharedservice } from '../../../Core/Providers/Shared/sharedservice';

@Component({
  selector: 'app-serviceabsorption',
  imports: [CommonModule,Stores],
  templateUrl: './serviceabsorption.html',
  styleUrl: './serviceabsorption.scss'
})
export class Serviceabsorption {

  Service_Absorption : any[] = [];
  activePopover = -1;
    activeTimeframe: string = 'MTD';
  constructor(private shared:Sharedservice){
    this.setHeaderData();
}

  ngOnInit(): void {
   this.Service_Absorption_Data();
  }

  Service_Absorption_Data(){
    this.shared.api.getMethodST('axelone/GetAbsorptionData').subscribe({
// this.api.get_Service_Absorption_Data().subscribe({
      next: (res:any) => {
        console.log(res)
        this.Service_Absorption =res.data.records;
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

   StoresData(data: any) {
  }


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
      title: 'Fixed Absorption',
    };
     this.shared.api.SetHeaderData({ obj: HeaderData });
          // this.AOapi.SetHeaderData({ obj: HeaderData });

  }

}
