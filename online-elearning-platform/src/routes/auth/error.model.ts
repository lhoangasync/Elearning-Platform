import { UnprocessableEntityException } from '@nestjs/common'

export const InvalidOTPException = new UnprocessableEntityException([
  {
    message: 'OTP is invalid',
    path: 'code',
  },
])

export const ExpiredOTPException = new UnprocessableEntityException([
  {
    message: 'OTP is expired',
    path: 'code',
  },
])

export const EmailExistedException = new UnprocessableEntityException([
  {
    message: 'Email is existed!',
    path: 'email',
  },
])

export const EmailNotFoundException = new UnprocessableEntityException([
  {
    message: 'Email not found!',
    path: 'email',
  },
])

export const SendOTPFailedException = new UnprocessableEntityException([
  {
    message: 'Send OTP failed!',
    path: 'code',
  },
])

export const TOTPAlreadyEnabledException = new UnprocessableEntityException([
  {
    message: 'Two factor authentication is already enabled',
    path: 'totpCode',
  },
])

export const TOTPNotEnabledException = new UnprocessableEntityException([
  {
    message: 'Two factor authentication is not enabled',
    path: 'totpCode',
  },
])

export const InvalidTOTPAndCodeException = new UnprocessableEntityException([
  {
    message: 'Invalid verification code',
    path: 'code',
  },
  {
    message: 'Invalid TOTP code',
    path: 'totpCode',
  },
])

export const InvalidTOTPException = new UnprocessableEntityException([
  {
    message: 'Invalid TOTP code',
    path: 'totpCode',
  },
])
