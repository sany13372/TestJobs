import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Post()
  create(@Body() body: CreateJobDto) {
    return this.jobs.create(body.urls);
  }

  @Get()
  list() {
    return this.jobs.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.jobs.get(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancel(@Param('id') id: string) {
    this.jobs.cancel(id);
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.NO_CONTENT)
  pause(@Param('id') id: string) {
    this.jobs.pause(id);
  }
}
