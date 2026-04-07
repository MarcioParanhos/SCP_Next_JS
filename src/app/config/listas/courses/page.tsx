import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CoursesDataTable } from "@/components/admin/lists/courses/CoursesDataTable";

export default function CoursesPage() {
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="p-6">
          <h1 className="mb-1 scroll-m-20 text-3xl font-bold tracking-tight">Cursos</h1>
          <p className="mb-6 text-muted-foreground text-sm">Gerencie os cursos utilizados nos formulários.</p>
          <CoursesDataTable />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
