import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'Header', loadComponent: () => import('./Layout/header/header').then(m => m.Header) },
  // ACCOUNTING BLOCK
  { path: 'AccountMapping', loadComponent: () => import('./Reports/Accounting/AccountMapping/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'FinancialStatement', loadComponent: () => import('./Reports/Accounting/FinancialStatement/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'FinancialSummary', loadComponent: () => import('./Reports/Accounting/FinancialSummary/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'ExpenseTrend', loadComponent: () => import('./Reports/Accounting/ExpenseTrend/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'IncomeStatementTrend', loadComponent: () => import('./Reports/Accounting/IncomeStatementTrend/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'IncomeStatementStoreComposite', loadComponent: () => import('./Reports/Accounting/IncomeStatement/income-statement-store-composite/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'IncomeStatementStore', loadComponent: () => import('./Reports/Accounting/IncomeStatementStoreComposite/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'IncomeStatementStoreV2', loadComponent: () => import('./Reports/Accounting/IncomeStatementStoreCompositeV2/dashboard/dashboard').then(m => m.Dashboard) },
  // { path: 'EnterpriseTracking', loadComponent: () => import('./Reports/Accounting/EnterpriseTracking/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'EnterpriseIncomeByExpense', loadComponent: () => import('./Reports/Accounting/EnterpriseIncomeByExpense/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'FixedIncomeByExpense', loadComponent: () => import('./Reports/Accounting/EnterpriseIncomeByExpense/dashboard/dashboard').then(m => m.Dashboard) },
  // { path: 'VariableIncomeByExpense', loadComponent: () => import('./Reports/Accounting/EnterpriseIncomeByExpense/dashboard/dashboard').then(m => m.Dashboard) },
  // { path: 'EnterpriseIncomeByExpenseTrend', loadComponent: () => import('./Reports/Accounting/EnterpriseIncomeByExpenseTrend/dashboard/dashboard').then(m => m.Dashboard) },


  // SALES BLOCK
  { path: 'SalesGrossOld', loadComponent: () => import('./Reports/Sales/SalesGross/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'SalesGross', loadComponent: () => import('./Reports/Others/SalesGross/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'CarDeals', loadComponent: () => import('./Reports/Sales/CarDeals/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'SalesPersonRanking', loadComponent: () => import('./Reports/Sales/SalesPersonRanking/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'FandIManagerRanking', loadComponent: () => import('./Reports/Sales/FandIManagerRanking/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'InventoryBook', loadComponent: () => import('./Reports/Sales/InventoryBook/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'InventorySummary', loadComponent: () => import('./Reports/Sales/InventorySummary/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'InventorySummaryV2', loadComponent: () => import('./Reports/Others/InventorySummary/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'Appointments', loadComponent: () => import('./Reports/Sales/Appointments/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'VariableGrossGL', loadComponent: () => import('./Reports/Sales/VariableGrossGL/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'QuickInventory', loadComponent: () => import('./Reports/Sales/QuickInventoryReport/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'SalesManagerRanking', loadComponent: () => import('./Reports/Sales/SalesManangerRanking/dashboard/dashboard').then(m => m.Dashboard) },

  // SERVICE BLOCK
  { path: 'ServiceAdvisorRanking', loadComponent: () => import('./Reports/Services/ServiceAdvisorRanking/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'ServiceAppointments', loadComponent: () => import('./Reports/Services/ServiceAppointments/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'ServiceGross', loadComponent: () => import('./Reports/Services/ServiceGross/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'ServiceOpenRO', loadComponent: () => import('./Reports/Services/ServiceOpenRO/dashboard/dashboard').then(m => m.Dashboard) },

  // OTHERS
  { path: 'IncomeBudgetForecast', loadComponent: () => import('./Reports/Others/IncomeBudgetForecast/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'CIT', loadComponent: () => import('./Reports/Others/CITFloorplan/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'CollisionCenter', loadComponent: () => import('./Reports/Others/CollisionCenter/dashboard/dashboard').then(m => m.Dashboard) },

  // parts

  { path: 'PartsAging', loadComponent: () => import('./Reports/Parts/PartsAging/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'PartsGross', loadComponent: () => import('./Reports/Parts/PartsGross/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'PartsOpenRO', loadComponent: () => import('./Reports/Parts/PartsOpenRO/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'PartsCounterPersonRanking', loadComponent: () => import('./Reports/Parts/PartsAdvisorRanking/dashboard/dashboard').then(m => m.Dashboard) },

  { path: 'WashoutReport', loadComponent: () => import('./Reports/mockups/washout-report/washout-report').then(m => m.WashoutReport) },
  { path: 'SalesTax', loadComponent: () => import('./Reports/mockups/salestax/salestax').then(m => m.Salestax) },
  { path: 'VehicleFlooring', loadComponent: () => import('./Reports/mockups/vehicleflooring/vehicleflooring').then(m => m.Vehicleflooring) },

  { path: 'BuyerRankings', loadComponent: () => import('./Reports/mockups/buyerranking/buyerranking').then(m => m.Buyerranking) },
  { path: 'FixedAbsorption', loadComponent: () => import('./Reports/mockups/serviceabsorption/serviceabsorption').then(m => m.Serviceabsorption) },
  { path: 'PackTracker', loadComponent: () => import('./Reports/mockups/packtracker/packtracker').then(m => m.Packtracker) },
  { path: 'FinanceReserveRecon', loadComponent: () => import('./Reports/mockups/finreconciliation/finreconciliation').then(m => m.Finreconciliation) },


  { path: 'BookedDeals', loadComponent: () => import('./Reports/Others/BookedDeals/dashboard/dashboard').then(m => m.Dashboard) },

  { path: 'Liabilities', loadComponent: () => import('./Reports/Others/Payables/dashboard/dashboard').then(m => m.Dashboard) },



  { path: 'TTL', loadComponent: () => import('./Reports/Others/Payables/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'LienPayoffs', loadComponent: () => import('./Reports/Others/Payables/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'WeOwe', loadComponent: () => import('./Reports/Others/Payables/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'NewFlooring', loadComponent: () => import('./Reports/Others/Payables/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'UsedFlooring', loadComponent: () => import('./Reports/Others/Payables/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'RentalFlooring', loadComponent: () => import('./Reports/Others/Payables/dashboard/dashboard').then(m => m.Dashboard) },


  //   {path:'Receivables', loadComponent: () => import('./Reports/Others/Payables/dashboard/dashboard').then(m => m.Dashboard) },


  //   {path:'Receivables', loadComponent: () => import('./Reports/Others/Payables/dashboard/dashboard').then(m => m.Dashboard) },
  // {path:'Receivables', loadComponent: () => import('./Reports/Others/Payables/dashboard/dashboard').then(m => m.Dashboard) },
  // {path:'Receivables', loadComponent: () => import('./Reports/Others/Payables/dashboard/dashboard').then(m => m.Dashboard) },
  // {path:'Receivables', loadComponent: () => import('./Reports/Others/Payables/dashboard/dashboard').then(m => m.Dashboard) },
  // {path:'Receivables', loadComponent: () => import('./Reports/Others/Payables/dashboard/dashboard').then(m => m.Dashboard) },
  // {path:'Receivables', loadComponent: () => import('./Reports/Others/Payables/dashboard/dashboard').then(m => m.Dashboard) },
  // {path:'Receivables', loadComponent: () => import('./Reports/Others/Payables/dashboard/dashboard').then(m => m.Dashboard) },


  { path: 'CarDealsV2', loadComponent: () => import('./Reports/Others/CarDeals/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'CITV2', loadComponent: () => import('./Reports/Services/CITFloorplan/dashboard/dashboard').then(m => m.Dashboard) },



];
