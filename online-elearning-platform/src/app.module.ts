import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { SharedModule } from './shared/share.module'
import { AuthModule } from './routes/auth/auth.module'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { ZodSerializerInterceptor } from 'nestjs-zod'
import CustomZodValidationPipe from './shared/pipes/custom-zod-validation.pipe'
import { HttpExceptionFilter } from './shared/filters/http-exception.filter'
import { PermissionModule } from './routes/permission/permission.module'
import { RoleModule } from './routes/role/role.module'

@Module({
  imports: [SharedModule, AuthModule, PermissionModule, RoleModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: CustomZodValidationPipe,
    },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
