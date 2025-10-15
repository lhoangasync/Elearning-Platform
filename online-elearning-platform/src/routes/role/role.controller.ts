import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common'
import { RoleService } from './role.service'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreateRoleBodyDTO,
  CreateRoleResDTO,
  GetRoleDetailResDTO,
  GetRoleParamsDTO,
  GetRolesQueryDTO,
  GetRolesResDTO,
  UpdateRoleBodyDTO,
} from './role.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @ZodSerializerDto(GetRolesResDTO)
  list(@Query() query: GetRolesQueryDTO) {
    return this.roleService.list({
      page: query.page,
      limit: query.limit,
    })
  }

  @Get(':roleId')
  @ZodSerializerDto(GetRoleDetailResDTO)
  findById(@Param() params: GetRoleParamsDTO) {
    return this.roleService.findById(params.roleId)
  }

  @Post()
  @ZodSerializerDto(CreateRoleResDTO)
  create(@Body() body: CreateRoleBodyDTO, @ActiveUser('userId') userId: string) {
    return this.roleService.create({ data: body, createdById: userId })
  }

  @Put(':roleId')
  @ZodSerializerDto(GetRoleDetailResDTO)
  update(
    @Body() body: Partial<UpdateRoleBodyDTO>,
    @Param() params: GetRoleParamsDTO,
    @ActiveUser('userId') userId: string,
  ) {
    return this.roleService.update({
      data: {
        name: body.name ?? '',
        description: body.description ?? '',
        isActive: body.isActive ?? false,
        permissionIds: body.permissionIds ?? [],
      },
      id: params.roleId,
      updatedById: userId,
    })
  }

  @Delete(':roleId')
  @ZodSerializerDto(MessageResDTO)
  delete(@Param() params: GetRoleParamsDTO, @ActiveUser('userId') userId: string) {
    return this.roleService.delete({
      id: params.roleId,
      deletedById: userId,
    })
  }
}
