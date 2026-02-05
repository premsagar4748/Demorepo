import { Component, HostListener } from '@angular/core';
import { Stores } from '../stores/stores';
import { CommonModule } from '@angular/common';
// import { ApiService } from '../../core/services/api.service';
import { FormsModule } from '@angular/forms';
import { Sharedservice } from '../../../Core/Providers/Shared/sharedservice';

@Component({
  selector: 'app-finreconciliation',
  imports: [FormsModule,CommonModule,Stores],
  templateUrl: './finreconciliation.html',
  styleUrl: './finreconciliation.scss'
})
export class Finreconciliation {
  notesViewState:boolean=true;
  activePopover: number = -1;
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
NoData:any;
    constructor(public shared: Sharedservice,){
      this.setHeaderData();
      this.setDates(this.DateType);
      this.getFinreservRecon();
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


  openComments(){

  }

  sort(data:any){

  }

  notesView(){

  }

  StoresData(data: any) {
  }

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

  FinanceReserveReconData:any;
    getFinreservRecon() {
      this.shared.api.getMethodST('axelone/GetFinReservRecon').subscribe(
    // this.shared.api.getMethodST('axelone/GetFinReservRecon').subscribe(
      (res:any) => {
        console.log(res);
        let totalrecords = res.data;
        this.FinanceReserveReconData = totalrecords;
        console.log(this.FinanceReserveReconData)
      },
      (error:any) => {
        console.log(error);
      }
    );
  }

  notes:any;
  inTheGreen(data:any){
    return true;
  }

  addNotes(data:any,data1:any){

  }

  viewDeal(data:any){

  }

  enableEdit(data:any){

  }

  saveFinanceRouteOne(data:any){

  }

  cancelEdit(data:any){

  }

  formatDiff(data:any){
    return data;
  }

    activeTimeframe: string = 'MTD';

    setTimeframe(value: string, event: MouseEvent) {
  event.stopPropagation(); 
  this.activeTimeframe = value;
}

    setHeaderData() {
    const HeaderData = {
      title: 'Finance Reserve Recon',
    };
     this.shared.api.SetHeaderData({ obj: HeaderData });
          // this.AOapi.SetHeaderData({ obj: HeaderData });

  }
}
