import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendMailDto {
  @IsEmail()
  to: string;

  @IsNotEmpty()
  subject: string;

  @IsNotEmpty()
  message: string;
}
