"use client";

import Sales from "../../src/components/Sales";
import RequireAuth from "../../src/components/RequireAuth";

export default function SalesPage() {
  return (
    <RequireAuth>
      <Sales />
    </RequireAuth>
  );
}
