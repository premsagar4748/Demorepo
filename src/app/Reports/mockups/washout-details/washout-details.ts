import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-washout-details',
  imports: [CommonModule],
  templateUrl: './washout-details.html',
  styleUrl: './washout-details.scss'
})
export class WashoutDetails {
  Opacity: any = 'N';
  searchText: string = '';
  spinnerLoader: boolean = false;

  constructor(private ngbmodalActive: NgbActiveModal,
){

  }

    filterData() {

    }

    close() {
          this.ngbmodalActive.close();
    }

    Details_ExportAsXLSX(){
      
    }
}
