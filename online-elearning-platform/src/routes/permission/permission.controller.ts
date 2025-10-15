import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put } from '@nestjs/common'
import { PermissionService } from './permission.service'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreatePermissionBodyDTO,
  GetPermissionDetailResDTO,
  GetPermissionParamsDTO,
  GetPermissionQueryDTO,
  GetPermissionResDTO,
  UpdatePermissionBodyDTO,
} from './permission.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @ZodSerializerDto(GetPermissionResDTO)
  list(@Query() query: GetPermissionQueryDTO) {
    return this.permissionService.list(query)
  }

  @Get(':permissionId')
  @ZodSerializerDto(GetPermissionDetailResDTO)
  findById(@Param() params: GetPermissionParamsDTO) {
    return this.permissionService.findById(params.permissionId)
  }

  @Post()
  @ZodSerializerDto(GetPermissionDetailResDTO)
  create(@Body() body: CreatePermissionBodyDTO, @ActiveUser('userId') userId: string) {
    return this.permissionService.create({
      data: body,
      createdById: userId,
    })
  }

  @Put(':permissionId')
  @ZodSerializerDto(GetPermissionDetailResDTO)
  update(
    @Body() body: UpdatePermissionBodyDTO,
    @Param() params: GetPermissionParamsDTO,
    @ActiveUser('userId') userId: string,
  ) {
    return this.permissionService.update({
      data: body,
      id: params.permissionId,
      updatedById: userId,
    })
  }

  @Delete(':permissionId')
  @ZodSerializerDto(MessageResDTO)
  delete(@Param() params: GetPermissionParamsDTO, @ActiveUser('userId') userId: string) {
    return this.permissionService.delete({ id: params.permissionId, deletedById: userId })
  }
}
