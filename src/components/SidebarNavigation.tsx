import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Bird,
  Home,
  Settings,
  UsersRound,
  Vegan,
  Banknote,
} from "lucide-react";

import { Link } from "react-router-dom";

export default function SidebarNavigation() {
  const items = [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "Population",
      url: "/population",
      icon: UsersRound,
    },
    {
      title: "Livestock",
      url: "/livestock",
      icon: Bird,
    },
    {
      title: "Pelagonia",
      url: "/pelagonia",
      icon: Vegan,
    },
    {
      title: "Neto Salary",
      url: "/salary",
      icon: Banknote,
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
  ];

  return (
    <Sidebar variant="floating">
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
