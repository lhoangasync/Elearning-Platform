import { BadRequestException, Injectable } from '@nestjs/common'
import { RoleRepository } from './role.repository'
import { CreateRoleBodyType, GetRolesQueryType, UpdateRoleBodyType } from './role.model'
import { ProhibitedActionsOnBaseRoleException, RoleAlreadyExistException, RoleNotFoundException } from './role.error'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helper'
import { NotFoundRecordException } from 'src/shared/error'
import { RoleName } from 'src/shared/constants/role.constants'

@Injectable()
export class RoleService {
  constructor(private roleRepository: RoleRepository) {}

  async list(pagination: GetRolesQueryType) {
    const data = await this.roleRepository.list(pagination)
    return data
  }

  async findById(id: string) {
    const role = await this.roleRepository.findById(id)
    if (!role) throw RoleNotFoundException

    return role
  }

  async create({ data, createdById }: { data: CreateRoleBodyType; createdById: string }) {
    try {
      const role = await this.roleRepository.create({
        data,
        createdById,
      })
      return role
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) throw RoleAlreadyExistException

      throw error
    }
  }

  async update({ id, data, updatedById }: { id: string; data: UpdateRoleBodyType; updatedById: string }) {
    try {
      const role = await this.roleRepository.findById(id)
      if (!role) throw NotFoundRecordException

      // khong cho phep ai cap nhat role admin
      if (role.name === RoleName.Admin) throw ProhibitedActionsOnBaseRoleException

      const updatedRole = await this.roleRepository.update({
        data,
        id,
        updatedById,
      })
      return updatedRole
    } catch (error) {
      if (isNotFoundPrismaError(error)) throw NotFoundRecordException

      if (isUniqueConstraintPrismaError(error)) throw RoleAlreadyExistException

      if (error instanceof Error) throw new BadRequestException(error.message)

      throw error
    }
  }

  async delete({ id, deletedById }: { id: string; deletedById: string }) {
    try {
      const role = await this.roleRepository.findById(id)
      if (!role) throw NotFoundRecordException

      // khong cho phep xoa 3 role co ban nay
      if ([RoleName.Admin, RoleName.Instructor, RoleName.Student].includes(role.name))
        throw ProhibitedActionsOnBaseRoleException

      await this.roleRepository.delete({
        id,
        deletedById,
      })
      return {
        message: 'Delete role successfully!',
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) throw NotFoundRecordException

      throw error
    }
  }
}
