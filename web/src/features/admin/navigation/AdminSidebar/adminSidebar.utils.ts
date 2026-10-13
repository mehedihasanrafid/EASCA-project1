import type { AdminSidebarItem } from "./adminSidebar.types";

/** Match a route without making `/admin/order` match `/admin/orders`. */
export function routeMatches(pathname: string, item: AdminSidebarItem) {
  if (item.exact) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

/** A parent group is active when its own route or any child route is active. */
export function groupMatches(pathname: string, item: AdminSidebarItem) {
  return routeMatches(pathname, item)
    || Boolean(item.children?.some((child) => routeMatches(pathname, child)));
}
