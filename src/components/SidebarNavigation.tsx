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

import PersonHoldingSign from "/src/components/graphics/person.svg?react";

export default function SidebarNavigation() {
  const items = [
    {
      title: "Почетна",
      url: "/",
      icon: Home,
    },
    {
      title: "Станови",
      url: "/appartments",
      icon: Building,
    },
    {
      title: "Население",
      url: "/population",
      icon: UsersRound,
    },
    {
      title: "Добиток",
      url: "/livestock",
      icon: Bird,
    },
    {
      title: "Нето Плата",
      url: "/salary",
      icon: Banknote,
    },
    {
      title: "Растително Произ.",
      url: "/plant",
      icon: Vegan,
    },
    {
      title: "Растително Произ. (Рег)",
      url: "/plant-regional",
      icon: Vegan,
    },
    {
      title: "Големопродажба",
      url: "/commodity",
      icon: ArrowLeftRight,
    },

    {
      title: "Потрошувачка на Електрична Енергија",
      url: "/electricity",
      icon: Plug,
    },
    {
      title: "Малопродажба",
      url: "/sale",
      icon: Package,
    },
    {
      title: "Родови Статистики",
      url: "/gender",
      icon: Users,
    },
    {
      title: "Гранични Премини",
      url: "/passenger",
      icon: Globe,
    },
    {
      title: "Работни Места",
      url: "/job",
      icon: Briefcase,
    },
  ];

  return (
    <Sidebar variant="floating">
      <SidebarHeader>
        <h1 className="text-shadow-lg font-bold">MakStat</h1>
        <PersonHoldingSign width="150px" height="150px" className="mx-auto" />
      </SidebarHeader>
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
