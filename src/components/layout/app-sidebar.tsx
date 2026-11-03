"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
  Camera,
  Video,
  Wand2,
  Tags,
  Library,
  Layers,
  Settings,
  History,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

type SubItem = { href: string; label: string };
type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  subItems?: SubItem[];
};
type NavGroup = { group: string; items: NavItem[] };

const navItems: NavGroup[] = [
  {
    group: "Riset & Analisis",
    items: [
      { href: "/dashboard", label: "Dasbor Tren", icon: BarChart3, badge: "Live" },
      { href: "/calendar", label: "Kalender Musiman", icon: Calendar },
    ],
  },
  {
    group: "Salin Gaya",
    items: [
      { href: "/copy-style/image", label: "Analisis Foto/Gambar", icon: Camera },
      { href: "/copy-style/video", label: "Analisis Video", icon: Video },
    ],
  },
  {
    group: "Generator",
    items: [
      { href: "/prompt", label: "Generator Prompt", icon: Wand2 },
      { href: "/seo", label: "Generator SEO", icon: Tags },
      {
        href: "/history",
        label: "Riwayat",
        icon: History,
        subItems: [
          { href: "/history/prompt", label: "Riwayat Generator Prompt" },
          { href: "/history/seo", label: "Riwayat Generator SEO" },
        ],
      },
    ],
  },
  {
    group: "Koleksi",
    items: [
      { href: "/library", label: "Koleksi Aset", icon: Library },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(
    () => ({ "/history": pathname.startsWith("/history") })
  );

  function toggleGroup(href: string) {
    setOpenGroups((prev) => ({ ...prev, [href]: !prev[href] }));
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Layers className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold leading-none truncate">MicroStock</span>
            <span className="text-xs text-muted-foreground truncate">Asset Studio</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                  if (item.subItems) {
                    const isOpen = openGroups[item.href] ?? false;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          onClick={() => toggleGroup(item.href)}
                          isActive={isActive}
                          tooltip={item.label}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                          <ChevronRight
                            className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                          />
                        </SidebarMenuButton>
                        {isOpen && (
                          <SidebarMenuSub>
                            {item.subItems.map((sub) => (
                              <SidebarMenuSubItem key={sub.href}>
                                <SidebarMenuSubButton
                                  render={<Link href={sub.href} />}
                                  isActive={pathname === sub.href}
                                >
                                  <span>{sub.label}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        )}
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto text-xs py-0 h-5">
                            {item.badge}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/settings" />}
              isActive={pathname === "/settings"}
              tooltip="Settings"
            >
              <Settings className="h-4 w-4" />
              <span>Pengaturan</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-2 pb-3 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          v1.0 · Personal · Single-user
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
