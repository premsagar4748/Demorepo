import { Component, Input, Output, EventEmitter, signal } from '@angular/core';

import { NgxSpinnerService, NgxSpinnerComponent } from 'ngx-spinner';
// import * as XLSX from 'xlsx';
// import FileSaver, { saveAs } from 'file-saver';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
// import { Repair } from '../../../../modules/cdpfiles/repair/repair';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';   // ✅ Added
import { CurrencyPipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Workbook } from 'exceljs';
// import { DatePipe } from '@angular/common';
import { NgxSpinner } from 'ngx-spinner';
import { Sharedservice } from '../../../../Core/Providers/Shared/sharedservice';
@Component({
  selector: 'app-partsopenros-details',
  standalone: true,
  imports: [FormsModule, DatePipe, CurrencyPipe],
  providers: [DatePipe],
  templateUrl: './partsopenros-details.html',
  styleUrl: './partsopenros-details.scss',
})
export class PartsopenrosDetails {
  @Input() rowData: any;
  @Input() filteredChildData: any[] = [];

  @Input() payloadObject: any;
  @Input() searchText: string = '';

  @Output() childDataLoaded = new EventEmitter<any>();
  @Output() viewROEvent = new EventEmitter<any>();
spinnerLoader = signal<boolean>(false);
  spinnerLoadersec = signal<boolean>(false);
  
  constructor(
    private shared: Sharedservice,
   
    private spinner: NgxSpinnerService,
    private modal: NgbModal,
    private datepipe: DatePipe
  ) { }

