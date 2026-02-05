import { Component, ElementRef, EventEmitter, Output, Renderer2, ViewChild, signal } from '@angular/core';
import { SidebarService } from '../../Core/Providers/Shared/sidebar.service (1)';
import { environment } from '../../../environments/environment';
import { common } from '../../common';
import { Api } from '../../Core/Providers/Api/api';
import { Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { NgStyle, NgClass, NgForOf } from '@angular/common';
Api

import { HttpClient } from '@angular/common/http';
// import { ToastService } from '../../core/services/toast.service';

import { RivIcon } from '../..//Core/Providers/Shared/riv-icon/riv-icon';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserNetworkService } from '../../Core/Providers/Shared/global.services';
@Component({
  selector: 'app-externalmenu',
  imports: [NgFor, NgIf, NgStyle, NgClass, NgForOf, NgIf],
  templateUrl: './externalmenu.html',
  styleUrl: './externalmenu.scss'
})
export class Externalmenu {

  submenu3: any
  Report = false;
  // AxelOne = false;
  // receive=false;
  submenu2 = false;
  @ViewChild('menu') menu: ElementRef | undefined;
  @ViewChild('sidebar') sidebar: ElementRef | undefined;
  uname: any = '';
  userObj: any = '';
  subid: any = 0
  supersub: any = 0;
  activeid: any = 0;
  modules: any = [];
  mtd: any = 0;
  isSidebarCollapsed: any = false;


  allowedReports: string[] = ['Inventory Summary', 'Sales Gross', 'CIT/Heat'];

  isReportAllowed(subitem1: any): boolean {
    return this.allowedReports.includes(subitem1.mod_name);
  }
  openExternalLink(url: string): void {
    if (url) {
      window.open(url, '_blank'); // Opens in a new tab
    }
  }

  selectedSubmenuId: any = 0;


  toggleReport(id: any): void {
    this.supersub = 0;

    if (this.subid === id) {
      this.subid = 0;
      this.prodid = 0;
      this.activeid = 0;
      this.selectedSubmenuId = 0; // reset highlight
      return;
    }

    this.subid = id;
    this.prodid = id;

    if (id !== 6) {
      const selectedModule = this.modules.find(
        (item: any) => item[0].mod_prod_id === id
      );

      if (selectedModule) {
        this.supersub = selectedModule[0].Mod_ID;
        this.activeid = selectedModule[0].Mod_ID;

        // ✅ Auto-select first submenu (other than header)
        const firstSub = selectedModule.find(
          (sub: any) => sub.Mod_ID && sub.mod_name !== selectedModule[0].prod_title
        );
        if (firstSub) {
          this.selectedSubmenuId = firstSub.Mod_ID;
        } else {
          this.selectedSubmenuId = 0; // fallback
        }
      }

      console.log('select module', selectedModule)
    }
  }


  prodid: any = 0

  togglesubmenu2(event: any, id: any, prodid: any) {
    event.stopPropagation();
    this.prodid = prodid;
    this.supersub = id;
    this.submenu2 = true;
    this.activeid = id;
    this.selectedSubmenuId = id;
    var elems = document.querySelectorAll("li");
    [].forEach.call(elems, function (el: any) {
      el.className = el.className.replace(/\bactive\b/, "");
    });

    this.renderer.addClass(event.target, "active");
  }

  close() {
    var elems = document.querySelectorAll("li");

    this.submenu2 = false;
    this.supersub = 0;
  }
  isCollapsed = false;


