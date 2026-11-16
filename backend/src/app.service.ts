import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'INFOUAQ API REST',
      version: '1.0.0',
      institution: 'Facultad de Informática - UAQ',
      timestamp: new Date().toISOString(),
    };
  }
}
