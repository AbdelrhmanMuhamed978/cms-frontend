import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { TranslateModule } from '@ngx-translate/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { PORTAL_PERMISSIONS } from '../../constants/portal-permission.constants';
import { AdminAuthService } from '../../services/admin-auth.service';

export interface AdminSection {
  titleKey: string;
  descriptionKey: string;
  icon: string;
  route: string;
}

/**
 * Static section definitions for the admin home overview grid.
 * Order matches the sidebar tab order in AdminLayoutComponent.
 * Visibility is determined at runtime by the `visibleSections` computed signal.
 */
const ADMIN_SECTIONS: (AdminSection & { visible: (auth: AdminAuthService) => boolean })[] = [
  {
    titleKey: 'ADMIN.HOME.SECTION_PUBLISHERS',
    descriptionKey: 'ADMIN.HOME.SECTION_PUBLISHERS_DESC',
    icon: 'lucideUsers',
    route: '/admin/publishers',
    visible: (auth) => auth.hasPermission(PORTAL_PERMISSIONS.PORTAL_READ_PUBLISHER),
  },
  {
    titleKey: 'ADMIN.HOME.SECTION_TAFSIRS',
    descriptionKey: 'ADMIN.HOME.SECTION_TAFSIRS_DESC',
    icon: 'lucideGraduationCap',
    route: '/admin/tafsirs',
    visible: (auth) => auth.hasPermission(PORTAL_PERMISSIONS.PORTAL_READ_TAFSIR),
  },
  {
    titleKey: 'ADMIN.HOME.SECTION_TRANSLATIONS',
    descriptionKey: 'ADMIN.HOME.SECTION_TRANSLATIONS_DESC',
    icon: 'lucideGlobe',
    route: '/admin/translations',
    visible: (auth) => auth.hasPermission(PORTAL_PERMISSIONS.PORTAL_READ_TRANSLATION),
  },
  {
    titleKey: 'ADMIN.HOME.SECTION_MUSHAFS',
    descriptionKey: 'ADMIN.HOME.SECTION_MUSHAFS_DESC',
    icon: 'lucideBookOpen',
    route: '/admin/mushafs',
    visible: (auth) => auth.hasPermission(PORTAL_PERMISSIONS.PORTAL_READ_MUSHAF),
  },
  {
    titleKey: 'ADMIN.HOME.SECTION_FONTS',
    descriptionKey: 'ADMIN.HOME.SECTION_FONTS_DESC',
    icon: 'lucideType',
    route: '/admin/fonts',
    visible: (auth) => auth.hasPermission(PORTAL_PERMISSIONS.PORTAL_READ_FONT),
  },
  {
    titleKey: 'ADMIN.HOME.SECTION_RECITATIONS',
    descriptionKey: 'ADMIN.HOME.SECTION_RECITATIONS_DESC',
    icon: 'lucideVolume2',
    route: '/admin/recitations',
    visible: (auth) => auth.hasPermission(PORTAL_PERMISSIONS.PORTAL_READ_RECITATION),
  },
  {
    titleKey: 'ADMIN.HOME.SECTION_RECITERS',
    descriptionKey: 'ADMIN.HOME.SECTION_RECITERS_DESC',
    icon: 'lucideMic',
    route: '/admin/reciters',
    visible: (auth) => auth.hasPermission(PORTAL_PERMISSIONS.PORTAL_READ_RECITER),
  },
  {
    // Issues: always visible pending backend permission seeds (matches sidebar gating)
    titleKey: 'ADMIN.HOME.SECTION_ISSUES',
    descriptionKey: 'ADMIN.HOME.SECTION_ISSUES_DESC',
    icon: 'lucideAlertCircle',
    route: '/admin/issues',
    visible: () => true,
  },
  {
    titleKey: 'ADMIN.HOME.SECTION_MEMBERS',
    descriptionKey: 'ADMIN.HOME.SECTION_MEMBERS_DESC',
    icon: 'lucideUserCog',
    route: '/admin/members',
    visible: (auth) =>
      auth.hasPermission(PORTAL_PERMISSIONS.PORTAL_VIEW_PUBLISHER_MEMBERS) || auth.isItqanAdmin(),
  },
  {
    titleKey: 'ADMIN.HOME.SECTION_ACCESS_REQUESTS',
    descriptionKey: 'ADMIN.HOME.SECTION_ACCESS_REQUESTS_DESC',
    icon: 'lucideKeyRound',
    route: '/admin/access-requests',
    visible: (auth) =>
      auth.hasPermission(PORTAL_PERMISSIONS.PORTAL_VIEW_ACCESS_REQUESTS) || auth.isItqanAdmin(),
  },
  {
    titleKey: 'ADMIN.HOME.SECTION_USAGE',
    descriptionKey: 'ADMIN.HOME.SECTION_USAGE_DESC',
    icon: 'lucideBarChart2',
    route: '/admin/usage',
    visible: (auth) => auth.hasPermission(PORTAL_PERMISSIONS.PORTAL_ACCESS),
  },
];

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [RouterLink, NzCardModule, NzGridModule, NgIcon, TranslateModule],
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.less'],
})
export class AdminHomeComponent {
  private readonly adminAuth = inject(AdminAuthService);

  /** Only show sections the user has permission to view. */
  readonly visibleSections = computed<AdminSection[]>(() =>
    ADMIN_SECTIONS.filter((s) => s.visible(this.adminAuth)).map((section) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { visible, ...rest } = section;
      return rest;
    }),
  );
}
