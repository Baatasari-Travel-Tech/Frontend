import {
  BarChart2,
  Calendar,
  Home,
  MessageSquare,
  PlusCircle,
  Store,
  type LucideIcon,
} from "lucide-react";

export interface DashboardNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export const dashboardNavItems: DashboardNavItem[] = [
  { name: "Home", icon: Home, href: "/organizer/dashboard" },
  { name: "Create Events", icon: PlusCircle, href: "/organizer/create-event" },
  { name: "Manage Events", icon: Calendar, href: "/organizer/manage-events" },
  { name: "Artist Request", icon: MessageSquare, href: "/organizer/artist-request" },
  { name: "Stalls", icon: Store, href: "/organizer/stalls" },
  { name: "Analytics", icon: BarChart2, href: "/organizer/analytics" },
];
