import React from "react";
import {
  BarChart3,
  Sparkles,
  FolderOpen,
  Briefcase,
  Layers,
  Users,
  Settings2,
  Plus,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutGrid,
  Globe,
  Sliders,
  ArrowLeftRight,
} from "lucide-react";
import {
  StudioNavigationState,
  StudioSectionId,
  getSidebarNavGroups,
  isNavItemActive,
  resolveSectionFromView,
} from "@/lib/studioNavigation";

export interface StudioSidebarProps {
  dark?: boolean;
  navState: StudioNavigationState;
  projectsCount?: number;
  activeBusinessName?: string;
  onSelectSection: (sectionId: StudioSectionId) => void;
  onSelectNavItem: (itemId: string) => void;
  onToggleExpand: () => void;
  onRunGlobalAiTest?: () => void;
  onToggleProductMode?: () => void;
}

const SECTION_ICON_MAP: Record<StudioSectionId, React.ComponentType<{ size?: number; className?: string }>> = {
  workspace: LayoutGrid,
  "site-management": Globe,
  settings: Sliders,
};

const ITEM_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  audit: BarChart3,
  "gbp-package": Sparkles,
  "crm-folders": FolderOpen,
  crm: Briefcase,
  "site-express-direct": Globe,
  clients: Users,
  templates: Layers,
  "saas-settings": Settings2,
  home: Plus,
  sales: Briefcase,
  ai: Sparkles,
};

