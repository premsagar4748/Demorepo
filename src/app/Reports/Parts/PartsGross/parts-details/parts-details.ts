import { CurrencyPipe, DatePipe, DecimalPipe, NgIf, NgStyle, SlicePipe } from '@angular/common';
import { Component, ElementRef, Input, ViewChild, inject, signal } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import { PartsGrossService } from '../services/parts-gross.services';
import { NgxSpinnerService } from 'ngx-spinner';
import { Workbook } from 'exceljs';
import * as FileSaver from 'file-saver';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Sharedservice } from '../../../../Core/Providers/Shared/sharedservice';
// import { Repair } from '../../../../cdpfiles/repair/repair';

@Component({
  selector: 'app-parts-details',
  standalone: true,
  imports: [DatePipe, SlicePipe, NgStyle],
  templateUrl: './parts-details.html',
  styleUrl: './parts-details.scss',
  providers: [DatePipe]
})
export class PartsDetails {
  @Input() Servicedetails: any = [];
  // api = inject(PartsGrossService);
  // api = inject(Apiservice);
  modal = inject(NgbModal);
  spinner = inject(NgxSpinnerService);

  spinnerLoader = signal<boolean>(true);
  spinnerLoadersec = signal<boolean>(false);
  currentElement = signal<string>('');
  count = signal<any>(0);
  pageNumber = signal<any>(0);
  DealerPopupData = signal<any[]>([]);
  details = signal<any>([]);
  ServicePersonDetails = signal<any>([]);
  NoData = signal<boolean>(false);

  EXCEL_EXTENSION = '.xlsx';

  @ViewChild('scrollOne') scrollOne!: ElementRef;
  @ViewChild('scrollTwo') scrollTwo!: ElementRef;

  constructor(private datepipe: DatePipe,public shared: Sharedservice,) { }

  ngOnInit() {
    this.getDetails();
  }

