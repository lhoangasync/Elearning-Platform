import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { EnrollmentService } from './enrollment.service'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  EnrollCourseBodyDTO,
  EnrollResDTO,
  GetEnrollmentDetailResDTO,
  GetEnrollmentParamsDTO,
  GetEnrollmentsQueryDTO,
  GetEnrollmentsResDTO,
  GetMyEnrollmentsResDTO,
} from './enrollment.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { ActiveRolePermissions } from 'src/shared/decorators/active-role-permissions.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Get()
  @ZodSerializerDto(GetEnrollmentsResDTO)
  list(
    @Query() query: GetEnrollmentsQueryDTO,
    @ActiveUser('userId') userId: string,
    @ActiveRolePermissions('name') roleName: string,
  ) {
    return this.enrollmentService.list(query, userId, roleName)
  }

  @Get('my-courses')
  @ZodSerializerDto(GetMyEnrollmentsResDTO)
  getMyEnrollments(@Query() query: GetEnrollmentsQueryDTO, @ActiveUser('userId') userId: string) {
    return this.enrollmentService.getMyEnrollments(userId, {
      page: query.page,
      limit: query.limit,
    })
  }

  @Get(':enrollmentId')
  @ZodSerializerDto(GetEnrollmentDetailResDTO)
  findById(
    @Param() params: GetEnrollmentParamsDTO,
    @ActiveUser('userId') userId: string,
    @ActiveRolePermissions('name') roleName: string,
  ) {
    return this.enrollmentService.findById(params.enrollmentId, userId, roleName)
  }

  @Post('enroll')
  @ZodSerializerDto(EnrollResDTO)
  enroll(@Body() body: EnrollCourseBodyDTO, @ActiveUser('userId') userId: string) {
    return this.enrollmentService.enroll({
      data: body,
      studentId: userId,
    })
  }

  @Delete('unenroll/:courseId')
  @ZodSerializerDto(MessageResDTO)
  unenroll(@Param('courseId') courseId: string, @ActiveUser('userId') userId: string) {
    return this.enrollmentService.unenroll({
      courseId,
      studentId: userId,
    })
  }

  @Delete(':enrollmentId')
  @ZodSerializerDto(MessageResDTO)
  delete(
    @Param() params: GetEnrollmentParamsDTO,
    @ActiveUser('userId') userId: string,
    @ActiveRolePermissions('name') roleName: string,
  ) {
    return this.enrollmentService.deleteEnrollment({
      id: params.enrollmentId,
      userId,
      userRoleName: roleName,
    })
  }
}
