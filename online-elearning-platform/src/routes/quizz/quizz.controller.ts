import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { QuizService } from './quizz.service'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreateQuizBodyDTO,
  CreateQuizzResDTO,
  GetAttemptDetailResDTO,
  GetQuizAttemptsResDTO,
  GetQuizDetailResDTO,
  GetQuizForStudentResDTO,
  GetQuizParamsDTO,
  GetQuizzesForAdminQueryDTO,
  GetQuizzesQueryDTO,
  GetQuizzesResDTO,
  StartQuizBodyDTO,
  StartQuizResDTO,
  SubmitQuizBodyDTO,
  SubmitQuizResDTO,
  UpdateQuizBodyDTO,
  UpdateQuizzResDTO,
} from './quizz.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { ActiveRolePermissions } from 'src/shared/decorators/active-role-permissions.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { RoleName } from 'src/shared/constants/role.constants'
import { GetQuizzesForAdminQuerySchema, GetQuizzesQuerySchema } from './quizz.model'

@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  @IsPublic()
  @ZodSerializerDto(GetQuizzesResDTO)
  list(@Query() query: GetQuizzesQueryDTO) {
    return this.quizService.list(query)
  }

  @Get('manage')
  @ZodSerializerDto(GetQuizzesResDTO)
  listManage(
    @Query() rawQuery: any,
    @ActiveUser('userId') userId: string,
    @ActiveRolePermissions('name') roleName: string,
  ) {
    if (roleName === RoleName.Admin) {
      const query = GetQuizzesForAdminQuerySchema.parse(rawQuery)
      return this.quizService.listForAdmin(query)
    }

    if (roleName === RoleName.Instructor) {
      const query = GetQuizzesQuerySchema.parse(rawQuery)
      return this.quizService.listForInstructor(query, userId)
    }

    return this.quizService.list(GetQuizzesQuerySchema.parse(rawQuery))
  }

  @Get('attempts')
  @ZodSerializerDto(GetQuizAttemptsResDTO)
  getAttempts(
    @Query() query: { page?: number; limit?: number; quizId?: string },
    @ActiveUser('userId') userId: string,
    @ActiveRolePermissions('name') roleName: string,
  ) {
    return this.quizService.getAttempts({
      page: query.page || 1,
      limit: query.limit || 10,
      quizId: query.quizId,
      userId,
      userRoleName: roleName,
    })
  }

  @Get('attempt/:attemptId')
  @ZodSerializerDto(GetAttemptDetailResDTO)
  getAttemptDetail(
    @Param('attemptId') attemptId: string,
    @ActiveUser('userId') userId: string,
    @ActiveRolePermissions('name') roleName: string,
  ) {
    return this.quizService.getAttemptDetail(attemptId, userId, roleName)
  }

  @Get(':quizId')
  @ZodSerializerDto(GetQuizDetailResDTO)
  findById(
    @Param() params: GetQuizParamsDTO,
    @ActiveUser('userId') userId: string,
    @ActiveRolePermissions('name') roleName: string,
  ) {
    return this.quizService.findById(params.quizId, userId, roleName)
  }

  @Post()
  @ZodSerializerDto(CreateQuizzResDTO)
  create(
    @Body() body: CreateQuizBodyDTO,
    @ActiveUser('userId') userId: string,
    @ActiveRolePermissions('name') roleName: string,
  ) {
    return this.quizService.create({
      data: body,
      userId,
      userRoleName: roleName,
    })
  }

  @Post('start')
  @ZodSerializerDto(StartQuizResDTO)
  start(@Body() body: StartQuizBodyDTO, @ActiveUser('userId') userId: string) {
    return this.quizService.startQuiz({
      data: body,
      studentId: userId,
    })
  }

  @Post('submit')
  @ZodSerializerDto(SubmitQuizResDTO)
  submit(@Body() body: SubmitQuizBodyDTO, @ActiveUser('userId') userId: string) {
    return this.quizService.submitQuiz({
      data: body,
      studentId: userId,
    })
  }

  @Put(':quizId')
  @ZodSerializerDto(UpdateQuizzResDTO)
  update(
    @Param() params: GetQuizParamsDTO,
    @Body() body: UpdateQuizBodyDTO,
    @ActiveUser('userId') userId: string,
    @ActiveRolePermissions('name') roleName: string,
  ) {
    return this.quizService.update({
      id: params.quizId,
      data: body,
      userId,
      userRoleName: roleName,
    })
  }

  @Delete(':quizId')
  @ZodSerializerDto(MessageResDTO)
  delete(
    @Param() params: GetQuizParamsDTO,
    @ActiveUser('userId') userId: string,
    @ActiveRolePermissions('name') roleName: string,
  ) {
    return this.quizService.delete({
      id: params.quizId,
      userId,
      userRoleName: roleName,
    })
  }
}
