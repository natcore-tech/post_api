export class SuccessResponseDto<T = any> {
  success: true;
  message: string;
  data: T;

  constructor(message: string, data: T) {
    this.success = true;
    this.message = message;
    this.data = data;
  }
}

export class ErrorResponseDto {
  success: false;
  message: string;
  statusCode: number;
  error?: any;

  constructor(message: string, statusCode = 500, error?: any) {
    this.success = false;
    this.message = message;
    this.statusCode = statusCode;
    this.error = error;
  }
}
