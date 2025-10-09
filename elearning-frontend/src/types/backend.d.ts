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
}

export interface IRole {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type TUserProfileRes = IUser & IRole;

export interface ILoginReqBody {
  email: string;
  password: string;
  totpCode?: string;
  code?: string;
}
