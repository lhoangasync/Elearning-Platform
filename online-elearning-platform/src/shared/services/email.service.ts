import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import envConfig from '../config'

@Injectable()
export class EmailService {
  private resend: Resend
  constructor() {
    this.resend = new Resend(envConfig.RESEND_API_KEY)
  }

  async sendOTP(payload: { email: string; code: string }) {
    return await this.resend.emails.send({
      from: 'TDTU <onboarding@resend.dev>',
      to: [payload.email], // vatcvietmy123456@gmail.com
      subject: 'OTP Code',
      html: `<strong>${payload.code}</strong>`,
    })
  }
}
