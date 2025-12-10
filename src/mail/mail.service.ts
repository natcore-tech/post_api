import * as nodemailer from 'nodemailer';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SendMailDto } from './dto/send-mail.dto';
import axios from 'axios';

@Injectable()
export class MailService {
  async sendMail(dto: SendMailDto) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    try {
      const info = await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: dto.to,
        subject: dto.subject,
        html: dto.message,
      });
      return { messageId: info.messageId };
    } catch (error) {
      throw new InternalServerErrorException('No se pudo enviar el correo');
    }
  }

  async fetchUserListFromPublicApi() {
    const res = await axios.get('https://jsonplaceholder.typicode.com/users');
    return res.data;
    }

    async sendWithSendGrid(dto: SendMailDto) {
        try {
            const res = await axios.post(
            'https://api.sendgrid.com/v3/mail/send',
            {
                personalizations: [{ to: [{ email: dto.to }] }],
                from: { email: process.env.SENDGRID_SENDER },
                subject: dto.subject,
                content: [{ type: 'text/html', value: dto.message }],
            },
            {
                headers: {
                Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
                'Content-Type': 'application/json',
                },
            }
            );

            return { status: res.status };
        } catch (error) {
            throw new InternalServerErrorException('No se pudo enviar el correo con SendGrid');
        }

    }
}