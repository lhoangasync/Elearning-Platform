import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put } from '@nestjs/common'
import { CourseService } from './course.service'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreateCourseBodyDTO,
  CreateCourseResDTO,
  GetCourseBySlugParamsDTO,
  GetCourseDetailResDTO,
  GetCourseParamsDTO,
  GetCoursesQueryDTO,
  GetCoursesResDTO,
  UpdateCourseBodyDTO,
  UpdateCourseResDTO,
} from './course.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { ActiveRolePermissions } from 'src/shared/decorators/active-role-permissions.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  @IsPublic()
  @ZodSerializerDto(GetCoursesResDTO)
  list(@Query() query: GetCoursesQueryDTO) {
    return this.courseService.list(query)
  }

  @Get('manage')
  @ZodSerializerDto(GetCoursesResDTO)
  listByRole(
    @Query() query: GetCoursesQueryDTO,
    @ActiveUser('userId') userId: string,
    @ActiveRolePermissions('name') roleName: string,
  ) {
    return this.courseService.listByRole(
      {
        ...query,
      },
      userId,
      roleName,
    )
  }

  @Get('slug/:slug')
  @IsPublic()
  @ZodSerializerDto(GetCourseDetailResDTO)
  findBySlug(@Param() params: GetCourseBySlugParamsDTO) {
    return this.courseService.findBySlug(params.slug)
  }

  @Get(':courseId')
  @IsPublic()
  @ZodSerializerDto(GetCourseDetailResDTO)
  findById(@Param() params: GetCourseParamsDTO) {
    return this.courseService.findById(params.courseId)
  }

  @Post()
  @ZodSerializerDto(CreateCourseResDTO)
  create(
    @Body() body: CreateCourseBodyDTO,
    @ActiveUser('userId') userId: string,
    @ActiveRolePermissions('name') roleName: string,
  ) {
    return this.courseService.create({
      data: body,
      createdById: userId,
      createdByRoleName: roleName,
    })
  }

  @Put(':courseId')
  @ZodSerializerDto(UpdateCourseResDTO)
  update(
    @Param() params: GetCourseParamsDTO,
    @Body() body: UpdateCourseBodyDTO,
    @ActiveUser('userId') userId: string,
    @ActiveRolePermissions('name') roleName: string,
  ) {
    return this.courseService.update({
      id: params.courseId,
      data: body,
      updatedById: userId,
      updatedByRoleName: roleName,
    })
  }

  @Delete(':courseId')
  @ZodSerializerDto(MessageResDTO)
  delete(
    @Param() params: GetCourseParamsDTO,
    @ActiveUser('userId') userId: string,
    @ActiveRolePermissions('name') roleName: string,
  ) {
    return this.courseService.delete({
      id: params.courseId,
      deletedById: userId,
      deletedByRoleName: roleName,
    })
  }
}
