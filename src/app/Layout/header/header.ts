import { Component, ElementRef, EventEmitter, inject, Output, PLATFORM_ID, Renderer2, ViewChild } from '@angular/core';
import { Sharedservice } from '../../Core/Providers/Shared/sharedservice';
import { Setdates } from '../../Core/Providers/SetDates/setdates';
import { ActivatedRoute, Router, NavigationStart, RouterModule, } from '@angular/router';
import { decode } from 'js-base64';
import { isPlatformBrowser } from '@angular/common';
import { SharedModule } from '../../Core/Providers/Shared/shared.module';
import { UserNetworkService } from '../../Core/Providers/Shared/global.services';


import { environment, UserInfo } from '../../../environments/environment';
import { NgFor, NgIf } from '@angular/common';
import { NgStyle, NgClass, NgForOf } from '@angular/common';
Api
ToastService
import { HttpClient } from '@angular/common/http';
NotificationService
import { RivIcon } from '../..//Core/Providers/Shared/riv-icon/riv-icon';
import { Api } from '../../Core/Providers/Api/api';
import { ToastService } from '../../Core/Providers/Shared/toast.service';
import { NotificationService } from '../../Core/Providers/Shared/notification.service';

import { AuthServices } from '../../Core/Providers/Shared/auth.service 1';
import { common } from '../../common';
import { Subscription } from 'rxjs';

declare var bootstrap: any;
@Component({
  selector: 'app-header',
  imports: [SharedModule, RivIcon, NgIf, RouterModule],
  standalone: true,
  templateUrl: './header.html',
  styleUrl: './header.scss'
})


export class Header {
  @Output() ready = new EventEmitter<void>();

  componentData: any;
  userInfo: any;
  hasUnread = false;
  matched = false;
  loading = false;
  selectedGroup: string | null = null;

  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly shared = inject(Sharedservice);
  public readonly userNetworkInfo = inject(UserNetworkService);
  public readonly notificationService = inject(NotificationService);

  private readonly KeyWords = ['Prasad', 'Chavali', 'Pchavali'];

  private processingToken = false; // ✅ Prevent premature logout
  private sub!: Subscription;
  userData: any;

