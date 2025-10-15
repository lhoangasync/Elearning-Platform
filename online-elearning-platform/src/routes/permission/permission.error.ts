import { UnprocessableEntityException } from '@nestjs/common'

export const PermissionAlreadyExistException = new UnprocessableEntityException([
  {
    message: 'Permission already exists!',
    path: 'path',
  },
  {
    message: 'Permission already exists!',
    path: 'method',
  },
])
