import { Role } from "../enums";

export enum Permission {
  VIEW_CATALOG = "VIEW_CATALOG",
  CHECKOUT = "CHECKOUT",
  MANAGE_PRODUCTS = "MANAGE_PRODUCTS",
  MANAGE_ORDERS = "MANAGE_ORDERS",
  MANAGE_USERS = "MANAGE_USERS",
  VIEW_REPORTS = "VIEW_REPORTS"
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: Object.values(Permission),
  [Role.MERCHANT]: [
    Permission.VIEW_CATALOG,
    Permission.MANAGE_PRODUCTS,
    Permission.MANAGE_ORDERS,
    Permission.VIEW_REPORTS
  ],
  [Role.CUSTOMER]: [Permission.VIEW_CATALOG, Permission.CHECKOUT],
  [Role.GUEST]: [Permission.VIEW_CATALOG]
};

export class SecurityPolicy {
  public static hasPermission(role: Role, permission: Permission): boolean {
    return rolePermissions[role]?.includes(permission) || false;
  }

  public static isAuthorized(userRole: Role, requiredRoles: Role[]): boolean {
    return requiredRoles.includes(userRole);
  }
}