  constructor() {
    this.shared.api.GetHeaderData().subscribe((res: any) => {
      console.log(res);

      this.componentData = res.obj;
      this.shared.common.pageName = this.componentData.title
      console.log(this.shared.common.pageName, 'Page Name.................');

    });
  }
  widgetStores: any = ''
  ngOnInit(): void {
    history.pushState(null, '', location.href);
    window.onpopstate = () => {
      history.pushState(null, '', location.href);
    };
    this.sub = this.shared.api.userToken$
      .subscribe(data => {
        if (data) {
          this.userData = data;
        }
      });

    const match = window.location.href.match(/[?&]token=([^&#]+)/i);
    if (match) {
      console.log(match);
      const loadingTkn = match?.[1] ? decodeURIComponent(match[1]) : null!;
      const cleared = loadingTkn?.replaceAll('%253D', '%3D');
      localStorage.setItem('finalUser', cleared!)
      const urltoken = match?.[1] ? decodeURIComponent(match[1]) : null!;
      // const cleared = urltoken?.split('%')[0];
      console.log(cleared, '..................');
      // store
      const decoded = JSON.parse(atob(urltoken));
      localStorage.setItem('stime', decoded.Type ? decoded.Type : 'MTD')
      this.userInfo = JSON.parse(localStorage.getItem('userInfo')!)
      localStorage.setItem('flag', decoded.flag)
      localStorage.setItem('flag2', decoded.flag2)
      this.widgetStores = decoded.store


      console.log(decoded, '................ Decoded');
      // localStorage.setItem('userInfo', JSON.stringify(decoded))
    } else {
      console.log(match, 'Match..........................');
      localStorage.setItem('stime', 'MTD')
      localStorage.setItem('flag', 'M')

      // console.log(JSON.parse(localStorage.getItem('userInfo')!), '..................... Without token')
    }
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      this.userInfo = JSON.parse(storedUserInfo);
      this.userInfo.user_Info.widgetStores = this.widgetStores;
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo))

      // ✅ Clean up token in URL
      let cleanUrl = window.location.href;
      cleanUrl = cleanUrl.replace(/[?&]token=[^&#]*/g, '').replace(/[?&]$/, '');

      if (cleanUrl.includes('#')) {
        const [base, hash] = cleanUrl.split('#');
        let cleanHash = hash.replace(/[?&]token=[^&#]*/g, '').replace(/[?&]$/, '');
        cleanUrl = base + (cleanHash ? `#${cleanHash}` : '');
      }

      console.log('🧹 Cleaning token from URL:', cleanUrl);
      window.history.replaceState({}, document.title, cleanUrl);
      this.getGruopsandStores()
      this.afterUserLoad();
      this.ready.emit();

      return;
    }

    const token = this.getTokenFromUrl();

    if (token) {
      this.processingToken = true;
      this.processToken(token);
      setTimeout(() => {
        this.processingToken = false;
        this.ready.emit();
      }, 800);
      return;
    }

    this.checkUserInfo();

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart && !this.processingToken) {
        this.checkUserInfo();
      }
    });



  }
  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
  /** ✅ Extract token from URL if exists */
  private getTokenFromUrl(): string | null {
    //debuger;
    try {
      const match = window.location.href.match(/[?&]token=([^&#]+)/i);
      return match?.[1] ? decodeURIComponent(match[1]) : null;
    } catch (err) {
      console.error('Error extracting token from URL:', err);
      return null;
    }
  }

  /** ✅ Decode token, store user info, and remove token from URL */
  private processToken(token: string): void {
    console.log('🧩 Processing token...');
    const localToken = localStorage.getItem('Login_token');
    if (!localToken) localStorage.setItem('Login_token', token);

    const decoded = JSON.parse(atob(token));
    localStorage.removeItem('userInfo')
    localStorage.setItem('userInfo', JSON.stringify(decoded));

    try {
      const decoded = JSON.parse(atob(token));
      localStorage.removeItem('userInfo')
      localStorage.setItem('userInfo', JSON.stringify(decoded));
      this.userInfo = decoded;
      this.afterUserLoad();

      // ✅ Clean up token in URL
      let cleanUrl = window.location.href;
      cleanUrl = cleanUrl.replace(/[?&]token=[^&#]*/g, '').replace(/[?&]$/, '');

      if (cleanUrl.includes('#')) {
        const [base, hash] = cleanUrl.split('#');
        let cleanHash = hash.replace(/[?&]token=[^&#]*/g, '').replace(/[?&]$/, '');
        cleanUrl = base + (cleanHash ? `#${cleanHash}` : '');
      }

      console.log('🧹 Cleaning token from URL:', cleanUrl);
      window.history.replaceState({}, document.title, cleanUrl);
    } catch (e) {
      console.error('Invalid base64 token:', e);
    }
  }

  /** ✅ After user info available */
  private afterUserLoad(): void {
    console.log('User Info Header:', this.userInfo);
    this.evaluateUserMatch();
    this.loadHeaderData();
    this.editenable()
  }

  /** ✅ Keyword match */
  private evaluateUserMatch(): void {
    const info = this.userInfo?.user_Info || {};
    const fullName = (this.userInfo?.fullName || '').toLowerCase();
    const first = (info?.firstname || '').toLowerCase();
    const last = (info?.lastname || '').toLowerCase();

    this.matched = this.KeyWords.some(
      (k) =>
        fullName.includes(k.toLowerCase()) ||
        first.includes(k.toLowerCase()) ||
        last.includes(k.toLowerCase())
    );
  }

  /** ✅ Fetch header data */
  private loadHeaderData(): void {
    this.shared.api.GetHeaderData().subscribe((res: any) => (this.componentData = res.obj));
  }

  /** ✅ Validate stored user info */
  private checkUserInfo(): void {
    console.log('🕵️ checkUserInfo called — processingToken:', this.processingToken);
    if (this.processingToken) return; // 🚫 Skip if token still being processed

    const stored = localStorage.getItem('userInfo');
    const site = this.userInfo?.site;
    let user: any = null;

    if (stored) {
      try {
        user = JSON.parse(stored);
      } catch {
        user = null;
      }
    }

    if (!user || !Object.keys(user).length) {
      console.warn('No valid user info — redirecting to axelone');
      const redirectUrl =
        site === 'demo'
          ? 'https://demo.axelone.app?logout=true'
          : site === 'dev'
            ? 'http://dev.axelone.app?logout=true'
            : 'https://axelone.app/?logout=true';
      window.location.href = redirectUrl;
    }

    this.getNotificationCount();
  }

  /** ✅ Notifications */
  private getNotificationCount(): void {
    this.notificationService.unreadCount$.subscribe((count) => (this.hasUnread = count > 0));
  }

  onNotificationIconClick(): void {
    this.notificationService.triggerFetch();
    this.toast.show('Notifications will be implemented soon', 'success', 'Coming Soon');
  }

  /** ✅ Settings navigation */
  onSettingsClick(): void {
    this.shared.api.headermenu(`${this.userInfo.user_Info.roleid}`).subscribe({
      next: (data: any) => {
        const settings = data?.response?.find(
          (m: any) => m.mod_name === 'Settings' || m.mod_name === 'SETTINGS' || m.Mod_ID == 26
        );
        if (!settings) return console.error('SETTINGS module not found');

        try {
          const xmlDataArray = JSON.parse(settings.xmlData);
          const firstItem = xmlDataArray[0];
          if (firstItem) this.gotoLink(firstItem.mod_filename);
        } catch (e) {
          console.error('Error parsing xmlData:', e);
        }
      },
      error: (err) => console.error('API Error:', err),
    });
  }
  gotoLink(url: string): void {
    if (!url) return;

    try {
      const uToken = localStorage.getItem('Login_token') || '';
      const currentHost = window.location.host;
      const isLocal = /localhost|127\.0\.0\.1/.test(currentHost);
      const target = new URL(url, window.location.origin);

      target.searchParams.set('token', uToken);

      if (target.host === currentHost || isLocal) {
        this.router.navigateByUrl(target.pathname + target.search).catch(() => {
          window.location.href = target.href;
        });
      } else {
        const currentBase = currentHost.split('.').slice(-2).join('.');
        const targetBase = target.host.split('.').slice(-2).join('.');
        targetBase === currentBase
          ? (window.location.href = target.href)
          : (window.location.href = target.href);
      }
    } catch (error) {
      console.error('Invalid URL:', error, 'for input:', url);
    }
  }

  // dashbardRoute(): void {
  //   this.router.navigate(['/dashboard']);
  // }

  // logoutSession(): void {

  //   const site = this.userInfo?.site ;
  //   localStorage.clear();
  //   window.location.href =
  //     site === 'demo' ? 'https://demo.axelone.app?logout=true' : 'http://axelone.app?logout=true';
  // }

  logoutSession(): void {
    const site = this.userInfo?.site;
    localStorage.clear();
    sessionStorage.clear();
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', () => {
      history.pushState(null, '', location.href);
    });
    const target =
      site === 'demo' ? 'https://demo.axelone.app?logout=true' : 'https://axelone.app?logout=true';
    window.location.replace(target); // THIS prevents going back
  }

  onNetworkClick() {
    if (this.userNetworkInfo?.networkStatus) {
      this.toast.show('You are already connected to the office network.', 'success', 'Connected');
    } else {
      this.toast.show('Please connect to the office network.', 'warning', 'Not Connected');
    }
  }
  editdata: any = false
  editenable() {
    if (this.userInfo?.user_Info?.roleid === 100) {
      this.editdata = true

    }

  }

  dashbardRoute() {
    window.location.href = 'https://western.axelone.app/'
    // this.router.navigate(['https://western.axelone.app/']);
  }
  onExcelClick() {

    const Data = {
      title: this.componentData.title,
      state: true,
    };
    this.shared.api.setExportToExcelAllReports({ obj: Data });

  }

  groupsandstoresdata: any = []
  getGruopsandStores() {
    this.shared.common.completeUserDetails = this.userInfo
    // alert('HI')
    const obj = {
      "userid": JSON.parse(localStorage.getItem('userInfo')!).user_Info.userid,
      // "userid": 44,
    }
    this.shared.api.postmethod(this.shared.common.routeEndpoint + 'GetStoresList', obj)
      .subscribe((res) => {
        if (res.status == 200) {
          this.shared.common.allstores = res.response
          let data = res.response
          // .filter((val: any) => val.sg_id != 7)
          this.groupsandstoresdata = data.reduce((r: any, { sg_name, sg_id }: any) => {
            if (!r.some((o: any) => o.sg_name == sg_name)) {
              r.push({
                sg_name,
                sg_id,
                Stores: data.filter((v: any) => v.sg_name == sg_name),
              });
            }
            return r;
          }, []);
          console.log(this);
          // .filter((val:any)=>{ val.sg_name != 'Other Stores' })
          this.shared.common.groupsandstores = this.groupsandstoresdata.filter((val: any) => val.sg_name != 'OtherStores')
          this.shared.common.OtherStoresData = this.groupsandstoresdata.filter((val: any) => val.sg_name == 'OtherStores')
          // .filter((val:any)=>{ val.sg_name == 'Other Stores' })
          const obj = {
            storesData: this.shared.common.groupsandstores,
            otherStoresData: this.shared.common.OtherStoresData
          };
          this.shared.api.setStores({ obj: obj });
        }
      })
  }
}


