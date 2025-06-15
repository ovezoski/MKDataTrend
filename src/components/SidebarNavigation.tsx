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
  ArrowLeftRight,
  Plug,
  Package,
  Building,
  Users,
  Globe,
  Briefcase,
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
      title: "Livestock",
      url: "/livestock",
      icon: Bird,
    },
    {
      title: "Population",
      url: "/population",
      icon: UsersRound,
    },
    {
      title: "Appartments",
      url: "/appartments",
      icon: Building,
    },

    {
      title: "Neto Salary",
      url: "/salary",
      icon: Banknote,
    },
    {
      title: "Plant Production",
      url: "/plant",
      icon: Vegan,
    },
    {
      title: "Regional Plant Production",
      url: "/plant-regional",
      icon: Vegan,
    },
    {
      title: "Commodity Exchange",
      url: "/commodity",
      icon: ArrowLeftRight,
    },

    {
      title: "Electricity Consumption",
      url: "/electricity",
      icon: Plug,
    },
    {
      title: "Wholesale Trade",
      url: "/sale",
      icon: Package,
    },
    {
      title: "Gender Statistics",
      url: "/gender",
      icon: Users,
    },
    {
      title: "Passenger Crossings",
      url: "/passenger",
      icon: Globe,
    },
    {
      title: "Job Vacancies",
      url: "/job",
      icon: Briefcase,
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
