import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { AppFrame } from "@/components/layout/AppFrame";
import { EmptyState } from "@/components/ui";
import { AccessGate } from "@/modules/auth/AccessGate";
import { useIsAdmin } from "@/modules/auth/AuthProvider";

const lazy = (load: () => Promise<Record<string, React.ComponentType>>, name: string) => async () => ({ Component: (await load())[name] });

/** Solo administradores; el almacenero vuelve a productos. */
function AdminOnly() {
  return useIsAdmin() ? <Outlet /> : <Navigate to="/productos" replace />;
}

export const router = createBrowserRouter([
  {
    element: (
      <AccessGate>
        <AppFrame />
      </AccessGate>
    ),
    children: [
      { index: true, lazy: lazy(() => import("@/modules/dashboard/HomeRoute"), "HomeRoute") },
      { path: "productos", lazy: lazy(() => import("@/modules/products/ProductsPage"), "ProductsPage") },
      { path: "productos/:id", lazy: lazy(() => import("@/modules/products/ProductFormPage"), "ProductFormPage") },
      { path: "entradas/nueva", lazy: async () => { const m = await import("@/modules/docs/DocFormPage"); return { Component: () => <m.DocFormPage kind="entrada" /> }; } },
      { path: "salidas/nueva", lazy: async () => { const m = await import("@/modules/docs/DocFormPage"); return { Component: () => <m.DocFormPage kind="salida" /> }; } },
      { path: "conteo", lazy: lazy(() => import("@/modules/count/CountPage"), "CountPage") },
      { path: "movimientos", lazy: lazy(() => import("@/modules/docs/DocsPage"), "DocsPage") },
      { path: "movimientos/:id", lazy: lazy(() => import("@/modules/docs/DocDetailPage"), "DocDetailPage") },
      { path: "kardex", lazy: lazy(() => import("@/modules/docs/KardexPage"), "KardexPage") },
      {
        Component: AdminOnly,
        children: [
          { path: "configuracion", lazy: lazy(() => import("@/modules/settings/SettingsPages"), "BusinessSettingsPage") },
          { path: "configuracion/usuarios", lazy: lazy(() => import("@/modules/settings/SettingsPages"), "UsersSettingsPage") },
          { path: "configuracion/categorias", lazy: lazy(() => import("@/modules/settings/SettingsPages"), "CategoriesSettingsPage") },
          { path: "configuracion/proveedores", lazy: lazy(() => import("@/modules/settings/SettingsPages"), "SuppliersSettingsPage") },
        ],
      },
      { path: "*", element: <EmptyState title="Página no encontrada" description="Revisa la dirección o vuelve al inicio." /> },
    ],
  },
]);
