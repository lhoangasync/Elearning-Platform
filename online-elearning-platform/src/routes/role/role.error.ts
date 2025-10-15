import { ForbiddenException, UnprocessableEntityException } from '@nestjs/common'

export const RoleNotFoundException = new UnprocessableEntityException([
  {
    message: 'Role not found',
    path: 'role',
  },
])

export const RoleAlreadyExistException = new UnprocessableEntityException([
  {
    message: 'Role already exists!',
    path: 'name',
  },
])

export const ProhibitedActionsOnBaseRoleException = new ForbiddenException('Cannot change or delete this role!')
