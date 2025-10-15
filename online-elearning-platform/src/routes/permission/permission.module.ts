import { Module } from '@nestjs/common'
import { PermissionService } from './permission.service'
import { PermissionController } from './permission.controller'
import { PermissionRepository } from './permission.repository'

@Module({
  providers: [PermissionService, PermissionRepository],
  controllers: [PermissionController],
})
export class PermissionModule {}
