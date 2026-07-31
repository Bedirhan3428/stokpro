"use client";

import Customers from "../../src/components/Customers";
import RequireAuth from "../../src/components/RequireAuth";

export default function CustomersPage() {
  return (
    <RequireAuth>
      <Customers />
    </RequireAuth>
  );
}
