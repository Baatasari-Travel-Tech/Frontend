import { redirect } from "next/navigation"
import { ADMIN_ROUTES } from "@/lib/admin/routes"

export default function AdminUsersAliasPage() {
  redirect(ADMIN_ROUTES.dashboard)
}
