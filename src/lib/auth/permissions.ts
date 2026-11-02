import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

export const ac = createAccessControl(defaultStatements);

export const adminRole = adminAc;

export const salespersonRole = ac.newRole({
  user: [],
  session: [],
});

export const roles = {
  admin: adminRole,
  salesperson: salespersonRole,
};
