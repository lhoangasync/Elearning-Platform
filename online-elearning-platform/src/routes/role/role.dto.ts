import { createZodDto } from 'nestjs-zod'
import {
  CreateRoleBodySchema,
  CreateRoleResSchema,
  GetRoleDetailResSchema,
  GetRoleParamsSchema,
  GetRolesQuerySchema,
  GetRolesResSchema,
  RoleWithPermissionsSchema,
  UpdateRoleBodySchema,
} from './role.model'

export class GetRoleWithPermissionsDTO extends createZodDto(RoleWithPermissionsSchema) {}

export class GetRolesResDTO extends createZodDto(GetRolesResSchema) {}

export class GetRolesQueryDTO extends createZodDto(GetRolesQuerySchema) {}

export class CreateRoleResDTO extends createZodDto(CreateRoleResSchema) {}

export class CreateRoleBodyDTO extends createZodDto(CreateRoleBodySchema) {}

export class UpdateRoleBodyDTO extends createZodDto(UpdateRoleBodySchema) {}

export class GetRoleDetailResDTO extends createZodDto(GetRoleDetailResSchema) {}

export class GetRoleParamsDTO extends createZodDto(GetRoleParamsSchema) {}
