import { Injectable } from '@nestjs/common'
import { PermissionRepository } from './permission.repository'
import { CreatePermissionBodyType, GetPermissionQueryType, UpdatePermissionBodyType } from './permission.model'
import { NotFoundRecordException } from 'src/shared/error'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helper'
import { PermissionAlreadyExistException } from './permission.error'

@Injectable()
export class PermissionService {
  constructor(private permissionRepository: PermissionRepository) {}

  async list(pagination: GetPermissionQueryType) {
    const data = await this.permissionRepository.list(pagination)
    return data
  }

  async findById(id: string) {
    const permission = await this.permissionRepository.findById(id)
    if (!permission) throw NotFoundRecordException
    return permission
  }

  async create({ data, createdById }: { data: CreatePermissionBodyType; createdById: string }) {
    try {
      return await this.permissionRepository.create({
        data,
        createdById,
      })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) throw PermissionAlreadyExistException

      throw error
    }
  }

  async update({ id, data, updatedById }: { id: string; data: UpdatePermissionBodyType; updatedById: string }) {
    try {
      const permission = await this.permissionRepository.update({
        id,
        updatedById,
        data,
      })
      return permission
    } catch (error) {
      if (isNotFoundPrismaError(error)) throw NotFoundRecordException
      if (isUniqueConstraintPrismaError(error)) throw PermissionAlreadyExistException

      throw error
    }
  }

  async delete({ id, deletedById }: { id: string; deletedById: string }) {
    try {
      await this.permissionRepository.delete({ id, deletedById })
      return {
        message: 'Delete successfully!',
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) throw NotFoundRecordException

      throw error
    }
  }
}
