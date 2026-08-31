export const ADMIN_MODULE_PATHS = {
  dashboard: "/admin",
  users: "/admin/users",
  pages: "/admin/pages",
  categories: "/admin/categories",
  services: "/admin/services",
  orders: "/admin/orders",
  enquiries: "/admin/enquiries",
  gallery: "/admin/gallery",
  settings: "/admin/settings/theme",
};

export function isAdminUser(user) {
  return user?.role === "admin";
}

export function isSubAdminUser(user) {
  return user?.role === "sub-admin";
}

export function hasModulePermission(user, module, type = "view") {
  if (!user) return false;
  if (isAdminUser(user)) return true;
  if (!isSubAdminUser(user)) return false;

  return Boolean(user.permissions?.[module]?.[type]);
}

export function getFirstAllowedAdminPath(user) {
  if (!user) return "/";
  if (isAdminUser(user)) return "/admin";

  if (hasModulePermission(user, "dashboard", "view")) {
    return "/admin";
  }

  for (const [module, path] of Object.entries(ADMIN_MODULE_PATHS)) {
    if (module !== "dashboard" && hasModulePermission(user, module, "view")) {
      return path;
    }
  }

  return "/admin";
}
