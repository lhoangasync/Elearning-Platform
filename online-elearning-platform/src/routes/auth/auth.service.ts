import { HttpException, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common'
import { generateOTP, isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helper'
import { HashingService } from 'src/shared/services/hashing.service'
import { TokenService } from 'src/shared/services/token.service'
import {
  DisableTwoFactorBodyType,
  ForgotPasswordBodyType,
  LoginBodyType,
  RefreshTokenBodyType,
  RegisterBodyType,
  SendOTPBodyType,
} from './auth.model'
import { AuthRepository } from './auth.repository'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { addMilliseconds } from 'date-fns'
import ms from 'ms'
import envConfig from 'src/shared/config'
import { TypeOfVerificationCode, TypeOfVerificationCodeType } from 'src/shared/constants/auth.constant'
import { EmailService } from 'src/shared/services/email.service'
import { AccessTokenPayloadCreate } from 'src/shared/types/jwt.type'
import {
  EmailExistedException,
  EmailNotFoundException,
  ExpiredOTPException,
  InvalidOTPException,
  InvalidTOTPAndCodeException,
  InvalidTOTPException,
  SendOTPFailedException,
  TOTPAlreadyEnabledException,
  TOTPNotEnabledException,
} from './error.model'
import { TwoFactorAuthService } from 'src/shared/services/2fa.service'
import { SharedRoleRepository } from 'src/shared/repositories/shared-role-repo'

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly authRepository: AuthRepository,
    private readonly sharedRoleRepository: SharedRoleRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
    private readonly twoFactorService: TwoFactorAuthService,
  ) {}

  async validateVerificationCode({
    email,
    code,
    type,
  }: {
    email: string
    code: string
    type: TypeOfVerificationCodeType
  }) {
    const verificationCode = await this.authRepository.findUniqueVerficationCode({
      email_type: {
        email,
        type,
      },
    })

    if (verificationCode?.code !== code) {
      throw InvalidOTPException
    }

    if (!verificationCode) {
      throw InvalidOTPException
    }
    if (verificationCode.expiresAt < new Date()) {
      throw ExpiredOTPException
    }
    return verificationCode
  }

  async login(body: LoginBodyType & { userAgent: string; ip: string }) {
    // lay thong tin user, kiem tra user co ton tai hay khong
    const user = await this.authRepository.findUniqueUserIncludeRole({
      email: body.email,
    })

    if (!user) {
      throw new UnprocessableEntityException([
        {
          message: 'Email is not registered',
          path: 'code',
        },
      ])
    }

    const isPasswordMatch = await this.hashingService.compare(body.password, user.password)
    if (!isPasswordMatch) {
      throw new UnprocessableEntityException([
        {
          field: 'password',
          error: 'Password is incorrect',
        },
      ])
    }

    // neu user da bat ma 2fa -> kiem tra ma 2fa totp code hoac otp code(email)
    if (user.totpSecret) {
      // neu khong co ma totp code va code thi bao loi
      if (!body.totpCode && !body.code) {
        throw InvalidTOTPAndCodeException
      }

      // kiem tra totp code co hop le khong
      if (body.totpCode) {
        const isTOTPCodeValid = this.twoFactorService.verifyTOTP({
          email: user.email,
          secret: user.totpSecret,
          token: body.totpCode,
        })
        if (!isTOTPCodeValid) {
          throw InvalidTOTPException
        } else if (body.code) {
          // kiem tra otp co hop le khong
          await this.validateVerificationCode({
            email: user.email,
            code: body.code,
            type: TypeOfVerificationCode.LOGIN,
          })
        }
      }
    }

    // tao moi device
    const device = await this.authRepository.createDevice({
      userId: user.id,
      userAgent: body.userAgent,
      ip: body.ip,
    })

    // tao moi access token va refresh token
    const tokens = await this.genereateTokens({
      userId: user.id,
      deviceId: device.id,
      roleId: user.roleId,
      roleName: user.role.name,
    })
    return tokens
  }

  async genereateTokens({ userId, deviceId, roleId, roleName }: AccessTokenPayloadCreate) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({
        userId,
        deviceId,
        roleId,
        roleName,
      }),
      this.tokenService.signRefreshToken({ userId }),
    ])
    const decodedRefreshToken = this.tokenService.verifyRefreshToken(refreshToken)
    await this.authRepository.createRefreshToken({
      token: refreshToken,
      userId,
      expiresAt: new Date((await decodedRefreshToken).exp * 1000),
      deviceId: deviceId,
    })
    return { accessToken, refreshToken }
  }

  async register(body: RegisterBodyType) {
    try {
      await this.validateVerificationCode({
        email: body.email,
        code: body.code,
        type: TypeOfVerificationCode.REGISTER,
      })

      const clientRoleId = await this.sharedRoleRepository.getClientRoleId()
      const hashedPassword = await this.hashingService.hash(body.password)

      const [user] = await Promise.all([
        this.authRepository.createUser({
          email: body.email,
          fullName: body.fullName,
          phoneNumber: body.phoneNumber,
          password: hashedPassword,
          roleId: clientRoleId,
        }),
        this.authRepository.deleteVerificationCode({
          email_type: {
            email: body.email,
            type: TypeOfVerificationCode.REGISTER,
          },
        }),
      ])
      return user
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw EmailExistedException
      }
      throw error
    }
  }

  async sendOTP(body: SendOTPBodyType) {
    const user = await this.sharedUserRepository.findUnique({
      email: body.email,
    })

    if (body.type === TypeOfVerificationCode.REGISTER && user) {
      throw EmailExistedException
    }

    if (body.type === TypeOfVerificationCode.FORGOT_PASSWORD && !user) {
      throw EmailNotFoundException
    }

    // 2. generate OTP
    const code = generateOTP()
    await this.authRepository.createVerficationCode({
      email: body.email,
      code,
      type: body.type,
      expiresAt: addMilliseconds(new Date(), ms(envConfig.OTP_EXPIRES_IN)),
    })

    // 3. send otp
    const { error } = await this.emailService.sendOTP({
      email: body.email,
      code,
    })
    if (error) {
      throw SendOTPFailedException
    }
    return { message: 'OTP is sending!' }
  }

  async refreshToken({ refreshToken, userAgent, ip }: RefreshTokenBodyType & { userAgent: string; ip: string }) {
    try {
      const { userId } = await this.tokenService.verifyRefreshToken(refreshToken)

      // kiem tra refresh token co trong db khong
      const refreshTokenDB = await this.authRepository.findUniqueRefreshTokenIncludeUserRole({
        token: refreshToken,
      })

      if (!refreshTokenDB) {
        throw new UnauthorizedException('Refresh token is already used')
      }

      const {
        deviceId,
        user: {
          roleId,
          role: { name: roleName },
        },
      } = refreshTokenDB
      // cap nhat device
      const $updateDevice = this.authRepository.updateDevice(deviceId, {
        userAgent,
        ip,
      })

      // xoa refresh token cu
      const $deletedRefreshToken = this.authRepository.deleteRefreshToken({
        token: refreshToken,
      })

      // tao moi accesstoken va refreshtoken
      const $tokens = this.genereateTokens({ userId, deviceId, roleId, roleName })

      const [_, __, tokens] = await Promise.all([$updateDevice, $deletedRefreshToken, $tokens])

      return tokens
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new UnauthorizedException()
    }
  }

  async me({ id }: { id: string }) {
    const user = await this.authRepository.findUniqueUserIncludeRole({
      id,
    })

    if (!user) {
      throw EmailNotFoundException
    }
    return user
  }

  async logout(refreshToken: string) {
    try {
      // kiem tra refresh token co hop le khong
      await this.tokenService.verifyRefreshToken(refreshToken)

      // xoa refresh token khoi db
      const deletedRefreshToken = await this.authRepository.deleteRefreshToken({ token: refreshToken })

      // cap nhat device la da logout
      await this.authRepository.updateDevice(deletedRefreshToken.deviceId, {
        isActive: false,
      })

      return { message: 'Logout successfully!' }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException('Refresh token is not found')
      }
      throw new UnauthorizedException()
    }
  }

  async forgotPassword(body: ForgotPasswordBodyType) {
    const { email, newPassword, code } = body
    // kiem tra email co trong db khong
    const user = await this.sharedUserRepository.findUnique({ email })

    if (!user) {
      throw EmailNotFoundException
    }

    // kiem tra ma otp co hop le khong
    await this.validateVerificationCode({
      email,
      code,
      type: TypeOfVerificationCode.FORGOT_PASSWORD,
    })

    // cap nhat lai mat khau moi va xoa OTP
    const hashedPassword = await this.hashingService.hash(newPassword)
    await Promise.all([
      this.sharedUserRepository.update(
        { id: user.id },
        {
          password: hashedPassword,
          updatedById: user.id,
        },
      ),
      this.authRepository.deleteVerificationCode({
        email_type: {
          email: body.email,
          type: TypeOfVerificationCode.FORGOT_PASSWORD,
        },
      }),
    ])

    return { message: 'Change password successfully!' }
  }

  async setupTwoFactorAuth(userId: string) {
    // lay thong tin user, kiem tra user co ton tai kh va xem ho bat 2fa chua
    const user = await this.sharedUserRepository.findUnique({ id: userId })
    if (!user) {
      throw EmailNotFoundException
    }

    if (user.totpSecret) {
      throw TOTPAlreadyEnabledException
    }

    // tao ra secret va uri
    const { secret, uri } = this.twoFactorService.generateTOTPSecret(user.email)
    // cap nhat secret vao user trong db
    await this.sharedUserRepository.update({ id: userId }, { totpSecret: secret, updatedById: userId })
    // tra ve secret va uri
    return { secret, uri }
  }

  async disableTwoFactorAuth(data: DisableTwoFactorBodyType & { userId: string }) {
    const { userId, totpCode, code } = data

    // lay thong tin user, kiem tra user co ton tai khong va xem ho bat 2fa chua
    const user = await this.sharedUserRepository.findUnique({ id: userId })
    if (!user) {
      throw EmailNotFoundException
    }

    if (!user.totpSecret) {
      throw TOTPNotEnabledException
    }

    // kiem tra ma totp co hop le hay khong
    if (totpCode) {
      const isTOTPCodeValid = this.twoFactorService.verifyTOTP({
        email: user.email,
        secret: user.totpSecret,
        token: totpCode,
      })
      if (!isTOTPCodeValid) {
        throw InvalidTOTPException
      }
    } else if (code) {
      // kiem tra otp co hop le khong
      await this.validateVerificationCode({
        email: user.email,
        code,
        type: TypeOfVerificationCode.DISABLE_2FA,
      })
    }
    // xoa totp secret khoi user
    await this.sharedUserRepository.update({ id: userId }, { totpSecret: null, updatedById: userId })

    // xoa code otp khoi db neu co
    if (code) {
      await this.authRepository.deleteVerificationCode({
        email_type: {
          email: user.email,
          type: TypeOfVerificationCode.DISABLE_2FA,
        },
      })
    }
    return { message: 'Disable two factor authentication successfully!' }
  }
}
