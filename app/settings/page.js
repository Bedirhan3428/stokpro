"use client";

import Settings from "../../src/components/Settings";
import RequireAuth from "../../src/components/RequireAuth";

export default function SettingsPage() {
  return (
    <RequireAuth>
      <Settings />
    </RequireAuth>
  );
}
