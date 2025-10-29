export interface IUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  avatar: string | null;
  status: "ACTIVE" | "INACTIVE";
  roleId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdById: string | null;
  updatedById: string | null;
  deletedById: string | null;
}

export interface IPermission {
  id: string;
  name: string;
  module: string;
  path: string;
  method: string;
}

export interface IRole {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  // createdAt: string;
  // updatedAt: string;
  // deletedAt: string | null;
  permissions: IPermission[];
}

export interface TUserProfileRes extends IUser {
  role: IRole;
}
export interface ILoginReqBody {
  email: string;
  password: string;
  totpCode?: string;
  code?: string;
}
