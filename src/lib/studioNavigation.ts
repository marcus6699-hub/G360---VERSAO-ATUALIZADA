export type StudioSectionId = "workspace" | "site-management" | "settings";

export type StudioProductMode = "g360" | "site-express-standalone";

export type StudioViewId =
  | "audit"
  | "gbp-package"
  | "crm"
  | "site-express-direct"
  | "clients"
  | "saas-settings"
  | "home"
  | "templates"
  | "sales"
  | "ai"
  | "editor";

export type CrmSubViewId = "kanban" | "folders";

export interface StudioNavigationState {
  productMode: StudioProductMode;
  activeSection: StudioSectionId;
  view: StudioViewId;
  crmSubView: CrmSubViewId;
  lastWorkspaceView: StudioViewId;
  lastSiteManagementView: StudioViewId;
  sidebarExpanded: boolean;
}

export interface SidebarSubItem {
  id: string;
  viewId: StudioViewId;
  crmSubView?: CrmSubViewId;
  sectionId: StudioSectionId;
  label: string;
  shortLabel: string;
  description: string;
  testId: string;
}

export interface SidebarSectionGroup {
  id: StudioSectionId;
  label: string;
  shortLabel: string;
  description: string;
  testId: string;
  defaultView: StudioViewId;
  items: SidebarSubItem[];
}

const VALID_SECTIONS: Set<StudioSectionId> = new Set([
  "workspace",
  "site-management",
  "settings",
]);

const VALID_PRODUCT_MODES: Set<StudioProductMode> = new Set([
  "g360",
  "site-express-standalone",
]);

const VALID_VIEWS: Set<StudioViewId> = new Set([
  "audit",
  "gbp-package",
  "crm",
  "site-express-direct",
  "clients",
  "saas-settings",
  "home",
  "templates",
  "sales",
  "ai",
  "editor",
]);

export function resolveSectionFromView(
  view: string,
  productMode: StudioProductMode = "g360"
): StudioSectionId {
  switch (view) {
    case "site-express-direct":
    case "clients":
    case "templates":
    case "editor":
      return "site-management";
    case "saas-settings":
    case "ai":
      return "settings";
    case "home":
      return productMode === "site-express-standalone" ? "workspace" : "site-management";
    case "audit":
    case "gbp-package":
    case "crm":
    case "sales":
    default:
      return "workspace";
  }
}

export function createInitialStudioNavState(
  overrides?: Partial<StudioNavigationState>
): StudioNavigationState {
  const productMode: StudioProductMode =
    overrides?.productMode && VALID_PRODUCT_MODES.has(overrides.productMode)
      ? overrides.productMode
      : "g360";

  const defaultView: StudioViewId =
    productMode === "site-express-standalone" ? "home" : "audit";

  const view: StudioViewId =
    overrides?.view && VALID_VIEWS.has(overrides.view)
      ? overrides.view
      : defaultView;

  const crmSubView: CrmSubViewId =
    overrides?.crmSubView === "folders" ? "folders" : "kanban";

  const activeSection: StudioSectionId =
    overrides?.activeSection && VALID_SECTIONS.has(overrides.activeSection)
      ? overrides.activeSection
      : resolveSectionFromView(view, productMode);

  return {
    productMode,
    activeSection,
    view,
    crmSubView,
    lastWorkspaceView:
      overrides?.lastWorkspaceView && VALID_VIEWS.has(overrides.lastWorkspaceView)
        ? overrides.lastWorkspaceView
        : defaultView,
    lastSiteManagementView:
      overrides?.lastSiteManagementView &&
      VALID_VIEWS.has(overrides.lastSiteManagementView)
        ? overrides.lastSiteManagementView
        : productMode === "site-express-standalone"
        ? "clients"
        : "site-express-direct",
    sidebarExpanded:
      typeof overrides?.sidebarExpanded === "boolean"
        ? overrides.sidebarExpanded
        : true,
  };
}

export function resolveTargetStateForSection(
  section: StudioSectionId,
  currentState: StudioNavigationState
): StudioNavigationState {
  if (!VALID_SECTIONS.has(section)) {
    return currentState;
  }

  const isStandalone = currentState.productMode === "site-express-standalone";

  if (section === "workspace") {
    const fallbackWorkspaceView: StudioViewId = isStandalone ? "home" : "audit";
    const candidate = currentState.lastWorkspaceView;
    const nextView =
      candidate &&
      resolveSectionFromView(candidate, currentState.productMode) === "workspace"
        ? candidate
        : fallbackWorkspaceView;

    return {
      ...currentState,
      activeSection: "workspace",
      view: nextView,
    };
  }

  if (section === "site-management") {
    const fallbackSiteView: StudioViewId = isStandalone
      ? "clients"
      : "site-express-direct";
    const candidate = currentState.lastSiteManagementView;
    const nextView =
      candidate &&
      resolveSectionFromView(candidate, currentState.productMode) ===
        "site-management" &&
      candidate !== "editor"
        ? candidate
        : fallbackSiteView;

    return {
      ...currentState,
      activeSection: "site-management",
      view: nextView,
      lastSiteManagementView: nextView,
    };
  }

  // section === "settings"
  const settingsView: StudioViewId = isStandalone ? "ai" : "saas-settings";
  return {
    ...currentState,
    activeSection: "settings",
    view: settingsView,
  };
}

