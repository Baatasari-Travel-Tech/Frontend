import { OrganizerShell } from "@/components/platform/organizer-shell"

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  return <OrganizerShell>{children}</OrganizerShell>
}
