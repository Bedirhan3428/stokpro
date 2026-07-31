"use client";

import Products from "../../src/components/Products";
import RequireAuth from "../../src/components/RequireAuth";

export default function ProductsPage() {
  return (
    <RequireAuth>
      <Products />
    </RequireAuth>
  );
}