export function resolveTargetStateForNavItem(
  itemId: string,
  currentState: StudioNavigationState
): StudioNavigationState {
  if (
    itemId === "workspace" ||
    itemId === "site-management" ||
    itemId === "settings"
  ) {
    return resolveTargetStateForSection(itemId, currentState);
  }

  if (itemId === "crm-folders") {
    return {
      ...currentState,
      activeSection: "workspace",
      view: "crm",
      crmSubView: "folders",
      lastWorkspaceView: "crm",
    };
  }

  if (itemId === "crm") {
    return {
      ...currentState,
      activeSection: "workspace",
      view: "crm",
      crmSubView: "kanban",
      lastWorkspaceView: "crm",
    };
  }

  if (!VALID_VIEWS.has(itemId as StudioViewId)) {
    return currentState;
  }

  const targetView = itemId as StudioViewId;
  const targetSection = resolveSectionFromView(
    targetView,
    currentState.productMode
  );

  return {
    ...currentState,
    activeSection: targetSection,
    view: targetView,
    lastWorkspaceView:
      targetSection === "workspace"
        ? targetView
        : currentState.lastWorkspaceView,
    lastSiteManagementView:
      targetSection === "site-management" && targetView !== "editor"
        ? targetView
        : currentState.lastSiteManagementView,
  };
}

export function isNavItemActive(
  itemId: string,
  state: Pick<StudioNavigationState, "view" | "crmSubView" | "activeSection" | "productMode">
): boolean {
  if (
    itemId === "workspace" ||
    itemId === "site-management" ||
    itemId === "settings"
  ) {
    return resolveSectionFromView(state.view, state.productMode) === itemId;
  }

  if (itemId === "crm-folders") {
    return state.view === "crm" && state.crmSubView === "folders";
  }

  if (itemId === "crm") {
    return state.view === "crm" && state.crmSubView !== "folders";
  }

  return state.view === itemId;
}

