import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  BarChart2,
  ClipboardList,
  History,
  LayoutDashboard,
  Settings,
  FileDown,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Entry", url: "/entry", icon: ClipboardList },
  { title: "Analytics", url: "/analytics", icon: BarChart2 },
  { title: "History", url: "/history", icon: History },
  { title: "Export", url: "/export", icon: FileDown },
];

export const AppSidebar = () => {
  return (
    <Sidebar className="w-48">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={({ isActive }) =>
                        isActive ? "font-semibold text-primary" : ""
                      }
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  isActive ? "font-semibold text-primary" : ""
                }
              >
                <Settings className="size-4" />
                <span>Settings</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
