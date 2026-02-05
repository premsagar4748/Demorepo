import { CurrencyPipe, DatePipe, DecimalPipe, NgClass, NgIf, NgStyle, SlicePipe } from '@angular/common';
import { Component, effect, ElementRef, inject, input, Input, signal, viewChild, ViewChild } from '@angular/core';
// import { Apiservice } from '../../../../providers/services/apiservice';
import { Sharedservice } from '../../../../Core/Providers/Shared/sharedservice';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { Workbook } from 'exceljs';
import * as FileSaver from 'file-saver';
// import { Repair } from '../../../cdpfiles/repair/repair';
import { common } from '../../../../common';
@Component({
  selector: 'app-servicegross-details',
  standalone: true,
  imports: [DatePipe, SlicePipe, NgClass, CurrencyPipe, DecimalPipe, NgStyle],
  templateUrl: './servicegross-details.html',
  styleUrl: './servicegross-details.scss',
  providers: [DatePipe]
})
export class ServicegrossDetails {
  @Input() Servicedetails: any = [];
  shared = inject(Sharedservice);
  modal = inject(NgbModal);
  comm = inject(common);
  spinner = inject(NgxSpinnerService);
  spinnerLoader = signal<boolean>(true);
  spinnerLoadersec = signal<boolean>(false);
  currentElement = signal<string>('');
  count = signal<any>(0); pageNumber = signal<any>(0);
  details = signal<any>([]); ServicePersonDetails = signal<any>([]); NoData = signal<boolean>(false);

  EXCEL_EXTENSION = '.xlsx';

  scrollOne = viewChild<ElementRef>('scrollOne');
  scrollTwo = viewChild<ElementRef>('scrollTwo');

  constructor(private datepipe: DatePipe) { }

  ngOnInit() {
    // console.log('From details ', this.Servicedetails);
    this.getDetails();
  }

  updateVerticalScroll(event: any): void {
    if (this.currentElement() === 'scrollTwo') {
      const ele = this.scrollOne()?.nativeElement;
      if (ele) { ele.scrollTop = event.target.scrollTop };

      if (
        event.target.scrollTop + event.target.clientHeight >=
        event.target.scrollHeight - 2
      ) {
        if (this.count() % 2 == 0) {
          if (this.pageNumber() == 0) {
            if (this.details().length == 100) {
              this.spinnerLoadersec.set(true);
              this.pageNumber.update((a: any) => a + 1);
              this.getDetails();
            }
            // this.spinnerLoadersec = true;
            // this.pageNumber++;
            // this.GetDetails();
          } else {
            if (this.details().length >= 100) {
              this.spinnerLoadersec.set(true);
              this.pageNumber.update((a: any) => a + 1);
              this.getDetails();
            }
          }
        }
      }
    }
    else if (this.currentElement() === 'scrollOne') {
      const ele = this.scrollTwo()?.nativeElement;
      if (ele) { ele.scrollTop = event.target.scrollTop };
      if (
        event.target.scrollTop + event.target.clientHeight >=
        event.target.scrollHeight - 2
      ) {
        this.count.update((a: any) => a++);
        if (this.count() % 2 == 0) {
          if (this.pageNumber() == 0) {
            if (this.details().length == 100) {
              this.spinnerLoadersec.set(true);
              this.pageNumber.update((a: any) => a + 1);
              this.getDetails();
            }
            // this.spinnerLoadersec = true;
            // this.pageNumber++;
            // this.GetDetails();
          } else {
            if (this.details().length >= 100) {
              this.spinnerLoadersec.set(true);
              this.pageNumber.update((a: any) => a + 1);;
              this.getDetails();
            }
          }
        }
      }
    }
  }


  updateCurrentElement(element: 'scrollOne' | 'scrollTwo') {
    this.currentElement.set(element);
  }

  close() {
    this.modal.dismissAll();
  }

