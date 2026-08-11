import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { PORTAL_PERMISSIONS } from '../../constants/portal-permission.constants';
import { AdminAuthService } from '../../services/admin-auth.service';
import { AdminHomeComponent } from './admin-home.component';

describe('AdminHomeComponent', () => {
  function setup(overrides: { hasPermission?: (code: string) => boolean; isItqanAdmin?: () => boolean } = {}) {
    const adminAuthMock = {
      hasPermission: overrides.hasPermission ?? (() => false),
      isItqanAdmin: overrides.isItqanAdmin ?? (() => false),
    };

    TestBed.configureTestingModule({
      imports: [AdminHomeComponent, TranslateModule.forRoot()],
      providers: [{ provide: AdminAuthService, useValue: adminAuthMock }],
    });

    TestBed.overrideComponent(AdminHomeComponent, { set: { template: '' } });

    const fixture = TestBed.createComponent(AdminHomeComponent);
    return fixture.componentInstance;
  }

  it('shows only the issues section when the user has no permissions', () => {
    const component = setup({ hasPermission: () => false, isItqanAdmin: () => false });
    expect(component.visibleSections().length).toBe(1);
  });

  it('shows all sections when the user has every permission', () => {
    const component = setup({ hasPermission: () => true, isItqanAdmin: () => true });
    // 11 sections: publishers, tafsirs, translations, mushafs, fonts, recitations, reciters, issues, members, access-requests, usage
    expect(component.visibleSections().length).toBe(11);
  });

  it('shows only recitations when only PORTAL_READ_RECITATION is granted', () => {
    const component = setup({
      hasPermission: (code: string) => code === PORTAL_PERMISSIONS.PORTAL_READ_RECITATION,
      isItqanAdmin: () => false,
    });

    const routes = component.visibleSections().map((s) => s.route);
    expect(routes).toContain('/admin/recitations');
    // Issues are always visible (pending backend permission seeds)
    expect(routes).toContain('/admin/issues');
    // But permission-gated ones should not appear
    expect(routes).not.toContain('/admin/publishers');
    expect(routes).not.toContain('/admin/tafsirs');
    expect(routes).not.toContain('/admin/members');
    expect(routes).not.toContain('/admin/access-requests');
    expect(routes).not.toContain('/admin/usage');
  });

  it('shows members and access-requests for Itqan admins even without explicit permissions', () => {
    const component = setup({
      hasPermission: () => false,
      isItqanAdmin: () => true,
    });

    const routes = component.visibleSections().map((s) => s.route);
    expect(routes).toContain('/admin/members');
    expect(routes).toContain('/admin/access-requests');
  });

  it('does not expose the internal visible predicate to consumers', () => {
    const component = setup({ hasPermission: () => true, isItqanAdmin: () => true });
    const section = component.visibleSections()[0];
    expect((section as unknown as Record<string, unknown>)['visible']).toBeUndefined();
  });

  it('issues section is always visible regardless of permissions', () => {
    const component = setup({ hasPermission: () => false, isItqanAdmin: () => false });
    const routes = component.visibleSections().map((s) => s.route);
    expect(routes).toContain('/admin/issues');
    expect(routes.length).toBe(1);
  });
});