  @Output() collapseChanged = new EventEmitter<boolean>();
  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    this.sidebarService.toggle();
    this.collapseChanged.emit(this.isSidebarCollapsed);
    this.subid = 0;
    this.supersub = 0;
    this.toggleMainMenuclose();
    this.toggleSubMenuclose();
  }

  onSubClick(event: Event, sub: any, moduleItem: any) {
    event.stopPropagation();

    // if sub.mod_name equals the module/product title -> do not open submenu2
    if (this.isEqualIgnoreCase(sub?.mod_name, moduleItem?.prod_title)) {
      return;
    }

    // otherwise open submenu2
    this.togglesubmenu2(event, sub.Mod_ID, sub.mod_prod_id);
  }



  public userInfo: any;
  public userAuthData: any
  constructor(public renderer: Renderer2,
    public apiService: Api,
    private router: Router,
    public comm: common,
    private ngbmodal: NgbModal,
    private eRef: ElementRef,
    private userNetworkInfo: UserNetworkService,
    private sidebarService: SidebarService,
    public http: HttpClient
    //private helpmodalservice: HelpmodalService
  ) {
    this.subid = 0;
    this.supersub = 0;
    this.apiService.changehead(true);
    this.uname = localStorage.getItem('AO_uname');
    let user: any = localStorage.getItem("userobj");
    this.userObj = JSON.parse(user);

    const userinfo: any = localStorage.getItem('userInfo');
    const userInfo: any = JSON.parse(userinfo);
    this.userInfo = userInfo;

    this.getheadermenu();

    // 👇 Add click listener
    this.renderer.listen('document', 'click', (event: Event) => {
      this.handleClickOutside(event);
    });

    // var url = environment.apiUrl
    // this.apiService.getsessionid(this.userInfo.user_aou_AD_userid, url + '/UserIdAuthentication').subscribe(
    //   (data: any) => {
    //     this.userAuthData = data;
    //   });
  }

  handleClickOutside(event: Event) {
    const targetElement = event.target as HTMLElement;

    const clickedInsideMenu = this.menu?.nativeElement.contains(targetElement);
    const clickedInsideSidebar = this.sidebar?.nativeElement.contains(targetElement);

    if (!clickedInsideMenu && !clickedInsideSidebar) {
      this.closemenu(); // 👈 close both menus
      this.toggleMainMenuclose();
      this.toggleSubMenuclose();
    }
  }

  gotoLink(url: string) {
    // alert(url)
    if (!url) return;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (window.location.href.includes('http://localhost')) {
        if (url.indexOf(this.comm.menuUrl) >= 0) {
          let endpoint = url.replace(this.comm.menuUrl, '');
          this.router.navigate([endpoint]);
        }
      }
      else {
       window.location.href = url
      }
    }
    else if (url === 'stoprunningreports' || url === 'Integrations' || url === 'AvailableReports') {
      window.open('https://western.axelone.app/'+url, '_blank');
    }
    else if (url != 'stoprunningreports' && url != 'Integrations' && url != 'AvailableReports') {

      window.location.href = 'https://western.axelone.app/' + url;
    }
    else {
      this.router.navigate([url]);
    }

    this.closemenu();
  }

  playbookmainmenu: any
  playbooksmenu: any;
  playbookselectedModule: boolean = false;
  getplaybooksdata() {
    let obj = {
      roleid: this.userInfo?.user_Info?.roleid
    };

    this.http.post('https://dev2api.axelautomotive.com/api/playbooks/GetPlaybooksMenu', obj)
      .subscribe((res: any) => {
        if (res.status === 200) {
          this.playbookmainmenu = res.response.map((freq: any) => {
            let modules = [];
            try {
              modules = JSON.parse(freq.Module_List || '[]');
            } catch (e) {
              console.error('Module_List parse error', e);
            }

            return {
              key: freq.FREQUENCY,
              label: freq.FreqName, // Daily / Weekly / Monthly
              items: [
                {
                  name: freq.FreqName,
                  Module_List: modules,
                  isSelected: false,
                  count: modules.length
                }
              ],
              isSelected: false
            };
          });
        }
      });
  }

  getLabel(key: string): string {
    const map: any = {
      D: 'Daily',
      W: 'Weekly',
      M: 'Monthly'
    };
    return map[key] || key;
  }

  toggleMainMenuclose(): void {
    this.playbookmainmenu.forEach((i: any) => {
      i.isSelected = false;
    });
  }

  toggleSubMenuclose(): void {
    this.playbooksmenu?.forEach((i: any) => i.isSelected = false);
  }

  gotoLinkPlaybooks(url: any) {
    this.toggleMainMenuclose();
    this.toggleSubMenuclose();
    if (!url) return;

    try {
      const raw = localStorage.getItem('userInfo');

      let uToken = '';

      if (raw) {
        try {
          uToken = btoa(unescape(encodeURIComponent(raw)));
        } catch (e) {
          console.error('Base64 encode failed', e);
        }
      }

      const currentOrigin = window.location.origin;

      const [baseUrl, hashPart] = url.split('#');
      const hasHash = !!hashPart;
      const target =
        baseUrl.startsWith('http://') || baseUrl.startsWith('https://')
          ? new URL(baseUrl)
          : new URL(baseUrl, currentOrigin);

      target.searchParams.set('token', uToken);

      let finalUrl = target.toString();
      if (hasHash) finalUrl += `#${hashPart}`;

      window.open(finalUrl, '_blank');
    }
    catch (error) {
      console.error('❌ Invalid URL:', error, 'for input:', url);
    }
  }
  groupedData: any = {};

  groupDataByFrequency(data: any) {
    const result = data.reduce((acc: any, item: any) => {
      const key = item.FREQUENCY2;
      if (!acc[key]) {
        acc[key] = [];
      }
      if (item.MOdules) {
        try {
          item.MOdules = JSON.parse(item.MOdules);
        } catch (e) {
          console.error("JSON Parse Error:", e);
          item.MOdules = [];
        }
      }
      acc[key].push(item);
      return acc;
    }, {});
    this.groupedData = result;
    return result;
  }


  toggleMainMenu(menu: any) {
    if (menu.isSelected) {
      menu.isSelected = false;
      this.playbooksmenu = [];
      return;
    }

    this.playbookmainmenu.forEach((m: any) => (m.isSelected = false));

    menu.isSelected = true;
    this.playbooksmenu = menu.items || [];

    if (this.playbooksmenu.length) {
      this.playbooksmenu.forEach((s: any) => (s.isSelected = false));
      this.playbooksmenu[0].isSelected = true;
    }

    this.closemenu();
    this.closesub()
  }


  togglepbSubMenu(sub: any) {
    this.playbooksmenu.forEach((s: any) => {
      if (s !== sub) s.isSelected = false;
    });

    sub.isSelected = !sub.isSelected;
  }


  getselectedTitle() {
    const selected = this.playbookmainmenu?.find((m: any) => m.isSelected);
    return selected ? selected.label : '';
  }

  isAnyMenuSelected() {
    return this.playbookmainmenu?.some((m: any) => m.isSelected);
  }

  isAnySubMenuSelected() {
    return this.playbooksmenu?.some((m: any) => m.isSelected);
  }

  menuLoading = true;

  getheadermenu() {
    this.modules = [];
    this.apiService.headermenu(this.userInfo?.user_Info.roleid).subscribe((data: any) => {
      console.log('Get Header Menu  : ', data)
      let obj = (data != '' && data != undefined) ? this.groupArrayOfObjects(data.response, 'mod_prod_id') : [];
      if (obj != '') {
        let map = Object.values(obj).forEach((e: any) => {
          if (e.length > 0) {
            let mapped = e.map((ev: any) => {
              let ob = {
                Mod_ID: ev.Mod_ID,
                mod_name: ev.mod_name,
                mod_prod_id: ev.mod_prod_id,
                prod_title: ev.prod_title,
                xmlData: this.extractData(ev.xmlData),
                //   count:this.extractDatacnt(ev.xmlData)
              }
              return ob;
            })
            // console.log(mapped,'l');
            this.modules.push(mapped)

          }
        })
      }
      console.log(this.modules);
      this.menuLoading = false;
      this.getplaybooksdata();
      localStorage.setItem('modulename', JSON.stringify(this.modules));

    }, (err: any) => {
      this.menuLoading = false;
      this.modules = [];
    });

  }

  groupArrayOfObjects(list: any, key: any) {

    return list.reduce(function (rv: any, x: any) {

      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;

    }, {});
  };

  extractData(str: any) {

    str = str.replace('"[', '[');
    str = str.replace(']"', ']');
    let Json = JSON.parse(str);
    //console.log(Json);
    return Json;
  }

  extractDatacnt(str: any) {

    str = str.replace('"[', '[');
    str = str.replace(']"', ']');
    let Json = JSON.parse(str);
    console.log('cnt' + Json.count());
    console.log('len' + Json.length);
    return Json.count();

  }

  ngOnInit() {
    this.isSidebarCollapsed = !!localStorage.getItem('sidebarCollapsed');
  }

  ngAfterViewInit(): void {
    this.isSidebarCollapsed = this.sidebarService.getCollapsed();
  }


  closesub() {
    this.submenu2 = false;
  }


  closemenu() {
    this.subid = 0
    this.supersub = 0;
  }

  hasDuplicate(item: any[]): boolean {
    if (!item || item.length === 0) return false;

    const duplicate = item.some(sub => sub.mod_name === item[0].prod_title);
    if (duplicate) {
      this.submenu3 = item;   // 👉 store the duplicate group in submenu2
    }
    return duplicate;
  }




  navtolink(link: any, mainMod: any) {
    console.log('Nav To link 1: ', mainMod);
    console.log('Nav To link 2: ', link);
    //this.userObj.ADuserid = 100;
    if (link.mod_filename.indexOf('http') > -1) {

      if (link.mod_filename != '') {
        if (mainMod != "") {

          var url = environment.apiUrl
          if (!mainMod[0].prod_title.includes("Utilities")) {
            //alert(1);

            let role = (link.Mod_ParentId == 37) ? this.userObj.Tracs : (link.Mod_ParentId == 9) ? this.userObj.Xtract : (link.Mod_ParentId == 5) ? this.userObj?.Touch : 1;
            let token =
            {
              "userid": this.userInfo.user_aou_AD_userid,
              "role": this.userInfo.user_Info.roleid,
              "session": this.userAuthData?.response,
              "store": this.userInfo.user_Info.ustores,
              "flag": "M",
              "groupid": (localStorage.getItem('grpId') != '' && localStorage.getItem('grpId') != null) ? localStorage.getItem('grpId') : "1",
            }

            var tkn = btoa(JSON.stringify(token));

            console.log('Url : ', link.mod_filename + '?token=' + tkn);

            if (this.userInfo.group == 'WESTERN') {
              url = link.mod_filename.replace(/\\/g, "/");

              // Split by "/" and filter out empty parts
              let parts = url.split("/").filter(p => p.length > 0);

              // Get last part
              let lastPart = parts[parts.length - 1];

              window.open('https://westernxtract.axelone.app/' + lastPart, "_blank");

            } else {
              window.open(link.mod_filename + '?token=' + tkn, "_blank");
            }


            this.close();


          } else {
            this.apiService.getsessionid(this.userInfo.user_aou_AD_userid, url).subscribe(
              (data: any) => {
                let role = (link.Mod_ParentId == 37) ? this.userObj.Tracs : (link.Mod_ParentId == 9) ? this.userObj.Xtract : (link.Mod_ParentId == 5) ? this.userObj.Touch : 1;
                let token = {
                  "userid": 'prasad.chavali@axelautomotive.com',
                  "role": 100,
                  "session": data.response,
                  "store": '3,4,5,2,8,6,9,10',
                  "flag": "M",
                  //"other_stores":this.userObj.oth_stores,
                  "Type": (this.mtd == 0) ? "MTD" : "LM",
                  'source': 'Z'
                }
                var tkn = btoa(JSON.stringify(token));
                //  console.log('decript'+atob(tkn));
                //  console.log("toke:"+tkn)
                //  link=link.replace('dev','demo');
                // this.userActivityAction(link.mod_id)
                window.open(link.mod_filename + '?token=' + tkn, "_blank");
              })

          }

        } else {
          window.open(link.mod_filename, "_blank");
        }

      }

      else {

      }

    } else {
      //  // this.router.navigate(['/' + link.mod_filename + '']);
      if (link.mod_filename === "Support") {
        //this.helpmodalservice.triggerModal();
        this.router.navigateByUrl('/dashboard', { skipLocationChange: true });
      } else {
        this.router.navigate(['/' + link.mod_filename + '']);
      }
      this.close()
    }
  }

  navtolinkv2(typ: any, module: any) {
    let token =
    {
      "userid": this.userInfo.user_aou_AD_userid,
      "role": this.userInfo.user_Info.roleid,
      "session": this.userAuthData?.response,
      "store": this.userInfo.user_Info.ustores,
      "flag": "M",
      "groupid": (localStorage.getItem('grpId') != '' && localStorage.getItem('grpId') != null) ? localStorage.getItem('grpId') : "1",
    }

    var tkn = btoa(JSON.stringify(token));

    console.log('Url : ', module + '?token=' + tkn);
    window.open(module + '?token=' + tkn, "_self");
  }
  isEqualIgnoreCase(a: string | any, b: string | any): boolean {
    if (a === null || a === undefined || b === null || b === undefined) return false;
    return a.toString().trim().toLowerCase() === b.toString().trim().toLowerCase();
  }
  hasValidSubmenuForItem(modules: any[], supersub: number): boolean {
    for (let item of modules) {
      for (let sub of item) {
        if (sub.Mod_ID === supersub && !this.isEqualIgnoreCase(sub.mod_name, item[0].prod_title)) {
          return true;
        }
      }
    }
    return false;
  }

  handleClick(item: any[]) {

    this.toggleMainMenuclose();
    this.toggleSubMenuclose();


    if (this.userNetworkInfo.networkStatus == false && item[0].mod_prod_id != '7') {
      alert('Please connect to the dealer network or VPN to access more information. Once connected, kindly refresh the page.')
      return;
    }

    const first = item[0];
    const second = item[1];

    // Case 1: Dashboard
    if (first?.prod_title?.toLowerCase() === 'dashboard') {
      this.toggleMainMenuclose();
      this.toggleSubMenuclose();
      this.closemenu();
      this.closesub();
      window.location.href = 'https://western.axelone.app/';
      // this.router.navigate(['/dashboard']);
      return;
    }

    // Case 2: Ask Axel
    if (first?.prod_title?.toLowerCase() === 'ask axel') {
      this.navigateToUrl(second?.mod_url);
      return;
    }

    // if (first?.prod_title?.toLowerCase() === 'customers' && this.userInfo.group === 'MOSSY') {
    //   const ut = JSON.stringify(this.userInfo);
    //   const uToken = btoa(ut);
    //   window.location.href = `https://mossy.axelone.app/cc?token=${uToken}`;
    //   return;
    // }

    // Case 3: If filename is an external link
    if (first?.mod_filename && first.mod_filename.toLowerCase().startsWith('https')) {
      this.router.navigate(['/']); return;
    }

    // Case 4: Normal behavior
    if (first?.mod_prod_id === 2) {
      this.router.navigate(['/']);
    } else {
      this.toggleReport(first.mod_prod_id);
    }
  }


  navigateToUrl(query: string) {
    const baseUrl = localStorage.getItem('webToken') || '';
    const encodedQuery = encodeURIComponent(query);
    const fullUrl = `${baseUrl}&role=${this.userInfo?.user_Info?.roleid}&group=${this.userInfo.group}`;
    window.open(fullUrl, '_blank');
  }



}