"use client";

import * as React from "react";
import {
  IconBooks,
  IconCamera,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconHelp,
  IconSearch,
  IconShieldCog,
  IconUserCircle,
  IconUsersGroup,
} from "@tabler/icons-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Logo from "../shared/Logo";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "../ui/skeleton";

const NavItemSkeleton = () => (
  <div className="flex items-center gap-3 px-3 py-2">
    <Skeleton className="h-7 w-6 rounded-md" />
    <Skeleton className="h-5 flex-1 rounded-md" />
  </div>
);

const NavUserSkeleton = () => (
  <div className="flex items-center gap-3 p-2">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="flex-1 space-y-1.5">
      <Skeleton className="h-4 w-3/4 rounded-md" />
      <Skeleton className="h-3 w-1/2 rounded-md" />
    </div>
  </div>
);

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
      roles: ["ADMIN", "INSTRUCTOR", "STUDENT"],
    },
    {
      title: "Courses",
      url: "/dashboard/courses",
      icon: IconBooks,
      roles: ["ADMIN", "INSTRUCTOR"],
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: IconUsersGroup,
      roles: ["ADMIN"],
    },
    {
      title: "Roles & Permissions",
      url: "/dashboard/roles",
      icon: IconShieldCog,
      roles: ["ADMIN"],
    },
    {
      title: "Quizzes",
      url: "/dashboard/quizzes",
      icon: IconDatabase,
      roles: ["ADMIN", "INSTRUCTOR"],
    },
    // {
    //   title: "Projects",
    //   url: "#",
    //   icon: IconFolder,
    // },
    // {
    //   title: "Team",
    //   url: "#",
    //   icon: IconUsers,
    // },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Profile",
      url: "/dashboard/profile",
      icon: IconUserCircle,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useAuth();
  const userRole = user?.role?.name;

  const filteredNavMain = React.useMemo(() => {
    if (!userRole) {
      return [];
    }

    // Lọc mảng navMain
    return data.navMain.filter((item) => {
      if (!item.roles) {
        return true;
      }

      return item.roles.includes(userRole);
    });
  }, [userRole]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <Logo />
                <span className="text-base font-semibold">KinnLMS</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {isLoading ? (
          <div className="flex flex-col gap-2 px-2 pt-4">
            {[...Array(5)].map((_, i) => (
              <NavItemSkeleton key={i} />
            ))}
          </div>
        ) : (
          <NavMain items={filteredNavMain} />
        )}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {isLoading ? <NavUserSkeleton /> : <NavUser />}
      </SidebarFooter>
    </Sidebar>
  );
}
