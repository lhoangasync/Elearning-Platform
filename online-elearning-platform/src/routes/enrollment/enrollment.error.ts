import { UnprocessableEntityException, ForbiddenException } from '@nestjs/common'

export const AlreadyEnrolledException = new UnprocessableEntityException([
  {
    message: 'You have already enrolled in this course',
    path: 'courseId',
  },
])

export const NotEnrolledException = new UnprocessableEntityException([
  {
    message: 'You are not enrolled in this course',
    path: 'courseId',
  },
])

export const CannotEnrollDraftCourseException = new ForbiddenException('Cannot enroll in draft or archived courses')
