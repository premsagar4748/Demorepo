import { Component, HostListener, OnInit } from '@angular/core';
// import { ApiService } from '../../core/services/api.service';
import { CommonModule } from '@angular/common';
import { Stores } from '../stores/stores';
import { Sharedservice } from '../../../Core/Providers/Shared/sharedservice';

@Component({
  selector: 'app-vehicleflooring',
  imports: [CommonModule,Stores,],
  templateUrl: './vehicleflooring.html',
  styleUrl: './vehicleflooring.scss'
})
export class Vehicleflooring implements OnInit {

  FloorPlanData : any =[]
  activePopover: number = -1;

  constructor(private shared : Sharedservice){
    this.setHeaderData();
  }

  ngOnInit(): void {
    this.getVehicleFlooringData();
    // this.getSalesData();
    
  }


  getVehicleFlooringData(){
                this.shared.api.getMethodST('axelone/GetVehicleFlooringData').subscribe((res: any)=>{
// 
    // this.shared.api.getMethodST('axelone/GetVehicleFlooringData').subscribe((res: any)=>{
    // this.api.vehicleFloorService().subscribe((res: any)=>{
      if(res.status == 200){
       this.FloorPlanData = res.data;
      }
      else{
        this.FloorPlanData = [];
      }
    })
  }

    public inTheGreen(value: any): boolean {
      if(value == 'Not on Floorplan' || value == 'Sold Unit'){
        return true
      }
    return value >= 0;

  }

    @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = (event.target as HTMLElement).closest('.dropdown-toggle, .reportstores-card, .timeframe');
    if (!clickedInside) {
      this.activePopover = -1;
    }
  }

    storesFilterData: any = {
  };

  togglePopover(popoverIndex: number) {
    this.activePopover = this.activePopover === popoverIndex ? -1 : popoverIndex;
  }

  StoresData(data: any) {
  }

  // getSalesData(){
  //   this.shared.salesDataService().subscribe((res: any)=>{
  //     console.log(res);
      
  //   })
  // }

      activeTimeframe: string = 'MTD';

    setTimeframe(value: string, event: MouseEvent) {
  event.stopPropagation(); 
  this.activeTimeframe = value;
}

 setHeaderData() {
    const HeaderData = {
      title: 'Vehicle Flooring',
    };
     this.shared.api.SetHeaderData({ obj: HeaderData });
          // this.AOapi.SetHeaderData({ obj: HeaderData });

  }

formatBalance(value: any): string {
  if (value === 0 || value === '0' || value === null || value === undefined || isNaN(value)) {
    return '-';
  }
  return Number(value).toLocaleString();
}
}
