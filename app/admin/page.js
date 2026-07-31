"use client";

import AdminDashboard from "../../src/components/AdminDashboard";
import RequireAuth from "../../src/components/RequireAuth";

export default function AdminPage() {
  return (
    <RequireAuth>
      <AdminDashboard />
    </RequireAuth>
  );
}