  getDetails() {
    let obj = {
      "startdealdate": this.Servicedetails[0].StartDate,
      "enddealdate": this.Servicedetails[0].EndDate,
      "var1": this.Servicedetails[0].var1,
      "var2": this.Servicedetails[0].var2,
      "var3": this.Servicedetails[0].var3,
      "var1Value": this.Servicedetails[0].var1Value,
      "var2Value": this.Servicedetails[0].var2Value,
      "var3Value": this.Servicedetails[0].var3Value,
      "PaytypeC": this.Servicedetails[0].PaytypeC,
      "PaytypeW": this.Servicedetails[0].PaytypeW,
      "PaytypeI": this.Servicedetails[0].PaytypeI,
      "GrossTypeM": '',
      "GrossTypeL": '',
      "GrossTypeS": '',
      "GrossTypeP": '',
      "DepartmentS": this.Servicedetails[0].DepartmentS,
      "DepartmentP": this.Servicedetails[0].DepartmentP,
      "DepartmentQ": this.Servicedetails[0].DepartmentQ,
      "DepartmentB": this.Servicedetails[0].DepartmentB,
      "DepartmentD": '',
      "PolicyAccount": this.Servicedetails[0].PolicyAccount,
      "excludeZeroHours": this.Servicedetails[0].zeroHours,
      "PageNumber": this.pageNumber(),
      "PageSize": "100",
      "LaborTypes": this.Servicedetails[0].laborTypes
    }
    //console.log(obj, ' v2 sublet');
    this.shared.api.postmethod(this.comm.routeEndpoint + 'GetServicesGrossSummaryDetailsV2Sublet', obj).subscribe((res: any) => {
      //console.log('Details Response ', res);
      if (res.status == 200) {
        if (res?.response?.length > 0) {
          this.details.set(res.response);
          this.ServicePersonDetails.set([
            ...this.ServicePersonDetails(),
            ...this.details(),
          ]);

          this.spinnerLoader.set(false);
          this.spinnerLoadersec.set(false);

          // if (this.ServicePersonDetails.length > 0) {
          //   this.NoData.set(true);
          // } else {
          //   this.NoData.set(true);
          // }

        } else {
          this.spinnerLoader.set(false);
          this.spinnerLoadersec.set(false);
          this.NoData.set(true);
        }
        // this.ServicePersonDetails = [];
      }
      if (this.ServicePersonDetails().length > 0) {
        this.NoData.set(false);
      } else {
        this.spinnerLoader.set(false);
        this.spinnerLoadersec.set(false);
        this.NoData.set(true);
      }
    }, err => {
      this.spinnerLoader.set(false);
      this.spinnerLoadersec.set(false);
      this.NoData.set(true);
    })
  }

  trTag = signal<any>('');
  secondtrtag = signal<any>('');
  hoverclass(e: any, i: any) {
    if (this.trTag() != '') {
      this.trTag().classList.remove('hover');
      this.secondtrtag().classList.remove('hover');
    }
    let id = (e.target as Element).id;
    this.trTag.set(document.getElementById('SD_' + i));
    this.secondtrtag.set(document.getElementById('SP_' + i));
    if (id == 'SD_' + i || id == 'SP_' + i) {
      this.trTag().classList.add('hover');
      this.secondtrtag().classList.add('hover');
    }
  }

  viewRO(roData: any) {
    // const modalRef = this.modal.open(Repair, { size: 'lg', windowClass: 'roModal' });
    // modalRef.componentInstance.data = { ro: roData.ronumber, storeid: roData.StoreID, vin: roData.vin, vehicleid: roData.vehicleid, custno: roData?.customernumber }; // Pass data to the modal component    
    // modalRef.result.then((result) => {
    //   console.log(result); // Handle modal close result
    // }, (reason) => {
    //   console.log(`Dismissed: ${reason}`); // Handle dismiss reason
    // });
  }

