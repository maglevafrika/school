
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { DashboardNav } from "@/components/dashboard-nav";
import { UserNav } from "@/components/user-nav";
import { DatabaseProvider } from "@/context/database-context";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
            <SidebarHeader>
              <AppLogo />
            </SidebarHeader>
            <SidebarContent>
              <DashboardNav />
            </SidebarContent>
        </Sidebar>
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden" />
                <div className="hidden md:block">
                   {/* Logo is in sidebar on desktop */}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <UserNav />
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DatabaseProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DatabaseProvider>
  );
}
