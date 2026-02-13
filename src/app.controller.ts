import { Controller, Get } from '@nestjs/common';
import { HealthResponse } from './common/interfaces/health-response.interface';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  public getHealth(): HealthResponse {
    return this.appService.getHealth();
  }
}
