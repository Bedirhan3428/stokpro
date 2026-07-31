"use client";

import Dashboard from "../../src/components/Dashboard";
import RequireAuth from "../../src/components/RequireAuth";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}
