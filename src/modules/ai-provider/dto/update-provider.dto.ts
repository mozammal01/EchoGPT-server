import { PartialType } from '@nestjs/swagger';
import { CreateAIProviderDto } from './create-provider.dto';

export class UpdateAIProviderDto extends PartialType(CreateAIProviderDto) {}
