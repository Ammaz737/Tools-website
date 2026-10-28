import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import {
  isAdminAuthenticated,
  isAdminPasswordConfigured,
} from "@/lib/admin-auth";

export default async function AdminPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin/tools");
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {!isAdminPasswordConfigured() && (
        <div className="mx-auto max-w-md rounded-[14px] border border-[var(--warn)]/40 bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink-soft)]">
          Configure an admin password and an independent signing secret of at least 32 characters before signing in.
        </div>
      )}
      <AdminLoginForm />
    </div>
  );
}
