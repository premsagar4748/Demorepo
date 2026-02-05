import { Component, HostListener } from '@angular/core';
// import { ApiService } from '../core/services/api.service';
import { CommonModule } from '@angular/common';
import { Stores } from '../stores/stores';
import { Sharedservice } from '../../../Core/Providers/Shared/sharedservice';


@Component({
  selector: 'app-salestax',
  imports: [CommonModule,Stores],
  standalone: true,
  templateUrl: './salestax.html',
  styleUrl: './salestax.scss'
})
export class Salestax {

  //////////////////////  REPORT CODE /////////////////////////////////////////////
  activePopover: number = -1;
  custom: boolean = false;
  bsRangeValue!: Date[];
  salestaxdata: any = [];
  storesFilterData: any = {
  };

  constructor(public shared: Sharedservice) {
    this.setHeaderData();
    this.getsalestaxdata();

  }

  getsalestaxdata() {
    this.shared.api.getMethodST('axelone/GetSalesTaxData').subscribe(

      // this.shared.api.getMethodST('axelone/GetWashoutData').subscribe(
      (res: any) => {
        this.salestaxdata = res.data;
        console.log(this.salestaxdata, 'salestaxdata');
      },
      (error: any) => {
        console.log(error);
      }
    );
  }

  setHeaderData() {
    const HeaderData = {
      title: 'Sales Tax',
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

}
