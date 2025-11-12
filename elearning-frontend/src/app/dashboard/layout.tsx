"use client";
import React, { useEffect } from "react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SiteHeader } from "@/components/sidebar/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useRouter } from "next/navigation";

function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, router, isLoading]);

  // if (isLoading || !user) {
  //   return (
  //     <div className="flex h-screen w-full items-center justify-center">
  //       <LoadingSpinner />
  //     </div>
  //   );
  // }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {isLoading || !user ? (
              <div className="flex h-screen w-full items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                {children}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default AdminLayout;
