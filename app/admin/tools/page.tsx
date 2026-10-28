import { redirect } from "next/navigation";

import { AdminToolsClient } from "@/components/admin/AdminToolsClient";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isMongoConfigured } from "@/lib/db";

export default async function AdminToolsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }

  return <AdminToolsClient mongoConfigured={isMongoConfigured()} />;
}