export function getSidebarNavGroups(
  productMode: StudioProductMode = "g360"
): SidebarSectionGroup[] {
  if (productMode === "site-express-standalone") {
    return [
      {
        id: "workspace",
        label: "Workspace",
        shortLabel: "Workspace",
        description: "Criação rápida de sites e prospecção comercial",
        testId: "sidebar-section-workspace",
        defaultView: "home",
        items: [
          {
            id: "home",
            viewId: "home",
            sectionId: "workspace",
            label: "Novo Site Express",
            shortLabel: "Novo Site",
            description: "Busca inteligente e criação instantânea",
            testId: "sidebar-item-home",
          },
          {
            id: "sales",
            viewId: "sales",
            sectionId: "workspace",
            label: "Central de Vendas",
            shortLabel: "Vendas",
            description: "Scripts e propostas comerciais",
            testId: "sidebar-item-sales",
          },
        ],
      },
      {
        id: "site-management",
        label: "Gestão de Sites",
        shortLabel: "Sites",
        description: "Sites publicados, clientes e modelos prontos",
        testId: "sidebar-section-site-management",
        defaultView: "clients",
        items: [
          {
            id: "clients",
            viewId: "clients",
            sectionId: "site-management",
            label: "Meus Sites Publicados",
            shortLabel: "Meus Sites",
            description: "Gerenciar projetos, links e status",
            testId: "sidebar-item-clients",
          },
          {
            id: "templates",
            viewId: "templates",
            sectionId: "site-management",
            label: "Catálogo de Modelos (7)",
            shortLabel: "Modelos",
            description: "Templates otimizados por nicho",
            testId: "sidebar-item-templates",
          },
        ],
      },
      {
        id: "settings",
        label: "Configurações",
        shortLabel: "Ajustes",
        description: "Provedores de IA, chaves e preferências",
        testId: "sidebar-section-settings",
        defaultView: "ai",
        items: [
          {
            id: "ai",
            viewId: "ai",
            sectionId: "settings",
            label: "Motores de IA & APIs",
            shortLabel: "IA & APIs",
            description: "Configuração de modelos e chaves",
            testId: "sidebar-item-ai-settings",
          },
          {
            id: "saas-settings",
            viewId: "saas-settings",
            sectionId: "settings",
            label: "Acessos e Deploy",
            shortLabel: "Deploy",
            description: "Vercel, Netlify, Pix e usuários",
            testId: "sidebar-item-saas-settings",
          },
        ],
      },
    ];
  }

  return [
    {
      id: "workspace",
      label: "Workspace",
      shortLabel: "Workspace",
      description: "Auditoria GBP, otimização e operação comercial",
      testId: "sidebar-section-workspace",
      defaultView: "audit",
      items: [
        {
          id: "audit",
          viewId: "audit",
          sectionId: "workspace",
          label: "Prospecção e Auditoria",
          shortLabel: "Auditoria",
          description: "Pré-análise e análise completa 100 pts",
          testId: "sidebar-item-audit",
        },
        {
          id: "gbp-package",
          viewId: "gbp-package",
          sectionId: "workspace",
          label: "Pacote GBP",
          shortLabel: "Pacote GBP",
          description: "Entrega de otimização Google Meu Negócio",
          testId: "sidebar-item-gbp-package",
        },
        {
          id: "crm-folders",
          viewId: "crm",
          crmSubView: "folders",
          sectionId: "workspace",
          label: "Pastas & Vencimentos",
          shortLabel: "Pastas",
          description: "Dossiês de clientes e recorrência",
          testId: "sidebar-item-crm-folders",
        },
        {
          id: "crm",
          viewId: "crm",
          crmSubView: "kanban",
          sectionId: "workspace",
          label: "Funil CRM & Contratos",
          shortLabel: "Funil CRM",
          description: "Pipeline comercial, propostas e contratos",
          testId: "sidebar-item-crm",
        },
      ],
    },
    {
      id: "site-management",
      label: "Gestão de Sites",
      shortLabel: "Sites",
      description: "Gerador Site Express, páginas salvas e publicação",
      testId: "sidebar-section-site-management",
      defaultView: "site-express-direct",
      items: [
        {
          id: "site-express-direct",
          viewId: "site-express-direct",
          sectionId: "site-management",
          label: "Site Express & Cloud",
          shortLabel: "Site Express",
          description: "Geração 1-clique, deploy e Firestore",
          testId: "sidebar-item-site-express",
        },
        {
          id: "clients",
          viewId: "clients",
          sectionId: "site-management",
          label: "Meus Sites & Projetos",
          shortLabel: "Meus Sites",
          description: "Lista completa de sites criados e edição",
          testId: "sidebar-item-clients",
        },
        {
          id: "templates",
          viewId: "templates",
          sectionId: "site-management",
          label: "Galeria de Modelos (7)",
          shortLabel: "Modelos",
          description: "Escolha visual de arquétipos e temas",
          testId: "sidebar-item-templates",
        },
      ],
    },
    {
      id: "settings",
      label: "Configurações",
      shortLabel: "Ajustes",
      description: "Integrações, chaves de API, equipe e faturamento",
      testId: "sidebar-section-settings",
      defaultView: "ai",
      items: [
        {
          id: "ai",
          viewId: "ai",
          sectionId: "settings",
          label: "Hub de IAs Gratuitas",
          shortLabel: "Hub IAs",
          description: "Gemini 3.8 Flash, Maps, Search e Nano Banana",
          testId: "sidebar-item-ai-settings",
        },
        {
          id: "saas-settings",
          viewId: "saas-settings",
          sectionId: "settings",
          label: "Acessos, IA e Deploy",
          shortLabel: "Acessos & IA",
          description: "Chaves de API, Google Workspace, Pix e metas",
          testId: "sidebar-item-saas-settings",
        },
      ],
    },
  ];
}

export function serializeSidebarState(state: StudioNavigationState): string {
  return JSON.stringify({
    productMode: state.productMode,
    activeSection: state.activeSection,
    view: state.view,
    crmSubView: state.crmSubView,
    lastWorkspaceView: state.lastWorkspaceView,
    lastSiteManagementView: state.lastSiteManagementView,
    sidebarExpanded: state.sidebarExpanded,
  });
}

export function parseSidebarState(
  raw: string | null | undefined
): StudioNavigationState {
  if (!raw || typeof raw !== "string") {
    return createInitialStudioNavState();
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return createInitialStudioNavState();
    }
    return createInitialStudioNavState({
      productMode: parsed.productMode,
      activeSection: parsed.activeSection,
      view:
        parsed.view === "editor"
          ? parsed.lastSiteManagementView || "site-express-direct"
          : parsed.view,
      crmSubView: parsed.crmSubView,
      lastWorkspaceView: parsed.lastWorkspaceView,
      lastSiteManagementView: parsed.lastSiteManagementView,
      sidebarExpanded: parsed.sidebarExpanded,
    });
  } catch {
    return createInitialStudioNavState();
  }
}