  updateVerticalScroll(event: any): void {
    if (this.currentElement() === 'scrollTwo') {
      const ele = this.scrollOne?.nativeElement;
      if (ele) ele.scrollTop = event.target.scrollTop;

      if (event.target.scrollTop + event.target.clientHeight >= event.target.scrollHeight - 2) {
        if (this.details().length >= 100) {
          this.spinnerLoadersec.set(true);
          this.pageNumber.update((a: any) => a + 1);
          this.getDetails();
        }
      }
    } else {
      const ele = this.scrollTwo?.nativeElement;
      if (ele) ele.scrollTop = event.target.scrollTop;

      if (event.target.scrollTop + event.target.clientHeight >= event.target.scrollHeight - 2) {
        if (this.details().length >= 100) {
          this.spinnerLoadersec.set(true);
          this.pageNumber.update((a: any) => a + 1);
          this.getDetails();
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
    // console.log("🟦 FULL Servicedetails OBJ =", this.Servicedetails[0]);
    const f = this.Servicedetails[0];

    const obj = {
      startdealdate: f.StartDate,
      enddealdate: f.EndDate,

      Store: f.Store ?? "",             // FIXED
      Labortype: f.laborTypes ?? "",
      Saletype: f.Saletype ?? "",       // FIXED
      SourceBulk: f.SourceBulk ?? "",   // FIXED
      SourceTire: f.SourceTire ?? "",   // FIXED
      SourceWithout: f.SourceWithout ?? "", // FIXED

      var1: f.var1,
      var1Value: f.var1Value,

      var2: f.var2 ?? "",
      var3: f.var3 ?? "",
      var2Value: f.var2Value ?? "",
      var3Value: f.var3Value ?? "",

      PageNumber: '0',//this.pageNumber(),
      PageSize: '100'
    };

    this.spinnerLoader.set(true);
    this.spinnerLoadersec.set(true);
    // console.log('Pop up payload', obj)
    this.shared.api.postmethod(this.shared.common.routeEndpoint + '/GetPartsGrossSummaryDetailsNew', obj).subscribe({
        next: (res: any) => {

          const raw = res?.response ?? [];
          // console.log('api response check', raw)
          if (raw.length > 0) {

            const mapped = raw.map((r: any) => ({
              ...this.mapLeftTableRow(r),
              ...this.mapRightTableRow(r)
            }));

            this.ServicePersonDetails.set(mapped);
            // console.log('details data : ', this.ServicePersonDetails());
            this.DealerPopupData.set(mapped);
            this.NoData.set(false);
          } else {
            this.NoData.set(true);
          }

          this.spinnerLoader.set(false);
          this.spinnerLoadersec.set(false);
        },

        error: () => {
          this.spinnerLoader.set(false);
          this.spinnerLoadersec.set(false);
          this.NoData.set(true);
        }
      });
  }

  formatPopupValue(value: any, type: string) {
    if (!value) return "-";

    if (type === "cdate") {
      return this.datepipe.transform(value, "MM-dd-yyyy");
    }

    return value;
  }


  // Popup hover effect
  trTag = signal<any>('');
  secondtrtag = signal<any>('');

  hoverclass(e: any, i: any) {
    if (this.trTag()) this.trTag().classList.remove('hover');
    if (this.secondtrtag()) this.secondtrtag().classList.remove('hover');

    this.trTag.set(document.getElementById('SD_' + i));
    this.secondtrtag.set(document.getElementById('SP_' + i));

    this.trTag()?.classList.add('hover');
    this.secondtrtag()?.classList.add('hover');
  }

  viewRO(roData: any) {
    // const modalRef = this.modal.open(Repair, { size: 'lg', windowClass: 'roModal' });
    // modalRef.componentInstance.data = {
    //   ro: roData.ronumber,
    //   storeid: roData.StoreID,
    //   vin: roData.vin,
    //   vehicleid: roData.vehicleid,
    //   custno: roData.customernumber
    // };
  }

  exportAsXLSX() {
    // Excel code unchanged
  }

  mapServiceDetails(x: any) {
    return {
      Totalgross: x.Total_Gross,
      Totallabour: x.Total_Labor,
      TotalParts: x.Total_Parts,
      TotalTires: x.Total_Tires,
      TotalBulkOil: x.Total_BulkOil,

      Totalcost: x.Total_Cost,
      TotalSale: x.Total_Sale,
      Retention: x.Total_Retention,
      TotalELR: x.Total_ELR,
      Totalhours: x.Total_Hours,
      Discount: x.Total_Discount,

      CustomerPayGross: x.Cust_Gross,
      CustomerRetention: x.Cust_Retention,
      CustomerPayELR: x.Cust_ELR,
      CustomerPayhours: x.Cust_Hours,
      DiscountCP: x.Cust_Discount,

      WarrantyGross: x.Warranty_Gross,
      WarrantyRetention: x.Warranty_Retention,
      WarrantyELR: x.Warranty_ELR,
      Warrantyhours: x.Warranty_Hours,
      DiscountWP: x.Warranty_Discount,

      InternalGross: x.Internal_Gross,
      InternalRetention: x.Internal_Retention,
      InternalELR: x.Internal_ELR,
      Internalhours: x.Internal_Hours,
      DiscountIP: x.Internal_Discount,

      RO: x.InvoiceNumber,
      Date: x.CDate,
      Customer: x.Customername,
      Vehicle: x.MakeModel,
      VIN: x.VINNumber
    };
  }

  mapLeftTableRow(r: any) {
    return {
      ronumber: r.InvoiceNumber,
      closedate: r.CDate,
      CName: r.Customername,
      part: r.Partnumber,   // matches your left column header "PART #"
      description: r.AP_description,
      tires: (r.TireQuantity == 0 || r.TireQuantity == null || r.TireQuantity == undefined) ? '-' : r.TireQuantity    // used as description
    };
  }

  mapRightTableRow(r: any) {
    return {

      // TOTAL
      TotalSale: this.formatCurrency(r.Total_Sale),
      Totalgross: this.formatCurrency(r.Total_Gross),
      Retention: this.formatPercent(r.Total_Retention),
      TotalELR: r.Total_ELR,
      Totalhours: r.Total_Hours,
      Totalcost: r.Total_cost,
      Discount: r.Total_Discount,

      // CUSTOMER PAY
      Cust_Sale: this.formatCurrency(r.Cust_Sale),
      Cust_Gross: this.formatCurrency(r.Cust_Gross),
      Cust_Retention: this.formatPercent(r.Cust_Retention),
      CustomerPayhours: r.Cust_Hours,
      DiscountCP: r.Cust_Discount,

      // WARRANTY
      Warranty_Sale: this.formatCurrency(r.Warranty_Sale),
      Warranty_Gross: this.formatCurrency(r.Warranty_Gross),
      Warranty_Retention: this.formatPercent(r.Warranty_Retention),
      Warrantyhours: r.Warranty_Hours,
      DiscountWP: r.Warranty_Discount,

      // INTERNAL
      Internal_Sale: this.formatCurrency(r.Internal_Sale),
      Internal_Gross: this.formatCurrency(r.Internal_Gross),
      Internal_Retention: this.formatPercent(r.Internal_Retention),
      Internalhours: r.Internal_Hours,
      DiscountIP: r.Internal_Discount,

      // COUNTER
      Counter_sale: this.formatCurrency(r.Counter_sale),
      Counter_Gross: this.formatCurrency(r.Counter_Gross),
      Counter_Retention: this.formatPercent(r.Counter_Retention),
      CounterHours: r.Counter_Hours,
      CounterDiscount: r.Counter_Discount,

      // WHOLESALE
      Wholesale_Sale: this.formatCurrency(r.Wholesale_Sale),
      Wholesale_Gross: this.formatCurrency(r.Wholesale_Gross),
      Wholesale_Retention: this.formatPercent(r.Wholesale_Retention),
      WholesaleHours: r.Wholesale_Hours,
      WholesaleDiscount: r.Wholesale_Discount
    };
  }

  formatCurrency(value: number | string): string {
    if (value === null || value === undefined || value === '' || value == 0) {
      return '-';
    }
    return `$${value}`;
  }

  formatPercent(value: number | string): string {
    if (value === null || value === undefined || value === '' || value == 0) {
      return '-';
    }
    return `${Number(value).toFixed(1)}%`;
  }



  downloadDealerExcel(): void {

    const data = this.ServicePersonDetails();   // <- your popup table rows

    if (!data.length) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Parts Gross Details");

    worksheet.views = [
      {
        state: "frozen",
        ySplit: 3,
        topLeftCell: "A4",
        showGridLines: false,
      },
    ];

    // ========= TITLE ==========
    const titleRow = worksheet.getCell("A2");
    titleRow.value = "Parts Gross Details";
    titleRow.font = { name: "Arial", size: 15, bold: true };
    titleRow.alignment = { vertical: "middle", horizontal: "left" };

    // ========= DATE (top right) ==========
    // const today = this.datepipe.transform(new Date(), "MM.dd.yyyy h:mm:ss a");
    // const dateCell = worksheet.getCell("L2");
    // dateCell.value = today;
    // dateCell.font = { name: "Arial", size: 10 };
    // dateCell.alignment = { vertical: "middle", horizontal: "center" };

    // Blank row
    worksheet.addRow([]);

    // ========= Store Name ==========
    let rowStore = worksheet.addRow(["Store :", this.Servicedetails[0].var1Value]);
    rowStore.getCell(1).font = { name: "Arial", size: 9, bold: true };
    rowStore.getCell(2).font = { name: "Arial", size: 9 };
    rowStore.alignment = { indent: 1 };

    // ========= Start Date ==========
    let rowStart = worksheet.addRow(["Start Date :", this.Servicedetails[0].StartDate]);
    rowStart.getCell(1).font = { name: "Arial", size: 9, bold: true };
    rowStart.getCell(2).font = { name: "Arial", size: 9 };
    rowStart.alignment = { indent: 1 };

    // ========= End Date ==========
    let rowEnd = worksheet.addRow(["End Date :", this.Servicedetails[0].EndDate]);
    rowEnd.getCell(1).font = { name: "Arial", size: 9, bold: true };
    rowEnd.getCell(2).font = { name: "Arial", size: 9 };
    rowEnd.alignment = { indent: 1 };

    // ========= Advisor Name ==========
    let advisor = this.Servicedetails[0].userName || "-";
    let rowAdvisor = worksheet.addRow(["Advisor Name :", advisor]);
    rowAdvisor.getCell(1).font = { name: "Arial", size: 9, bold: true };
    rowAdvisor.getCell(2).font = { name: "Arial", size: 9 };
    rowAdvisor.alignment = { indent: 1 };

    worksheet.addRow([]);

    worksheet.addRow([]);

    // ===== HEADERS =====
    const headers = [
      "Invoice #",
      "Date",
      "Customer",
      "Part #",
      "Description",
      "Tires",

      "Total Sales",
      "Total Gross",
      "Total GP%",

      "CP Sales",
      "CP Gross",
      "CP GP%",

      "Warranty Sales",
      "Warranty Gross",
      "Warranty GP%",

      "Internal Sales",
      "Internal Gross",
      "Internal GP%",

      "Counter Sales",
      "Counter Gross",
      "Counter GP%",

      "Wholesale Sales",
      "Wholesale Gross",
      "Wholesale GP%",
    ];

    const headerRow = worksheet.addRow(headers);

    headerRow.font = {
      name: "Arial",
      bold: true,
      size: 10,
      color: { argb: "FFFFFF" },
    };

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "2A91F0" },
      };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // ===== BODY ROWS =====
    data.forEach((r: any, index: number) => {
      const row = worksheet.addRow([
        r.ronumber,
        this.datepipe.transform(r.closedate, 'MM-dd-yyyy'),
        r.CName,
        r.part,
        r.description,
        r.tires,

        r.TotalSale,
        r.Totalgross,
        r.Retention,

        r.Cust_Sale,
        r.Cust_Gross,
        r.Cust_Retention,

        r.Warranty_Sale,
        r.Warranty_Gross,
        r.Warranty_Retention,

        r.Internal_Sale,
        r.Internal_Gross,
        r.Internal_Retention,

        r.Counter_sale,
        r.Counter_Gross,
        r.Counter_Retention,

        r.Wholesale_Sale,
        r.Wholesale_Gross,
        r.Wholesale_Retention,
      ]);

      const valNums = [7, 8, 10, 11, 13, 14, 16, 17, 19, 20, 22, 23];
      // Alternate row coloring
      if (index % 2 === 0) {
        row.eachCell((cell: any, number: any) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F5F9FF" },
          };
        });
      }

      row.eachCell((cell: any, number: any) => {
        // console.log(cell);
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
        cell.font = { name: "Arial", size: 9 };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        if (valNums.includes(number)) {
          if (cell.value !== null && cell.value !== '-') {
            const numVal = Number(cell.value.replace(/[$,]/g, ''))
            cell.value = Number(numVal);
            cell.numFmt = '_($* #,##0.00_);_($* -#,##0.00_);_($* "-"??_);_(@_)';
          }
        }
      });
    });

    // ===== Auto Column Width =====
    worksheet.columns.forEach((col) => {
      col.width = 16;
    });

    worksheet.getColumn(3).width = 30;
    worksheet.getColumn(5).width = 30;

    // ===== Save File =====
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, `Parts_Gross_Details_${Date.now()}.xlsx`);
    });
  }

  mapSaleType(code: string) {
    const map: any = {
      'C': 'Customer Pay',
      'I': 'Internal',
      'R': 'Retail',
      'T': 'Warranty',
      'W': 'Wholesale'
    };
    return map[code] || code;
  }

}
