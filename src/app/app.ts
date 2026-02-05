import { Component, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Header } from './Layout/header/header';
import { Externalmenu } from './Layout/externalmenu/externalmenu'
import { CommonModule } from '@angular/common';
import { SidebarService } from '../app/Core/Providers/Shared/sidebar.service (1)';
import { UserActivityService } from './Core/Providers/Api/user-activity-service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, Header, Externalmenu],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
  isHeaderReady = false;
  isSidebarCollapsed = false;
  menuCommand: any | null = null;
  isCollapsed = false;
  isDashboardRoute = false;
  protected readonly title = signal('WesternAuto');
  constructor(private sidebarService: SidebarService, public router: Router,private activityService: UserActivityService) { }
  ngOnInit() {
    this.activityService.startRouteTracking();
    this.sidebarService.isCollapsed$.subscribe((collapsed) => {
      this.isSidebarCollapsed = collapsed;
    });
    this.isCollapsed = !!localStorage.getItem('sidebarCollapsed');
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isDashboardRoute = event.urlAfterRedirects.includes('/dashboard');
      }
    });
  }

  onHeaderReady(): void {
    this.isHeaderReady = true;
    console.log('Dashboard received Header ready event');
  }
  ngAfterViewInit(): void {
    this.isCollapsed = this.sidebarService.getCollapsed();
  }
  onExternalMenuAction(dt: any) {
    console.log('Received from externalmenu:', dt);
    this.menuCommand = dt;
    setTimeout(() => {
      this.menuCommand = null;
    });
  }

  onCollapseChanged(value: boolean) {
    this.isCollapsed = value;
  }
}
