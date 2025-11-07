import { Module } from '@nestjs/common'
import { EnrollmentController } from './enrollment.controller'
import { EnrollmentService } from './enrollment.service'
import { EnrollmentRepository } from './enrollment.repository'
import { CourseRepository } from '../course/course.repository'

@Module({
  controllers: [EnrollmentController],
  providers: [EnrollmentService, EnrollmentRepository, CourseRepository],
})
export class EnrollmentModule {}