  exportAsXLSX() {
    this.spinner.show()
    let obj = {
      "startdealdate": this.Servicedetails[0].StartDate,
      "enddealdate": this.Servicedetails[0].EndDate,
      "var1": this.Servicedetails[0].var1,
      "var2": this.Servicedetails[0].var2,
      "var3": this.Servicedetails[0].var3,
      "var1Value": this.Servicedetails[0].var1Value,
      "var2Value": this.Servicedetails[0].var2Value,
      "var3Value": this.Servicedetails[0].var3Value,
      "PaytypeC": this.Servicedetails[0].PaytypeC,
      "PaytypeW": this.Servicedetails[0].PaytypeW,
      "PaytypeI": this.Servicedetails[0].PaytypeI,
      "GrossTypeM": '',
      "GrossTypeL": '',
      "GrossTypeS": '',
      "GrossTypeP": '',
      "DepartmentS": this.Servicedetails[0].DepartmentS,
      "DepartmentP": this.Servicedetails[0].DepartmentP,
      "DepartmentQ": this.Servicedetails[0].DepartmentQ,
      "DepartmentB": this.Servicedetails[0].DepartmentB,
      "DepartmentD": '',
      "PolicyAccount": this.Servicedetails[0].PolicyAccount,
      "excludeZeroHours": this.Servicedetails[0].zeroHours,
      "PageNumber": 0,
      "PageSize": "100000",
      "LaborTypes": this.Servicedetails[0].laborTypes
    }
    this.shared.api.postmethod(this.comm.routeEndpoint + 'GetServicesGrossSummaryDetailsV2Sublet', obj)
      .subscribe((res: any) => {
        if (res.status == 200) {
          this.spinner.hide();
          if (res.response != undefined) {
            if (res.response.length > 0) {
              let localarray = res.response
              const workbook = new Workbook();
              const worksheet = workbook.addWorksheet('Service Gross Details');
              worksheet.views = [
                {
                  state: 'frozen',
                  ySplit: 9, // Number of rows to freeze (2 means the first two rows are frozen)
                  topLeftCell: 'A10', // Specify the cell to start freezing from (in this case, the third row)
                  showGridLines: false,
                },
              ];
              const DateToday = this.datepipe.transform(new Date(), 'MM.dd.yyyy h:mm:ss a');

              const titleRow = worksheet.getCell("A2"); titleRow.value = 'Service Gross Details';
              titleRow.font = { name: 'Arial', family: 4, size: 15, bold: true };
              titleRow.alignment = { indent: 1, vertical: 'middle', horizontal: 'left' }



              const DateBlock = worksheet.getCell("L2"); DateBlock.value = DateToday;
              DateBlock.font = { name: 'Arial', family: 4, size: 10 };
              DateBlock.alignment = { vertical: 'middle', horizontal: 'center' }
              worksheet.addRow([''])
              const Store_Name = worksheet.addRow(['Store Name :']);
              Store_Name.getCell(1).font = { name: 'Arial', family: 4, size: 9, bold: true, };
              Store_Name.alignment = { indent: 1, vertical: 'middle', horizontal: 'left' }
              const StoreName = worksheet.getCell("B4"); StoreName.value = this.Servicedetails[0].var1Value;
              StoreName.font = { name: 'Arial', family: 4, size: 9 };
              StoreName.alignment = { indent: 1, vertical: 'middle', horizontal: 'left' }

              const DATE_EXTENSION = this.datepipe.transform(
                new Date(),
                'MMddyyyy'
              );

              const StartDealDate = worksheet.addRow(['Start Date :']);
              const startdealdate = worksheet.getCell('B5');
              startdealdate.value = this.Servicedetails[0].StartDate;
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
              enddealdate.value = this.Servicedetails[0].EndDate;
              enddealdate.font = { name: 'Arial', family: 4, size: 9 };
              enddealdate.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
              EndDealDate.getCell(1).font = {
                name: 'Arial',
                family: 4,
                size: 9,
                bold: true,
              };

              const Var1Value = worksheet.addRow(['Advisor Name :']);
              Var1Value.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
              const var1value = worksheet.getCell('B7');
              var1value.value = this.Servicedetails[0].userName == '' ? '-' : this.Servicedetails[0].userName == null ? '-' : this.Servicedetails[0].userName;
              var1value.font = { name: 'Arial', family: 4, size: 9 };
              var1value.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
              Var1Value.getCell(1).font = {
                name: 'Arial',
                family: 4,
                size: 9,
                bold: true,
              };
              worksheet.addRow('');
              let Headings = [
                'Sl.no',
                'RO #',
                'Date',
                'Customer',
                'Vehicle',
                'VIN',
                // 'Op Code',
                // 'Op Code Desc',
                'Total Gross',
                'Total Labor', 'Total Parts', 'Total Tires', 'Total Lube', 'Total Cost', 'Total Sale',
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
              for (const d of localarray) {
                count++
                d.closedate = this.datepipe.transform(d.closedate, 'MM.dd.yyyy');
                const Data1 = worksheet.addRow([
                  count,
                  d.ronumber == '' ? '-' : d.ronumber == null ? '-' : d.ronumber,
                  d.closedate == '' ? '-' : d.closedate == null ? '-' : d.closedate,
                  d.CName == '' ? '-' : d.CName == null ? '-' : d.CName,
                  d.vehicle == '' ? '-' : d.vehicle == null ? '-' : d.vehicle,
                  d.vin == '' ? '-' : d.vin == null ? '-' : d.vin,
                  // d.ASD_Opcode == '' ? '-' : d.ASD_Opcode == null ? '-' : d.ASD_Opcode,
                  // d.ASD_opcodedescription == '' ? '-' : d.ASD_opcodedescription == null ? '-' : d.ASD_opcodedescription,
                  d.Totalgross == '' ? '-' : d.Totalgross == null ? '-' : parseFloat(d.Totalgross),
                  d.Totallabour == '' ? '-' : d.Totallabour == null ? '-' : parseFloat(d.Totallabour),
                  d.TotalParts == '' ? '-' : d.TotalParts == null ? '-' : parseFloat(d.TotalParts),
                  d.TotalTires == '' ? '-' : d.TotalTires == null ? '-' : parseFloat(d.TotalTires),
                  d.TotalBulkOil == '' ? '-' : d.TotalBulkOil == null ? '-' : parseFloat(d.TotalBulkOil),
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
                  cell.numFmt = '$#,##0';
                  if (number == 7 || number == 18 || number == 23 || number == 28) {
                    cell.numFmt = '$#,##0.00'; // Default format
                    cell.alignment = { indent: 1, vertical: 'middle', horizontal: 'center', };
                  }
                  if (number == 16 || number == 21 || number == 26 || number == 31) {
                    cell.numFmt = '0.00';
                    cell.alignment = { indent: 1, vertical: 'middle', horizontal: 'center', };
                  }
                  if (number > 4 && number < 25) {
                    cell.alignment = { indent: 1, vertical: 'middle', horizontal: 'center', };
                  } else if (number == 1) {
                    cell.numFmt = '###0';
                    cell.alignment = { indent: 1, vertical: 'middle', horizontal: 'center', };
                  } else if (number == 2) {
                    cell.alignment = { indent: 1, vertical: 'middle', horizontal: 'center', };
                  } else if (number > 1 && number < 7) {
                    cell.alignment = { indent: 1, vertical: 'middle', horizontal: 'center', };
                  }
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
                FileSaver.saveAs(blob, 'Service Gross Details' + DATE_EXTENSION + this.EXCEL_EXTENSION);
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
