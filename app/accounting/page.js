"use client";

import Accounting from "../../src/components/Accounting";
import RequireAuth from "../../src/components/RequireAuth";

export default function AccountingPage() {
  return (
    <RequireAuth>
      <Accounting />
    </RequireAuth>
  );
}
