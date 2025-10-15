import { create } from 'domain'
import { url } from 'inspector'
import { TypeOfVerificationCode, UserStatus } from 'src/shared/constants/auth.constant'
import { UserSchema } from 'src/shared/models/shared-user.model'
import { z } from 'zod'

export const RegisterBodySchema = UserSchema.pick({
  email: true,
  password: true,
  fullName: true,
  phoneNumber: true,
})
  .extend({
    confirmPassword: z.string().min(6).max(100),
    code: z.string().length(6),
  })
  .strict()
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'Password and confirm password must match',
        path: ['confirmPassword'],
      })
    }
  })

export const RegisterResSchema = UserSchema.omit({
  password: true,
  totpSecret: true,
})

export const VerificationCodeSchema = z.object({
  id: z.string(),
  email: z.email(),
  code: z.string().length(6),
  type: z.enum([
    TypeOfVerificationCode.REGISTER,
    TypeOfVerificationCode.FORGOT_PASSWORD,
    TypeOfVerificationCode.LOGIN,
    TypeOfVerificationCode.DISABLE_2FA,
  ]),
  expiresAt: z.date(),
  createdAt: z.date(),
})

export const SendOTPBodySchema = VerificationCodeSchema.pick({
  email: true,
  type: true,
}).strict()

export const LoginBodySchema = UserSchema.pick({
  email: true,
  password: true,
})
  .extend({
    totpCode: z.string().length(6).optional(), // 2FA code
    code: z.string().length(6).optional(), // Email OTP code
  })
  .strict()
  .superRefine(({ totpCode, code }, ctx) => {
    // neu ma truyen ca hai thi tra ve issue
    if (totpCode !== undefined && code !== undefined) {
      ;(ctx.addIssue({
        message: "You must provide either 'totpCode' or 'code'. Cannot be both.",
        code: 'custom',
        path: ['code'],
      }),
        ctx.addIssue({
          message: "You must provide either 'totpCode' or 'code'. Cannot be both.",
          code: 'custom',
          path: ['totpCode'],
        }))
    }
  })

export const LoginResSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  // user: UserSchema.omit({ password: true, totpSecret: true }),
})

export const RefreshTokenBodySchema = z
  .object({
    refreshToken: z.string(),
  })
  .strict()

export const RefreshTokenResSchema = LoginResSchema

export const DeviceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userAgent: z.string(),
  ip: z.string(),
  lastActive: z.date(),
  createdAt: z.date(),
  isActive: z.boolean(),
})

export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdById: z.string().nullable(),
  updatedById: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
})

export const RefreshTokenSchema = z.object({
  id: z.string(),
  token: z.string(),
  userId: z.string(),
  deviceId: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
})

export const LogoutBodySchema = RefreshTokenBodySchema

export const GoogleAuthStateSchema = DeviceSchema.pick({
  userAgent: true,
  ip: true,
})

export const GetAuthorizationUrlResSchema = z.object({
  url: z.url(),
})

export const ForgotPasswordBodySchema = z
  .object({
    email: z.email(),
    code: z.string().length(6),
    newPassword: z.string().min(6).max(100),
    confirmNewPassword: z.string().min(6).max(100),
  })
  .strict()
  .superRefine(({ newPassword, confirmNewPassword }, ctx) => {
    if (newPassword !== confirmNewPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'New password and confirm new password must match',
        path: ['confirmNewPassword'],
      })
    }
  })

export const DisableTwoFactorBodySchema = z
  .object({
    totpCode: z.string().length(6).optional(),
    code: z.string().length(6).optional(),
  })
  .strict()
  .superRefine(({ totpCode, code }, ctx) => {
    const message = "You must provide either 'totpCode' or 'code'. Cannot be both."
    if ((totpCode !== undefined) === (code !== undefined)) {
      ctx.addIssue({
        code: 'custom',
        message,
        path: ['totpCode'],
      })
      ctx.addIssue({
        code: 'custom',
        message,
        path: ['code'],
      })
    }
  })

export const TwoFactorSetupResSchema = z.object({
  secret: z.string(),
  uri: z.string(),
})

export const UserProfileResSchema = UserSchema.omit({
  password: true,
  totpSecret: true,
}).extend({
  role: RoleSchema,
})

export type RegisterBodyType = z.infer<typeof RegisterBodySchema>
export type RegisterResType = z.infer<typeof RegisterResSchema>
export type VerificationCodeType = z.infer<typeof VerificationCodeSchema>
export type SendOTPBodyType = z.infer<typeof SendOTPBodySchema>
export type LoginBodyType = z.infer<typeof LoginBodySchema>
export type LoginResType = z.infer<typeof LoginResSchema>
export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>
export type RefreshTokenBodyType = z.infer<typeof RefreshTokenBodySchema>
export type RefreshTokenResType = LoginResType
export type DeviceType = z.infer<typeof DeviceSchema>
export type RoleType = z.infer<typeof RoleSchema>
export type LogoutBodyType = RefreshTokenBodyType
export type GoogleAuthStateType = z.infer<typeof GoogleAuthStateSchema>
export type GetAuthorizationUrlResType = z.infer<typeof GetAuthorizationUrlResSchema>
export type ForgotPasswordBodyType = z.infer<typeof ForgotPasswordBodySchema>
export type DisableTwoFactorBodyType = z.infer<typeof DisableTwoFactorBodySchema>
export type TwoFactorSetupResType = z.infer<typeof TwoFactorSetupResSchema>
export type UserProfileResType = z.infer<typeof UserProfileResSchema>