export default function StudioSidebar({
  dark = false,
  navState,
  projectsCount = 0,
  activeBusinessName,
  onSelectSection,
  onSelectNavItem,
  onToggleExpand,
  onRunGlobalAiTest,
  onToggleProductMode,
}: StudioSidebarProps) {
  const { productMode, sidebarExpanded } = navState;
  const activeSection = resolveSectionFromView(navState.view, productMode);
  const groups = getSidebarNavGroups(productMode);

  const surfaceClass = dark
    ? "bg-[#120E24] border-white/10 text-[#F4F2FF]"
    : "bg-white border-purple-900/10 text-[#120E24]";

  const mutedTextClass = dark ? "text-[#A39BBF]" : "text-[#5E5775]";

  return (
    <aside
      aria-label="Navegação Principal do Studio"
      data-testid="studio-persistent-sidebar"
      data-expanded={sidebarExpanded ? "true" : "false"}
      data-active-section={activeSection}
      className={`${
        sidebarExpanded ? "w-64" : "w-16"
      } hidden md:flex shrink-0 border-r flex-col justify-between transition-[width] duration-200 select-none ${surfaceClass}`}
    >
      {/* Top Section: Header + Primary 3-View Switcher (Workspace / Site Management / Settings) */}
      <div className="flex flex-col min-h-0 flex-1 overflow-y-auto studio-scroll p-2.5 space-y-4">
        {/* Sidebar Header & Collapse Toggle */}
        <div
          className={`flex items-center ${
            sidebarExpanded ? "justify-between px-2" : "justify-center"
          } pt-1 pb-2 border-b ${dark ? "border-white/10" : "border-purple-900/10"}`}
        >
          {sidebarExpanded && (
            <div className="min-w-0">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#7C3AED] whitespace-nowrap">
                {productMode === "site-express-standalone" ? "Site Express Studio" : "G360 Studio"}
              </div>
              <div className={`text-[11px] truncate ${mutedTextClass}`}>
                {activeBusinessName ? `Ativo: ${activeBusinessName}` : "Painel de Controle"}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onToggleExpand}
            aria-label={sidebarExpanded ? "Recolher barra lateral" : "Expandir barra lateral"}
            title={sidebarExpanded ? "Recolher menu lateral" : "Expandir menu lateral"}
            data-testid="sidebar-collapse-toggle"
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer shrink-0 ${
              dark
                ? "border-white/10 text-[#A39BBF] hover:text-white hover:bg-white/5"
                : "border-purple-900/10 text-[#5E5775] hover:text-[#120E24] hover:bg-purple-50"
            }`}
          >
            {sidebarExpanded ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
          </button>
        </div>

        {/* Primary View Mode Switcher: Workspace | Site Management | Settings */}
        <div className="space-y-1" role="group" aria-label="Alternar área principal">
          {sidebarExpanded && (
            <div className={`px-2 text-[10px] font-bold uppercase tracking-wider ${mutedTextClass}`}>
              Áreas do Studio
            </div>
          )}
          <div className={sidebarExpanded ? "grid grid-cols-3 gap-1 p-1 rounded-xl bg-purple-500/10" : "flex flex-col gap-1"}>
            {groups.map((group) => {
              const SectionIcon = SECTION_ICON_MAP[group.id] || LayoutGrid;
              const isSectionActive = activeSection === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  data-testid={group.testId}
                  aria-current={isSectionActive ? "page" : undefined}
                  onClick={() => onSelectSection(group.id)}
                  title={`${group.label} — ${group.description}`}
                  className={`flex flex-col items-center justify-center gap-1 rounded-lg py-1.5 px-1.5 text-[11px] font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isSectionActive
                      ? "bg-[#7C3AED] text-white shadow-sm"
                      : dark
                      ? "text-[#A39BBF] hover:text-white hover:bg-white/5"
                      : "text-[#5E5775] hover:text-[#120E24] hover:bg-purple-50"
                  }`}
                >
                  <SectionIcon size={14} className="shrink-0" />
                  {sidebarExpanded && <span className="truncate max-w-full">{group.shortLabel}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grouped Navigation Tree */}
        <nav className="space-y-4 flex-1" aria-label="Módulos do Studio">
          {groups.map((group) => {
            const isCurrentGroup = activeSection === group.id;
            return (
              <div
                key={group.id}
                data-testid={`sidebar-group-${group.id}`}
                className="space-y-1"
              >
                {sidebarExpanded && (
                  <button
                    type="button"
                    onClick={() => onSelectSection(group.id)}
                    className={`w-full flex items-center justify-between px-2 py-1 text-left rounded-lg transition-colors cursor-pointer ${
                      isCurrentGroup
                        ? "text-[#7C3AED] font-extrabold"
                        : `${mutedTextClass} font-bold hover:text-[#7C3AED]`
                    }`}
                  >
                    <span className="text-[10.5px] uppercase tracking-wider whitespace-nowrap">
                      {group.label}
                    </span>
                    {group.id === "site-management" && (
                      <span
                        data-testid="sidebar-projects-count"
                        className="text-[10.5px] font-mono tabular-nums opacity-80"
                      >
                        {projectsCount} {projectsCount === 1 ? "site" : "sites"}
                      </span>
                    )}
                  </button>
                )}

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const ItemIcon = ITEM_ICON_MAP[item.id] || BarChart3;
                    const active = isNavItemActive(item.id, navState);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-testid={item.testId}
                        aria-current={active ? "page" : undefined}
                        onClick={() => onSelectNavItem(item.id)}
                        title={sidebarExpanded ? item.description : `${item.label} — ${item.description}`}
                        className={`w-full flex items-center ${
                          sidebarExpanded ? "justify-between px-2.5 py-2" : "justify-center py-2.5 px-1"
                        } rounded-xl text-[12.5px] font-bold transition-all cursor-pointer ${
                          active
                            ? "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-sm"
                            : dark
                            ? "text-[#A39BBF] hover:text-white hover:bg-white/5"
                            : "text-[#5E5775] hover:text-[#120E24] hover:bg-purple-50"
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <ItemIcon size={16} className="shrink-0" />
                          {sidebarExpanded && (
                            <span className="truncate whitespace-nowrap">{item.label}</span>
                          )}
                        </span>
                        {sidebarExpanded && item.id === "clients" && (
                          <span
                            className={`text-[11px] font-mono tabular-nums ml-2 shrink-0 ${
                              active ? "text-white/90" : mutedTextClass
                            }`}
                          >
                            {projectsCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Mode Switch */}
      <div
        className={`p-2.5 border-t space-y-1.5 ${
          dark ? "border-white/10" : "border-purple-900/10"
        }`}
      >
        {onToggleProductMode && (
          <button
            type="button"
            onClick={onToggleProductMode}
            data-testid="sidebar-mode-switch-btn"
            title={
              productMode === "g360"
                ? "Alternar para modo Site Express Separado"
                : "Voltar para plataforma G360 Completa"
            }
            className={`w-full ${
              sidebarExpanded ? "py-2 px-3 justify-start" : "py-2 px-1 justify-center"
            } rounded-xl border text-[11.5px] font-bold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              dark
                ? "border-white/10 text-[#A39BBF] hover:text-white hover:bg-white/5"
                : "border-purple-900/10 text-[#5E5775] hover:text-[#120E24] hover:bg-purple-50"
            }`}
          >
            <ArrowLeftRight size={14} className="text-[#7C3AED] shrink-0" />
            {sidebarExpanded && (
              <span className="truncate">
                {productMode === "g360" ? "Modo Site Express" : "Modo G360 Completo"}
              </span>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
