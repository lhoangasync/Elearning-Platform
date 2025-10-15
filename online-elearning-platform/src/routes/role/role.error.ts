import { UnprocessableEntityException } from '@nestjs/common'

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
