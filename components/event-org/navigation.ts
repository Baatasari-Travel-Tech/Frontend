import {
  BarChart2,
  Calendar,
  Home,
  PlusCircle,
  type LucideIcon,
} from "lucide-react";

export interface DashboardNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export const dashboardNavItems: DashboardNavItem[] = [
  { name: "Analytics", icon: BarChart2, href: "/organizer/analytics" },
  { name: "Home", icon: Home, href: "/organizer/dashboard" },
  { name: "Create Events", icon: PlusCircle, href: "/organizer/create-event" },
  { name: "Manage Events", icon: Calendar, href: "/organizer/manage-events" },
];
