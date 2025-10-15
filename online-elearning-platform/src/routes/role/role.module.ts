import { Module } from '@nestjs/common'
import { RoleService } from './role.service'
import { RoleController } from './role.controller'
import { RoleRepository } from './role.repository'

@Module({
  providers: [RoleService, RoleRepository],
  controllers: [RoleController],
})
export class RoleModule {}
