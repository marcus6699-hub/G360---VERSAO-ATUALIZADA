import test from "node:test";
import assert from "node:assert/strict";
import {
  createInitialStudioNavState,
  resolveSectionFromView,
  resolveTargetStateForSection,
  resolveTargetStateForNavItem,
  isNavItemActive,
  getSidebarNavGroups,
  serializeSidebarState,
  parseSidebarState,
} from "./studioNavigation";

test("resolveSectionFromView maps views accurately to workspace, site-management, and settings", () => {
  assert.equal(resolveSectionFromView("audit", "g360"), "workspace");
  assert.equal(resolveSectionFromView("gbp-package", "g360"), "workspace");
  assert.equal(resolveSectionFromView("crm", "g360"), "workspace");
  assert.equal(resolveSectionFromView("site-express-direct", "g360"), "site-management");
  assert.equal(resolveSectionFromView("clients", "g360"), "site-management");
  assert.equal(resolveSectionFromView("templates", "g360"), "site-management");
  assert.equal(resolveSectionFromView("saas-settings", "g360"), "settings");
  assert.equal(resolveSectionFromView("ai", "site-express-standalone"), "settings");
  assert.equal(resolveSectionFromView("home", "site-express-standalone"), "workspace");
});

test("resolveTargetStateForSection switches between workspace, site-management, and settings while preserving last active sub-view", () => {
  const initial = createInitialStudioNavState();
  assert.equal(initial.activeSection, "workspace");
  assert.equal(initial.view, "audit");
  assert.equal(initial.sidebarExpanded, true);

  // Navigate to GBP package inside workspace
  const onGbp = resolveTargetStateForNavItem("gbp-package", initial);
  assert.equal(onGbp.activeSection, "workspace");
  assert.equal(onGbp.view, "gbp-package");
  assert.equal(onGbp.lastWorkspaceView, "gbp-package");

  // Switch to Site Management section
  const onSites = resolveTargetStateForSection("site-management", onGbp);
  assert.equal(onSites.activeSection, "site-management");
  assert.equal(onSites.view, "site-express-direct");

  // Switch to clients inside Site Management
  const onClients = resolveTargetStateForNavItem("clients", onSites);
  assert.equal(onClients.activeSection, "site-management");
  assert.equal(onClients.view, "clients");
  assert.equal(onClients.lastSiteManagementView, "clients");

  // Switch to Settings section
  const onSettings = resolveTargetStateForSection("settings", onClients);
  assert.equal(onSettings.activeSection, "settings");
  assert.equal(onSettings.view, "saas-settings");

  // Return to Workspace section -> restores lastWorkspaceView ("gbp-package")
  const backToWorkspace = resolveTargetStateForSection("workspace", onSettings);
  assert.equal(backToWorkspace.activeSection, "workspace");
  assert.equal(backToWorkspace.view, "gbp-package");

  // Return to Site Management section -> restores lastSiteManagementView ("clients")
  const backToSites = resolveTargetStateForSection("site-management", backToWorkspace);
  assert.equal(backToSites.activeSection, "site-management");
  assert.equal(backToSites.view, "clients");
});

test("resolveTargetStateForNavItem distinguishes crm kanban vs crm-folders and updates active indicators", () => {
  const initial = createInitialStudioNavState();

  const foldersState = resolveTargetStateForNavItem("crm-folders", initial);
  assert.equal(foldersState.view, "crm");
  assert.equal(foldersState.crmSubView, "folders");
  assert.equal(isNavItemActive("crm-folders", foldersState), true);
  assert.equal(isNavItemActive("crm", foldersState), false);
  assert.equal(isNavItemActive("workspace", foldersState), true);

  const kanbanState = resolveTargetStateForNavItem("crm", foldersState);
  assert.equal(kanbanState.view, "crm");
  assert.equal(kanbanState.crmSubView, "kanban");
  assert.equal(isNavItemActive("crm", kanbanState), true);
  assert.equal(isNavItemActive("crm-folders", kanbanState), false);
});

test("getSidebarNavGroups returns workspace, site-management, and settings groups for both product modes", () => {
  const g360Groups = getSidebarNavGroups("g360");
  assert.deepEqual(
    g360Groups.map((g) => g.id),
    ["workspace", "site-management", "settings"]
  );

  const standaloneGroups = getSidebarNavGroups("site-express-standalone");
  assert.deepEqual(
    standaloneGroups.map((g) => g.id),
    ["workspace", "site-management", "settings"]
  );
});

test("serializeSidebarState and parseSidebarState round-trip state and recover safely from invalid JSON", () => {
  const custom = createInitialStudioNavState({
    view: "clients",
    activeSection: "site-management",
    sidebarExpanded: false,
  });

  const raw = serializeSidebarState(custom);
  const restored = parseSidebarState(raw);
  assert.equal(restored.view, "clients");
  assert.equal(restored.activeSection, "site-management");
  assert.equal(restored.sidebarExpanded, false);

  const fallback = parseSidebarState("{broken_json");
  assert.equal(fallback.activeSection, "workspace");
  assert.equal(fallback.view, "audit");
  assert.equal(fallback.sidebarExpanded, true);
});
