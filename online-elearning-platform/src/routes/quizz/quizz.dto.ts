import { createZodDto } from 'nestjs-zod'
import {
  CreateQuizBodySchema,
  CreateQuizzResSchema,
  GetAttemptDetailResSchema,
  GetQuizAttemptsResSchema,
  GetQuizDetailResSchema,
  GetQuizForStudentResSchema,
  GetQuizParamsSchema,
  GetQuizzesForAdminQuerySchema,
  GetQuizzesQuerySchema,
  GetQuizzesResSchema,
  QuizzIncludeQuestionsSchema,
  StartQuizBodySchema,
  StartQuizResSchema,
  SubmitQuizBodySchema,
  SubmitQuizResSchema,
  UpdateQuizBodySchema,
  UpdateQuizzResSchema,
} from './quizz.model'

export class GetQuizzesQueryDTO extends createZodDto(GetQuizzesQuerySchema) {}

export class GetQuizzesForAdminQueryDTO extends createZodDto(GetQuizzesForAdminQuerySchema) {}

export class GetQuizParamsDTO extends createZodDto(GetQuizParamsSchema) {}

export class CreateQuizBodyDTO extends createZodDto(CreateQuizBodySchema) {}

export class UpdateQuizBodyDTO extends createZodDto(UpdateQuizBodySchema) {}

export class StartQuizBodyDTO extends createZodDto(StartQuizBodySchema) {}

export class SubmitQuizBodyDTO extends createZodDto(SubmitQuizBodySchema) {}

export class GetQuizzesResDTO extends createZodDto(GetQuizzesResSchema) {}

export class GetQuizDetailResDTO extends createZodDto(GetQuizDetailResSchema) {}

export class GetQuizForStudentResDTO extends createZodDto(GetQuizForStudentResSchema) {}

export class StartQuizResDTO extends createZodDto(StartQuizResSchema) {}

export class SubmitQuizResDTO extends createZodDto(SubmitQuizResSchema) {}

export class GetQuizAttemptsResDTO extends createZodDto(GetQuizAttemptsResSchema) {}

export class GetAttemptDetailResDTO extends createZodDto(GetAttemptDetailResSchema) {}

export class QuizzIncludeQuestionsDTO extends createZodDto(QuizzIncludeQuestionsSchema) {}

export class CreateQuizzResDTO extends createZodDto(CreateQuizzResSchema) {}

export class UpdateQuizzResDTO extends createZodDto(UpdateQuizzResSchema) {}