  ngOnInit() {
    this.getDetailsData();
  }
// Track the current sort column and direction
sortColumn: string = '';
sortDirection: 'asc' | 'desc' = 'asc';

// Call this on clicking a column
sortData(column: string) {
  if (this.sortColumn === column) {
    // Toggle direction
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    this.sortColumn = column;
    this.sortDirection = 'asc';
  }

  // Assuming your data is in 'tableData' array
  this.filteredChildData.sort((a: any, b: any) => {
    let valA = a[column];
    let valB = b[column];

    // Convert to string for null/undefined safety
    valA = valA !== null && valA !== undefined ? valA : '';
    valB = valB !== null && valB !== undefined ? valB : '';

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}

  // ----------------------------------------------
  // FETCH CHILD DETAILS
  // ----------------------------------------------
  getDetailsData() {
    this.spinnerLoader.set(true);
    console.log('rowData', this.rowData)

    const payload = {
      startdealdate: this.payloadObject.startdate,
      enddealdate: this.payloadObject.enddate,
      Labortype: this.payloadObject.Labortype,
      Saletype: this.payloadObject.Saletype,
      var1: this.payloadObject.var1,
      var2: this.payloadObject.var2,
      var3: this.payloadObject.var3,

      // IMPORTANT FIXES
      var1Value: this.rowData?.data1,
      var2Value: this.rowData?.data2?.data2 || this.rowData?.data2 || "",
      var3Value: "",

      PageNumber: "0",
      PageSize: "200",
      minage: this.payloadObject.minage,
      maxage: this.payloadObject.maxage,
      Oldro: this.payloadObject.Oldro
    };


    this.shared.api.postmethod(this.shared.common.routeEndpoint +'GetPartsGrossSummaryDetailsOpen', payload).subscribe({
      next: (res: any) => {
        const details = Array.isArray(res?.response) ? res.response : [];

        this.filteredChildData = [...details];
        this.rowData.childData = [...details];   // ✅ Ensure rowData contains childData

        this.childDataLoaded.emit(details);      // Notify parent
        this.spinnerLoader.set(false);
      },
      error: (err: any) => {
        console.error('DETAIL API ERROR:', err);
        this.spinnerLoader.set(false);
      }
    });
  }
  // ---------------------------------------------------------
  // LOAD CHILD DETAILS (called by parent when row expanded)
  // ---------------------------------------------------------
  loadChildDetails(rowData: any, payload: any) {
    this.rowData = rowData;
    this.payloadObject = payload;

    // Reset old data
    this.filteredChildData = [];
    this.searchText = '';

    // Fetch child data
    this.getDetailsData();
  }

  // ----------------------------------------------
  // SEARCH
  // ----------------------------------------------
  onSearchChild() {
    const search = (this.searchText || '').trim().toLowerCase();
    const source = this.rowData?.childData || [];

    if (!search) {
      this.filteredChildData = [...source];
      return;
    }

    this.filteredChildData = source.filter((item: any) =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(search)
      )
    );
  }

  // ----------------------------------------------
  // EXPORT EXCEL
  // ----------------------------------------------
downloadExcel() {
//   this.spinner.show();

//   const data = this.filteredChildData || [];
//   if (!data.length) { this.spinner.hide(); return; }

//   const workbook = new Workbook();
//   const worksheet = workbook.addWorksheet('Child Data');

//   worksheet.views = [{ state: 'frozen', ySplit: 4 }];

//   // ----------- TITLE -------------
//   const titleRow = worksheet.getCell('A2');
//   titleRow.value = 'PartsOpenRO Details';
//   titleRow.font = { name: 'Arial', size: 15, bold: true };
//   titleRow.alignment = { vertical: 'middle', horizontal: 'left' };

//   worksheet.addRow([]);

//   // ----------- HEADERS -----------
//   const headers = [
//     'OPEN DATE', 'CUSTOMER', 'INVOICE #', 'AGE', 'PART #', 'RO #', 'DESCRIPTION',
//     'TOTAL GROSS', 'TOTAL GP%', 'TOTAL ELR', 'TOTAL HOURS', 'TOTAL DISCOUNT',
//     'CUSTOMER PAY GROSS', 'CUSTOMER PAY GP%', 'CUSTOMER PAY ELR', 'CUSTOMER PAY HOURS', 'CUSTOMER PAY DISCOUNT',
//     'WARRANTY GROSS', 'WARRANTY GP%', 'WARRANTY ELR', 'WARRANTY HOURS', 'WARRANTY DISCOUNT',
//     'INTERNAL GROSS', 'INTERNAL GP%', 'INTERNAL ELR', 'INTERNAL HOURS', 'INTERNAL DISCOUNT',
//     'COUNTER RETAIL GROSS', 'COUNTER RETAIL GP%', 'COUNTER RETAIL ELR', 'COUNTER RETAIL HOURS', 'COUNTER RETAIL DISCOUNT',
//     'WHOLESALE GROSS', 'WHOLESALE GP%', 'WHOLESALE ELR', 'WHOLESALE HOURS', 'WHOLESALE DISCOUNT'
//   ];

//   const headerRow = worksheet.addRow(headers);

//   headerRow.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFF' } };
//   headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

//   // HEADER COLOR (NO BORDERS)
//   headerRow.eachCell((cell: { fill: { type: string; pattern: string; fgColor: { argb: string; }; }; }) => {
//     cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2A91F0' } };
//   });

//   // ----------- ROW STRIPES COLORS ----------
//   const EVEN_ROW_COLOR = 'F7F9FC'; // light gray
//   const ODD_ROW_COLOR = 'FFFFFF';  // white

//   // ----------- DATA ROWS -----------
// data.forEach((d, index) => {
//   const row = worksheet.addRow([
//     d.ODate ? this.datepipe.transform(d.ODate, 'MM.dd.yyyy') : '',
//     d.Customername || '',
//     d.InvoiceNumber || '',
//     d.Age || '',
//     d.Partnumber || '',
//     d.RONumber || '',
//     d.Description || '-',
//     d.Total_Gross ? `$${d.Total_Gross.toFixed(2)}` : '',    // 💵 Dollar for Gross
//     d.Total_Sale || '',                                      // Sale stays as is
//     d.Total_ELR ? `$${d.Total_ELR.toFixed(2)}` : '',        // 💵 Dollar for ELR
//     d.Total_Hours || '',
//     d.Total_Discount || '',
//     d.Cust_Gross ? `$${d.Cust_Gross.toFixed(2)}` : '',      // 💵 Dollar for Gross
//     d.Cust_Sale || '',
//     d.Cust_ELR ? `$${d.Cust_ELR.toFixed(2)}` : '',          // 💵 Dollar for ELR
//     d.Cust_Hours || '',
//     d.Cust_Discount || '',
//     d.Warranty_Gross ? `$${d.Warranty_Gross.toFixed(2)}` : '', // 💵 Dollar for Gross
//     d.Warranty_Sale || '',
//     d.Warranty_Retention || '',
//     d.Warranty_Hours || '',
//     d.Warranty_Discount || '',
//     d.Internal_Gross ? `$${d.Internal_Gross.toFixed(2)}` : '', // 💵 Dollar for Gross
//     d.Internal_Sale || '',
//     d.Internal_Retention || '',
//     d.Internal_Hours || '',
//     d.Internal_Discount || '',
//     d.Counter_Gross ? `$${d.Counter_Gross.toFixed(2)}` : '', // 💵 Dollar for Gross
//     d.Counter_sale || '',
//     d.Counter_Retention || '',
//     d.Counter_Hours || '',
//     d.Counter_Discount || '',
//     d.Wholesale_Gross ? `$${d.Wholesale_Gross.toFixed(2)}` : '', // 💵 Dollar for Gross
//     d.Wholesale_Sale || '',
//     d.Wholesale_Retention || '',
//     d.Wholesale_Hours || '',
//     d.Wholesale_Discount || ''
//   ]);

//   // STRIPED BACKGROUND
//   row.eachCell((cell: { fill: { type: string; pattern: string; fgColor: { argb: string; }; }; alignment: { vertical: string; horizontal: string; }; }, colNumber: any) => {
//     cell.fill = {
//       type: "pattern",
//       pattern: "solid",
//       fgColor: { argb: (index % 2 === 0 ? EVEN_ROW_COLOR : ODD_ROW_COLOR) }
//     };

//     cell.alignment = { vertical: "middle", horizontal: "center" };
//   });

//   row.font = { name: "Arial", size: 8 };
//     row.alignment = { vertical: "middle", horizontal: "center" };
//   });

//   // ----------- COLUMN WIDTH ----------
//   worksheet.columns.forEach((col: { width: number; }, idx: number) => {
//     col.width = idx % 2 === 0 ? 15 : 20;
//   });

//   // ----------- SAVE FILE -----------
//   workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
//     const blob = new Blob([buffer], {
//       type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     });
//     FileSaver.saveAs(blob, "PartsOpenRODetails.xlsx");
//     this.spinner.hide();
//   });
}




  // ----------------------------------------------
  // OPEN RO MODAL
  // ----------------------------------------------
  viewRO(roData: any) {
    // console.log(roData);
    
    // // Emit to parent if needed
    // // this.viewROEvent.emit(roData);   // ✅ useful for parent grid

    // const modalRef = this.modal.open(Repair, {
    //   size: 'lg',
    //   windowClass: 'roModal'
    // });

    // modalRef.componentInstance.data = {
    //   ro: roData.RONumber,
    //   storeid: roData.StoreID,
    //   vin: roData.vin,
    //   vehicleid: roData.vehicleid,
    //   custno: roData.customernumber 
    // };
    // modalRef.result.then((result: any) => {
    //   console.log(result); // Handle modal close result
    // }, (reason: any) => {
    //   console.log(`Dismissed: ${reason}`); // Handle dismiss reason
    // });
     
  }
}
