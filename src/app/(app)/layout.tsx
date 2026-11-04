import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { GeneratorProvider } from "@/context/generator-context";
import { GenerationStatusBanner } from "@/components/layout/generation-status-banner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <GeneratorProvider>
        <AppSidebar collapsible="icon" />
        <SidebarInset className="flex flex-col min-h-screen">
          {children}
          <GenerationStatusBanner />
        </SidebarInset>
      </GeneratorProvider>
    </SidebarProvider>
  );
}
