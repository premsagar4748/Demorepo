import { Component, HostListener } from '@angular/core';
import { Sharedservice } from '../../../Core/Providers/Shared/sharedservice';
import { SharedModule } from '../../../Core/Providers/Shared/shared.module';
import { CommonModule } from '@angular/common';

import { Stores } from '../../../CommonFilters/stores/stores';
// import { DateRangePicker } from '../../../../CommonFilters/date-range-picker/date-range-picker';

@Component({
  selector: 'app-washout-report',
  imports: [CommonModule, Stores,/*DateRangePicker*/],
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

  constructor(public shared: Sharedservice) {
    this.setHeaderData();
    this.getwashoutreports();

  }

  getwashoutreports() {
    this.shared.api.getMethodST('axelone/GetWashoutData').subscribe(
      (res) => {
        console.log(res)
      },
      (error) => {
        console.log(error);
      }
    );
  }

  setHeaderData() {
    const HeaderData = {
      title: 'Washout',
    };
    this.shared.api.SetHeaderData({ obj: HeaderData });
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
