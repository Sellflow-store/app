"use client";

import { createContext, useContext } from "react";

/**
 * In-store link prefix supplied once by the storefront layout: "" on a shop
 * subdomain / custom domain, "/{slug}" on the app host or localhost. Client
 * components read it via useStoreBase() instead of building "/{slug}/..." from
 * the slug, so the URL bar stays clean on subdomains (/products, not
 * /{slug}/products). See lib/storefront-base.ts + proxy.ts.
 */
const StoreBaseContext = createContext<string>("");

export function StoreBaseProvider({
  base,
  children,
}: {
  base: string;
  children: React.ReactNode;
}) {
  return <StoreBaseContext.Provider value={base}>{children}</StoreBaseContext.Provider>;
}

export function useStoreBase(): string {
  return useContext(StoreBaseContext);
}
