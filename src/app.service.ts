import { Injectable } from '@nestjs/common';
import { HealthResponse } from './common/interfaces/health-response.interface';

@Injectable()
export class AppService {
  public getHealth(): HealthResponse {
    return { status: 'ok' };
  }
}
