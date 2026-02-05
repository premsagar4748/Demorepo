import { CurrencyPipe, DatePipe, DecimalPipe, NgClass, NgFor, NgIf, NgStyle, SlicePipe } from '@angular/common';
import { Component, ElementRef, inject, Input, signal, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
// import { Apiservice } from '../../../../providers/services/apiservice';
import { Workbook } from 'exceljs';
import FileSaver from 'file-saver';
import { NgxSpinnerService } from 'ngx-spinner';
import { Sharedservice } from '../../../../Core/Providers/Shared/sharedservice';
// import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
// import { Notes } from '../../notes/notes';
// import { Repair } from '../../../cdpfiles/repair/repair';
const EXCEL_EXTENSION = '.xlsx';

@Component({
  selector: 'app-serviceopenro-details',
  imports: [CurrencyPipe, DecimalPipe, SlicePipe, NgClass, NgIf, FormsModule, NgStyle, NgFor],
  templateUrl: './serviceopenro-details.html',
  styleUrl: './serviceopenro-details.scss',
  providers: [DatePipe, NgbActiveModal]
})
export class ServiceopenroDetails {
  @Input() RODetailsObjectMain: any = [];
  NoData = signal<boolean>(false);

  spinnerLoader = signal<boolean>(false);
  spinnerLoadersec = signal<boolean>(false);
  pageNumber: any = 0;
  ServiceData = signal<any>([]);
  callLoadingState: any = 'FL';
  QISearchName: any = '';
  spinner = inject(NgxSpinnerService); 
  // toastrService = inject(ToastrService);
  modal = inject(NgbModal);
  constructor(public shared: Sharedservice,  private datepipe: DatePipe, private ngbmodalActive: NgbActiveModal,) {
  }
  // RODetailsObject: any = [];
  RODetailsObject = signal<any>([]);
  ngOnInit(): void {
    // console.log('Input data : ', this.RODetailsObjectMain);
    this.RODetailsObject.set([...this.RODetailsObjectMain]);
    // console.log(this.RODetailsObject()[0]);
    if (this.RODetailsObject()[0]) {
      this.total = this.RODetailsObject()[0].Total
      this.totalPageCount = this.RODetailsObject()[0].Total / 100;
      if (this.totalPageCount == Math.floor(this.totalPageCount)) {
      } else {
        this.totalPageCount = Math.floor(this.totalPageCount) + 1
      }
      if (this.RODetailsObject()[0].topfive == 'Y') {
        this.ServiceData.set(this.RODetailsObject()[0].data.RoInfo);
        this.details = this.RODetailsObject()[0].data.RoInfo;
        this.details = this.details.map((v: any) => ({
          ...v, comment: '+', notesView: '+', completeDetails: this.RODetailsObject()[0]
        }));
        this.details.some(function (x: any) {
          if (x.Notes != undefined && x.Notes != '') {
            x.Notes = JSON.parse(x.Notes);
          }
        });
        this.ServiceData.set([...this.details])
        this.filterData();

      } else {
        this.spinnerLoader.set(true);

        this.getDetails();
      }
    }

  }
  details: any = [];
  viewRO(roData: any) {
    // const modalRef = this.modal.open(Repair, { size: 'lg', windowClass: 'roModal' });
    // modalRef.componentInstance.data = { ro: roData.ronumber, storeid: roData.StoreID, vin: roData.vin, vehicleid: roData.vehicleid, custno: roData.customernumber };// Pass data to the modal component    
    // modalRef.result.then((result) => {
    //   console.log(result); // Handle modal close result
    // }, (reason) => {
    //   console.log(`Dismissed: ${reason}`); // Handle dismiss reason
    // });
  }
  total: any = 0
  totalPageCount: any = 0;
  clickedPage: number | null = null;
  currentPage: number = 1;
  itemsPerPage: number = 100;

  nextPage() {
    if (this.currentPage < this.getMaxPageNumber()) {
      this.currentPage++;
      this.clickedPage = null;
    }
    this.CurrentPageSetting = 1
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.clickedPage = null;
    }
    this.CurrentPageSetting = 1
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.clickedPage = null;
    this.CurrentPageSetting = 1;
  }

  goToFirstPage() {
    this.currentPage = 1;
    this.clickedPage = null;
    this.CurrentPageSetting = 1

  }
  goToLastPage() {
    this.currentPage = this.getMaxPageNumber();
    this.clickedPage = null;
    this.CurrentPageSetting = 1

  }
  getStartRecordIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage;
  }
  getEndRecordIndex(): number {
    const endIndex = this.getStartRecordIndex() + this.itemsPerPage;
    return endIndex > this.ServiceData().length ? this.ServiceData().length : endIndex;
  }
  getMaxPageNumber(): number {
    // console.log(Math.ceil(this.total / 100)-1);
    return Math.ceil(this.filteredServiceOpenROData.length / this.itemsPerPage);

    // return Math.ceil(this.total / 100);
  }
  getDetails() {
    this.spinnerLoader.set(true);
    this.NoData.set(false);
    const obj = {
      startdealdate: this.RODetailsObject()[0].StartDate,
      enddealdate: this.RODetailsObject()[0].EndDate,
      var1: this.RODetailsObject()[0].var1,
      var2: this.RODetailsObject()[0].var2,
      var3: '',
      var1Value: this.RODetailsObject()[0].topfive == 'Y' ? this.selectedRO.completeDetails.data.data1 : this.RODetailsObject()[0].var1Value,
      var2Value: this.RODetailsObject()[0].topfive == 'Y' ? this.selectedRO.completeDetails.data.data2 : this.RODetailsObject()[0].var2Value,
      var3Value: '',
      GrossTypeLabor:
        this.RODetailsObject()[0].GrossTypeLabor,
      GrossTypeParts:
        this.RODetailsObject()[0].GrossTypeParts,
      GrossTypeMisc: this.RODetailsObject()[0].GrossTypeMisc,
      GrossTypeSublet:
        this.RODetailsObject()[0].GrossTypeSublet,
      PaytypeCP: this.RODetailsObject()[0].PaytypeCP,
      PaytypeWarranty: this.RODetailsObject()[0].PaytypeWarranty,
      PaytypeInternal: this.RODetailsObject()[0].PaytypeInternal,
      inventory: this.RODetailsObject()[0].inventory,
      PageNumber: 0,
      PageSize: this.total,
      minage: this.RODetailsObject()[0].AgeFrom,
      maxage: this.RODetailsObject()[0].AgeTo,
      ROSTATUS: this.RODetailsObject()[0].ROSTATUS,
      Oldro: this.RODetailsObject()[0].topfive
    }
    this.shared.api.postmethod(this.shared.common.routeEndpoint +'GetServicesGrossSummaryDetailsV1Open', obj).subscribe(
      (res: any) => {
        if (res.status == 200) {
          this.ngbmodalActive.dismiss();
          if (this.popupOpen() == 'Y') {
            // this.toastrService.success('Comment added Successfully!', '');
          }
          this.popupOpen.set('N');
          if (res.response != undefined) {
            this.details = res.response.map((v: any) => ({
              ...v, comment: '+', notesView: '+'
            }));
            this.details.some(function (x: any) {
              if (x.Notes == null) {
                x.Notes = []
              }
              if (x.Notes != undefined && x.Notes != '') {
                x.Notes = JSON.parse(x.Notes);
              }
            });
            this.ServiceData.set(this.details);
            this.filterData();
            this.callLoadingState == 'ANS' ? this.sort(this.column, this.ServiceData(), this.callLoadingState) : ''

            this.spinnerLoader.set(false);
            this.spinnerLoadersec.set(false);
          } else {
            this.spinnerLoader.set(false);
            this.spinnerLoadersec.set(false);
            this.NoData.set(true);
          }
          if (this.ServiceData().length > 0) {
            this.NoData.set(false);
          } else {
            this.NoData.set(true);
          }
        }
        else {
          this.spinnerLoader.set(false);
          this.spinnerLoadersec.set(false);
          this.NoData.set(true);
        }
      })
  }

  get paginatedItems() {
    this.CurrentPageSetting != 1 ? this.currentPage = this.CurrentPageSetting : '';
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    // console.log('paginated Items : ', this.filteredServiceOpenROData.slice(startIndex, endIndex));
    return this.filteredServiceOpenROData.slice(startIndex, endIndex);
  }

  filteredServiceOpenROData: any = []
  filterData() {
    if (this.QISearchName.trim() !== '') {
      // this.filteredServiceOpenROData = this.ServiceData.filter((item: any) =>
      //   (item.ronumber && item.ronumber.toLowerCase().includes(this.QISearchName.toLowerCase())) ||
      //   (item.opendate && item.opendate.toLowerCase().includes(this.QISearchName.toLowerCase())) ||
      //   (typeof item.age === 'string' && item.age.toLowerCase().includes(this.QISearchName.toLowerCase())) ||
      //   (item.RoStatus && item.RoStatus.toLowerCase().includes(this.QISearchName.toLowerCase())) ||
      //   (item.CName && item.CName.toLowerCase().includes(this.QISearchName.toLowerCase())) ||
      //   (item.vehicle && item.vehicle.toLowerCase().includes(this.QISearchName.toLowerCase())) ||
      //   (item.vinno && item.vinno.toLowerCase().includes(this.QISearchName.toLowerCase())) ||
      //   (item.ServiceAdvisor_Name && item.ServiceAdvisor_Name.toLowerCase().includes(this.QISearchName.toLowerCase())) || 
      //   (item.Notes && Array.isArray(item.Notes) && item.Notes.some((note: any) =>
      //     typeof note.GN_Text === 'string' && note.GN_Text.toLowerCase().includes(this.QISearchName.toLowerCase())
      //   ))
      //   ).map((item: any) => {
      //     // if searching within Notes, filter only the matching ones
      //     if (Array.isArray(item.Notes)) {
      //       item = {
      //         ...item,
      //         Notes: item.Notes.filter((note: any) =>
      //           note?.GN_Text?.toLowerCase().includes(this.QISearchName.toLowerCase())
      //         )
      //       };
      //     }
      //     return item;
      //   });
      // this.filteredServiceOpenROData = this.ServiceData.filter((item: any) => {
      //   const search = this.QISearchName.toLowerCase();
      //   const matchesRonumber = item.ronumber?.toLowerCase().includes(search);
      //   const matchesOpenDate = item.opendate?.toLowerCase().includes(search);
      //   const matchesAge = typeof item.age === 'string' && item.age.toLowerCase().includes(search);
      //   const matchesRoStatus = item.RoStatus?.toLowerCase().includes(search);
      //   const matchesCName = item.CName?.toLowerCase().includes(search);
      //   const matchesVehicle = item.vehicle?.toLowerCase().includes(search);
      //   const matchesVinNo = item.vinno?.toLowerCase().includes(search);
      //   const matchesAdvisor = item.ServiceAdvisor_Name?.toLowerCase().includes(search);
      //   const matchesOtherFields = matchesRonumber || matchesOpenDate || matchesAge ||
      //     matchesRoStatus || matchesCName || matchesVehicle ||
      //     matchesVinNo || matchesAdvisor;

      //   if (matchesOtherFields) {
      //     console.log('Match');

      //     return true;
      //   }

      //   return Array.isArray(item.Notes) && item.Notes.some(
      //     (note: any) => note?.GN_Text?.toLowerCase().includes(search)
      //   );
      // }).map((item: any) => {
      //   const search = this.QISearchName.toLowerCase();
      //   if (Array.isArray(item.Notes)) {
      //     item = {
      //       ...item,
      //       Notes: item.Notes.filter((note: any) =>
      //         note?.GN_Text?.toLowerCase().includes(search)
      //       )
      //     };
      //   }
      //   return item;
      // });
      const search = this.QISearchName.toLowerCase();
      this.filteredServiceOpenROData = this.ServiceData()
        .map((item: any) => {
          const matchesRonumber = item.ronumber?.toLowerCase().includes(search);
          const matchesOpenDate = item.opendate?.toLowerCase().includes(search);
          const matchesAge = typeof item.age === 'string' && item.age.toLowerCase().includes(search);
          const matchesRoStatus = item.RoStatus?.toLowerCase().includes(search);
          const matchesCName = item.CName?.toLowerCase().includes(search);
          const matchesVehicle = item.vehicle?.toLowerCase().includes(search);
          const matchesVinNo = item.vinno?.toLowerCase().includes(search);
          const matchesAdvisor = item.ServiceAdvisor_Name?.toLowerCase().includes(search);

          const matchesOtherFields =
            matchesRonumber || matchesOpenDate || matchesAge ||
            matchesRoStatus || matchesCName || matchesVehicle ||
            matchesVinNo || matchesAdvisor;

          if (matchesOtherFields) {
            return item; // Include as-is (keep all Notes)
          }

          // No primary field matched; check Notes
          if (Array.isArray(item.Notes)) {
            const filteredNotes = item.Notes.filter(
              (note: any) => note?.GN_Text?.toLowerCase().includes(search)
            );

            if (filteredNotes.length > 0) {
              return {
                ...item,
                Notes: filteredNotes // only matched notes
              };
            }
          }

          // Neither fields nor Notes matched — exclude
          return null;
        })
        .filter((item: any) => item !== null);
    } else {
      this.filteredServiceOpenROData = [...this.ServiceData()];
    }
    this.callLoadingState == 'ANS' ? this.sort(this.column, this.filteredServiceOpenROData, this.callLoadingState) : ''
    let position = this.scrollpositionstoring + 10
    setTimeout(() => {
      this.scrollcent.nativeElement.scrollTop = position
      // //console.log(position);

    }, 500);
    this.pageNumber = 1;
  }

  toggleView(data: any) {
    if (data.notesView == '+') {
      data.notesView = '-'
    } else {
      data.notesView = '+'
    }
  }

  @ViewChild('scrollcent') scrollcent!: ElementRef;
  @ViewChild('scrollOne') scrollOne!: ElementRef;
  updateVerticalScroll(event: any): void {
    // this.scrollCurrentposition = event.target.scrollTop

    // this.scrollOne.nativeElement.scrollTop = event.target.scrollTop;
    // if (
    //   event.target.scrollTop + event.target.clientHeight >=
    //   event.target.scrollHeight - 2
    // ) {
    // alert("reached at bottom");
    // if (this.pageNumber == 0) {
    //   if (this.details.length == 100) {
    //     this.spinnerLoader = true;
    //     this.pageNumber++;
    //     // this.getDetails();
    //   }
    // } else {
    //   if (this.details.length >= 100) {
    //     this.spinnerLoader = true;
    //     this.pageNumber++;
    //     // this.getDetails();
    //   }
    // }
    // }

  }

  getBackgroundColor(value: any) {
    // if (block == 'Age') {
    if (value > 7) {
      return '#eb8181';
    }
    else {
      return;
    }
  }

  getBackgroundColorString(value: any) {
    if (value == 'READY TO POST' || value == 'PRE-INVOICED') {
      return '#9de39d';
    }
    else {
      return;
    }
  }

  popupOpen = signal<any>('');
  notesViewState = signal<boolean>(true);
  notesView() {
    this.notesViewState.set(!this.notesViewState());
  }

  notesData: any = {}
  Notespopup: any;
  selectedRO: any = [];
  scrollpositionstoring: any = 0;
  scrollCurrentposition: any = 0;
  CurrentPageSetting: any = 1;

  addNotes(data: any, ref: any) {
    this.scrollpositionstoring = this.scrollCurrentposition

    this.selectedRO = data
    this.notesData = {
      store: data.StoreID,
      title1: data.ronumber,
      title2: '',
      apiRoute: 'AddGeneralNotes'
    }

    this.Notespopup = this.modal.open(ref, { size: 'xxl', backdrop: 'static' });
  }

  closeNotes(e: any) {
    if (e == 'S') {
      this.callLoadingState = 'ANS'
      this.modal.dismissAll();
      this.CurrentPageSetting = this.currentPage
      // this.selectedRO.Notes
      // if (this.RODetailsObject[0].topfive == 'Y') {
      //   // this.selectedRO.data.Notes= 
      //   this.ServiceData = this.RODetailsObject[0].data.RoInfo;
      //   this.details = this.RODetailsObject[0].data.RoInfo;
      //   this.filterData();
      // } else {
      // this.getDetails();
      // }
    }
    if (e == 'C') {
      this.modal.dismissAll()
    }
  }

  savedNotes(e: any) {
    let obj = { "GN_Text": e.notes }
    this.selectedRO.Notes.unshift(obj)
    this.selectedRO.NotesStatus = 'Y';
  }

  isDesc: boolean = false;
  column: string = 'CategoryName';

  sort(property: any, data: any, state?: any) {
    if (state == undefined) {
      this.isDesc = !this.isDesc;
    }
    this.callLoadingState = 'FL'
    this.column = property;
    let direction = this.isDesc ? 1 : -1;
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

  exportAsXLSX() {
    this.spinner.show()
    const obj = {
      startdealdate: this.RODetailsObject()[0].StartDate,
      enddealdate: this.RODetailsObject()[0].EndDate,
      var1: this.RODetailsObject()[0].var1,
      var2: this.RODetailsObject()[0].var2,
      var3: '',
      var1Value: this.RODetailsObject()[0].topfive == 'Y' ? this.selectedRO.completeDetails.data.data1 : this.RODetailsObject()[0].var1Value,
      var2Value: this.RODetailsObject()[0].topfive == 'Y' ? this.selectedRO.completeDetails.data.data2 : this.RODetailsObject()[0].var2Value,
      var3Value: '',
      GrossTypeLabor:
        this.RODetailsObject()[0].GrossTypeLabor,
      GrossTypeParts:
        this.RODetailsObject()[0].GrossTypeParts,
      GrossTypeMisc: this.RODetailsObject()[0].GrossTypeMisc,
      GrossTypeSublet:
        this.RODetailsObject()[0].GrossTypeSublet,
      PaytypeCP: this.RODetailsObject()[0].PaytypeCP,
      PaytypeWarranty: this.RODetailsObject()[0].PaytypeWarranty,
      PaytypeInternal: this.RODetailsObject()[0].PaytypeInternal,
      inventory: this.RODetailsObject()[0].inventory,
      PageNumber: 0,
      PageSize: '10000',
      minage: this.RODetailsObject()[0].AgeFrom,
      maxage: this.RODetailsObject()[0].AgeTo,
      ROSTATUS: this.RODetailsObject()[0].ROSTATUS,
      Oldro: this.RODetailsObject()[0].topfive

    }

    this.shared.api.postmethod(this.shared.common.routeEndpoint +'GetServicesGrossSummaryDetailsV1Open', obj).subscribe(
      (res: any) => {
        this.spinner.hide()
        if (res.status == 200) {

          if (res.response != undefined) {
            if (res.response.length > 0) {
              let localarray = res.response;

              localarray.some(function (x: any) {
                if (x.Notes != undefined && x.Notes != '') {
                  x.Notes = JSON.parse(x.Notes);
                }

              });
              const workbook = new Workbook();
              const worksheet = workbook.addWorksheet('Service Open RO Details');
              worksheet.views = [
                {
                  state: 'frozen',
                  ySplit: 9, // Number of rows to freeze (2 means the first two rows are frozen)
                  topLeftCell: 'A10', // Specify the cell to start freezing from (in this case, the third row)
                  showGridLines: false,
                },
              ];
              const DateToday = this.datepipe.transform(new Date(), 'MM.dd.yyyy h:mm:ss a');

              const titleRow = worksheet.getCell("A2"); titleRow.value = 'Service Open RO Details';
              titleRow.font = { name: 'Arial', family: 4, size: 15, bold: true };
              titleRow.alignment = { indent: 1, vertical: 'middle', horizontal: 'left' }



              const DateBlock = worksheet.getCell("L2"); DateBlock.value = DateToday;
              DateBlock.font = { name: 'Arial', family: 4, size: 10 };
              DateBlock.alignment = { vertical: 'middle', horizontal: 'center' }
              worksheet.addRow([''])
              const Store_Name = worksheet.addRow(['Store Name :']);
              Store_Name.getCell(1).font = { name: 'Arial', family: 4, size: 9, bold: true, };
              Store_Name.alignment = { indent: 1, vertical: 'middle', horizontal: 'left' }
              const StoreName = worksheet.getCell("B4"); StoreName.value = this.RODetailsObject()[0].var1Value;
              StoreName.font = { name: 'Arial', family: 4, size: 9 };
              StoreName.alignment = { indent: 1, vertical: 'middle', horizontal: 'left' }

              const DATE_EXTENSION = this.datepipe.transform(
                new Date(),
                'MMddyyyy'
              );

              const StartDealDate = worksheet.addRow(['Start Date :']);
              const startdealdate = worksheet.getCell('B5');
              startdealdate.value = this.RODetailsObject()[0].StartDate;
              startdealdate.font = { name: 'Arial', family: 4, size: 9 };
              startdealdate.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
              StartDealDate.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
              StartDealDate.getCell(1).font = {
                name: 'Arial',
                family: 4,
                size: 9,
                bold: true,
              };
              const EndDealDate = worksheet.addRow(['End Date :']);
              EndDealDate.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
              const enddealdate = worksheet.getCell('B6');
              enddealdate.value = this.RODetailsObject()[0].EndDate;
              enddealdate.font = { name: 'Arial', family: 4, size: 9 };
              enddealdate.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
              EndDealDate.getCell(1).font = {
                name: 'Arial',
                family: 4,
                size: 9,
                bold: true,
              };
              // console.log(this.RODetailsObject()[0].EndDate, this.RODetailsObject()[0].StartDate, enddealdate.value, startdealdate.value);


              // const Var1Value = worksheet.addRow(['Advisor Name :']);
              // Var1Value.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
              // const var1value = worksheet.getCell('B7');
              // var1value.value = this.RODetailsObject()[0].userName == '' ? '-' : this.RODetailsObject()[0].userName == null ? '-' : this.RODetailsObject[0].userName;
              // var1value.font = { name: 'Arial', family: 4, size: 9 };
              // var1value.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
              // Var1Value.getCell(1).font = {
              //   name: 'Arial',
              //   family: 4,
              //   size: 9,
              //   bold: true,
              // };
              worksheet.addRow('');
              let Headings = [

                'RO #',
                'Date',
                'Age',
                'RO Status',
                'Customer',
                'Advisor',
                'Vehicle',
                'Stock',
                'Vin',
                'Total Gross',
                'Total Cost',
                'Total Sale',
                'Total GP%',
                'Total ELR',
                'Total Hours',
                'Total Discount',
                'Customer Pay	Gross',
                'Customer Pay	GP%',
                'Customer Pay	ELR',
                'Customer Pay	Hours',
                'Customer Pay	Discount',
                'Warranty Gross',
                'Warranty GP%',
                'Warranty ELR',
                'Warranty Hours',
                'Warranty Discount',
                'Internal Gross',
                'Internal GP%',
                'Internal ELR',
                'Internal Hours',
                'Internal Discount',
              ];
              const headerRow = worksheet.addRow(Headings);
              headerRow.font = {
                name: 'Arial',
                family: 4,
                size: 9,
                bold: true,
                color: { argb: 'FFFFFF' },
              };
              headerRow.height = 20;
              headerRow.alignment = {
                indent: 1,
                vertical: 'middle',
                horizontal: 'center',
              };
              headerRow.eachCell((cell, number) => {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: '2a91f0' },
                  bgColor: { argb: 'FF0000FF' },
                };
                headerRow.height = 20;
                cell.border = { right: { style: 'thin' } };
                cell.alignment = {
                  vertical: 'middle',
                  horizontal: 'center',
                  wrapText: true,
                };
              });
              var count = 0
              var notesCount = 9
              for (const d of localarray) {

                count++
                notesCount++
                d.opendate = this.datepipe.transform(d.opendate, 'MM.dd.yyyy');
                const Data1 = worksheet.addRow([

                  d.ronumber == '' ? '-' : d.ronumber == null ? '-' : d.ronumber,
                  d.opendate == '' ? '-' : d.opendate == null ? '-' : d.opendate,
                  d.age == '' ? '-' : d.age == null ? '-' : d.age.toString(),
                  d.RoStatus == '' ? '-' : d.RoStatus == null ? '-' : d.RoStatus,
                  d.CName == '' ? '-' : d.CName == null ? '-' : d.CName,
                  d.ServiceAdvisor_Name == '' ? '-' : d.ServiceAdvisor_Name == null ? '-' : d.ServiceAdvisor_Name,
                  d.vehicle == '' ? '-' : d.vehicle == null ? '-' : d.vehicle,
                  d.stock == '' ? '-' : d.stock == null ? '-' : d.stock,
                  d.vinno == '' ? '-' : d.vinno == null ? '-' : d.vinno,
                  d.Totalgross == '' ? '-' : d.Totalgross == null ? '-' : parseFloat(d.Totalgross),
                  d.Totalcost == '' ? '-' : d.Totalcost == null ? '-' : parseFloat(d.Totalcost),
                  d.TotalSale == '' ? '-' : d.TotalSale == null ? '-' : parseFloat(d.TotalSale),
                  d.Retention == '' ? '-' : d.Retention == null ? '-' : parseFloat(d.Retention) + ' %',
                  d.TotalELR == '' ? '-' : d.TotalELR == null ? '-' : parseFloat(d.TotalELR),
                  d.Totalhours == '' ? '-' : d.Totalhours == null ? '-' : parseFloat(d.Totalhours),
                  d.Discount == '' ? '-' : d.Discount == null ? '-' : parseFloat(d.Discount),
                  d.CustomerPayGross == '' ? '-' : d.CustomerPayGross == null ? '-' : parseFloat(d.CustomerPayGross),
                  d.CustomerRetention == '' ? '-' : d.CustomerRetention == null ? '-' : parseFloat(d.CustomerRetention) + ' %',
                  d.CustomerPayELR == '' ? '-' : d.CustomerPayELR == null ? '-' : parseFloat(d.CustomerPayELR),
                  d.CustomerPayhours == '' ? '-' : d.CustomerPayhours == null ? '-' : parseFloat(d.CustomerPayhours),
                  d.DiscountCP == '' ? '-' : d.DiscountCP == null ? '-' : parseFloat(d.DiscountCP),
                  d.WarrantyGross == '' ? '-' : d.WarrantyGross == null ? '-' : parseFloat(d.WarrantyGross),
                  d.WarrantyRetention == '' ? '-' : d.WarrantyRetention == null ? '-' : parseFloat(d.WarrantyRetention) + ' %',
                  d.WarrantyELR == '' ? '-' : d.WarrantyELR == null ? '-' : parseFloat(d.WarrantyELR),
                  d.Warrantyhours == '' ? '-' : d.Warrantyhours == null ? '-' : parseFloat(d.Warrantyhours),
                  d.DiscountWP == '' ? '-' : d.DiscountWP == null ? '-' : parseFloat(d.DiscountWP),
                  d.InternalGross == '' ? '-' : d.InternalGross == null ? '-' : parseFloat(d.InternalGross),
                  d.InternalRetention == '' ? '-' : d.InternalRetention == null ? '-' : parseFloat(d.InternalRetention) + ' %',
                  d.InternalELR == '' ? '-' : d.InternalELR == null ? '-' : parseFloat(d.InternalELR),
                  d.Internalhours == '' ? '-' : d.Internalhours == null ? '-' : parseFloat(d.Internalhours),
                  d.DiscountIP == '' ? '-' : d.DiscountIP == null ? '-' : parseFloat(d.DiscountIP),
                ]);
                // Data1.outlineLevel = 1; // Grouping level 1
                Data1.font = { name: 'Arial', family: 4, size: 8 };
                Data1.height = 18;
                // Data1.getCell(1).alignment = {indent: 1,vertical: 'middle', horizontal: 'left'}
                Data1.eachCell((cell, number) => {
                  cell.border = { right: { style: 'thin' } };
                  cell.numFmt = '$#,##0.00';
                  if (number == 13 || number == 18 || number == 23 || number == 28) {
                    cell.numFmt = '0.0';
                    cell.alignment = { indent: 1, vertical: 'middle', horizontal: 'center', };
                  }
                  if (number == 15 || number == 20 || number == 25 || number == 30) {
                    cell.numFmt = '0.00';
                    cell.alignment = { indent: 1, vertical: 'middle', horizontal: 'center', };
                  }




                  // else if (number == 15) {
                  //   cell.numFmt = '0.0';
                  //   cell.alignment = { indent: 1, vertical: 'middle', horizontal: 'center', };
                  // } else if (number == 20) {
                  //   cell.numFmt = '0.0';
                  //   cell.alignment = { indent: 1, vertical: 'middle', horizontal: 'center', };
                  // } else if (number == 25) {
                  //   cell.numFmt = '0.0';
                  //   cell.alignment = { indent: 1, vertical: 'middle', horizontal: 'center', };
                  // }
                  // if (number > 6 && number < 27) {
                  //   cell.alignment = { indent: 1, vertical: 'middle', horizontal: 'center', };
                  // } else if (number == 1) {
                  //   cell.numFmt = '###0';
                  //   cell.alignment = { indent: 1, vertical: 'middle', horizontal: 'center', };
                  // } else if (number == 2) {
                  //   cell.alignment = { indent: 1, vertical: 'middle', horizontal: 'center', };
                  // } else if (number > 1 && number < 7) {
                  //   cell.alignment = { indent: 1, vertical: 'middle', horizontal: 'center', };
                  // }
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
                if (d.NotesStatus == 'Y' && this.notesViewState() == true) {
                  worksheet.mergeCells(notesCount, 1, notesCount, 31);
                  const Data2NOtes = worksheet.getCell(notesCount, 1);
                  Data2NOtes.value = 'Notes'
                  Data2NOtes.alignment = { indent: 2, vertical: 'middle', horizontal: 'left', };
                  Data2NOtes.font = { name: 'Arial', family: 4, size: 9 };

                  Data2NOtes.border = { right: { style: 'thin' }, left: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' } };
                  notesCount++

                  for (const d1 of d.Notes) {
                    worksheet.mergeCells(notesCount, 1, notesCount, 31);
                    const Data2 = worksheet.getCell(notesCount, 1);
                    Data2.value = ' ' + ' ' + ' ' + ' ' + ' ' + ' ' + d1.GN_Text
                    Data2.alignment = { indent: 2, vertical: 'middle', horizontal: 'left', };
                    Data2.font = { name: 'Arial', family: 4, size: 9 };
                    Data2.border = { right: { style: 'thin' }, left: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' } };
                    Data2.fill = {
                      type: 'pattern',
                      pattern: 'solid',
                      fgColor: { argb: 'e5e5e5' },
                      bgColor: { argb: 'FF0000FF' },
                    };
                    notesCount++
                  }
                }

              }
              worksheet.getColumn(1).width = 18;
              worksheet.getColumn(2).width = 20;
              worksheet.getColumn(3).width = 15;
              worksheet.getColumn(4).width = 30;
              worksheet.getColumn(5).width = 30;
              worksheet.getColumn(6).width = 30;
              worksheet.getColumn(7).width = 15;
              worksheet.getColumn(8).width = 30;
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
              worksheet.getColumn(22).width = 15;
              worksheet.getColumn(23).width = 15;
              worksheet.getColumn(24).width = 15;
              worksheet.getColumn(25).width = 15;
              worksheet.getColumn(26).width = 15;
              worksheet.addRow([]);
              workbook.xlsx.writeBuffer().then((data: any) => {
                const blob = new Blob([data], {
                  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });
                FileSaver.saveAs(blob, 'Service Open RO Details' + DATE_EXTENSION + EXCEL_EXTENSION);
              });
            }
          }
        } else {
          this.spinner.hide()
          // this.toast.error(res.error)
        }
      })
  }
}
