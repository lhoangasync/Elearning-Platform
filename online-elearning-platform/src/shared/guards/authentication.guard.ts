import { CanActivate, ExecutionContext, HttpException, Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthType, ConditionGuard } from '../constants/auth.constant'
import { Reflector } from '@nestjs/core'
import { APIKeyGuard } from './api-key.guard'
import { AccessTokenGuard } from './access-token.guard'
import { AUTH_TYPE_KEY, AuthTypeDecoratorPayload } from '../decorators/auth.decorator'

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private readonly authTypeGuardMap: Record<string, CanActivate>
  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokenGuard: AccessTokenGuard,
    private readonly apiKeyGuard: APIKeyGuard,
  ) {
    this.authTypeGuardMap = {
      [AuthType.Bearer]: this.accessTokenGuard,
      [AuthType.APIKey]: this.apiKeyGuard,
      [AuthType.None]: { canActivate: () => true },
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authTypeValue = this.getAuthTypeValue(context)
    const guards = authTypeValue.authTypes.map((authType) => this.authTypeGuardMap[authType])

    return authTypeValue.options.condition === ConditionGuard.And
      ? this.handleAndCondition(guards, context)
      : this.handleOrCondition(guards, context)
  }

  private getAuthTypeValue(context: ExecutionContext): AuthTypeDecoratorPayload {
    const authTypeValue = this.reflector.getAllAndOverride<AuthTypeDecoratorPayload | undefined>(AUTH_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? { authTypes: [AuthType.Bearer], options: { condition: ConditionGuard.And } }
    return authTypeValue
  }

  private async handleOrCondition(guards: CanActivate[], context: ExecutionContext) {
    let lastError: any = null
    // duyet qua cac guard neu co 1 guard pass thi return true
    for (const guard of guards) {
      try {
        if (await guard.canActivate(context)) return true
      } catch (error) {
        lastError = error
      }
    }

    if (lastError instanceof HttpException) {
      throw lastError
    }
    throw new UnauthorizedException()
  }

  private async handleAndCondition(guards: CanActivate[], context: ExecutionContext) {
    // duyet qua cac guard neu moi guard deu pass thi return true
    for (const guard of guards) {
      try {
        if (!(await guard.canActivate(context))) throw new UnauthorizedException()
      } catch (error) {
        if (error instanceof HttpException) throw error

        throw new UnauthorizedException()
      }
    }

    return true
  }
}
