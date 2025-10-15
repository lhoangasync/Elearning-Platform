import { Injectable } from '@nestjs/common'
import { RoleRepository } from './role.repository'
import { CreateRoleBodyType, GetRolesQueryType, UpdateRoleBodyType } from './role.model'
import { RoleAlreadyExistException, RoleNotFoundException } from './role.error'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helper'
import { NotFoundRecordException } from 'src/shared/error'

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
      const role = await this.roleRepository.update({
        data,
        id,
        updatedById,
      })
      return role
    } catch (error) {
      if (isNotFoundPrismaError(error)) throw NotFoundRecordException

      if (isUniqueConstraintPrismaError(error)) throw RoleAlreadyExistException

      throw error
    }
  }

  async delete({ id, deletedById }: { id: string; deletedById: string }) {
    try {
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
