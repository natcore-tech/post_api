import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): any {
    return {
      service: 'posts-api service',
      message: 'Onlineapp.service.ts',
    };
  }
}
