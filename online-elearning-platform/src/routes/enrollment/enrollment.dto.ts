import { createZodDto } from 'nestjs-zod'
import {
  EnrollCourseBodySchema,
  EnrollResSchema,
  GetEnrollmentDetailResSchema,
  GetEnrollmentParamsSchema,
  GetEnrollmentsQuerySchema,
  GetEnrollmentsResSchema,
  GetMyEnrollmentsResSchema,
} from './enrollment.model'

export class GetEnrollmentsQueryDTO extends createZodDto(GetEnrollmentsQuerySchema) {}

export class GetEnrollmentParamsDTO extends createZodDto(GetEnrollmentParamsSchema) {}

export class EnrollCourseBodyDTO extends createZodDto(EnrollCourseBodySchema) {}

export class GetEnrollmentsResDTO extends createZodDto(GetEnrollmentsResSchema) {}

export class GetEnrollmentDetailResDTO extends createZodDto(GetEnrollmentDetailResSchema) {}

export class GetMyEnrollmentsResDTO extends createZodDto(GetMyEnrollmentsResSchema) {}

export class EnrollResDTO extends createZodDto(EnrollResSchema) {}
