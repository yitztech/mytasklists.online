import type {
  CreateListRequest,
  ShareListRequest,
  UpdateListRequest,
  UpdateMemberRequest,
} from '@lista/contracts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsHexColor,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ListType, MemberRole } from '../../../database/entities';

export class CreateListDto implements CreateListRequest {
  @ApiProperty({ example: 'Despensa quincenal' })
  @IsString()
  @Length(2, 120)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 400)
  description?: string;

  @ApiPropertyOptional({ example: '#0d6efd' })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({ example: '\u{1F6D2}' })
  @IsOptional()
  @IsString()
  @Length(1, 8)
  icon?: string;

  @ApiPropertyOptional({ enum: ListType, default: ListType.NORMAL })
  @IsOptional()
  @IsIn([ListType.NORMAL, ListType.ADVANCED])
  listType?: ListType;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999.99)
  budget?: number | null;

  @ApiPropertyOptional({ example: 'MXN', default: 'MXN' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoSortAisles?: boolean;
}

export class UpdateListDto implements UpdateListRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 400)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 8)
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @ApiPropertyOptional({ enum: ListType })
  @IsOptional()
  @IsIn([ListType.NORMAL, ListType.ADVANCED])
  listType?: ListType;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999.99)
  budget?: number | null;

  @ApiPropertyOptional({ example: 'MXN' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoSortAisles?: boolean;
}

export class ShareListDto implements ShareListRequest {
  @ApiPropertyOptional({ description: 'Correo de la persona con la que se comparte' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @MaxLength(180)
  email?: string;

  @ApiPropertyOptional({ description: 'Alternativa: id del usuario' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ enum: MemberRole, default: MemberRole.EDITOR })
  @IsOptional()
  @IsEnum(MemberRole)
  role?: MemberRole;
}

export class UpdateMemberDto implements UpdateMemberRequest {
  @ApiPropertyOptional({ description: 'Recibir aviso cuando otra persona modifica la lista' })
  @IsOptional()
  @IsBoolean()
  notifyOnChange?: boolean;

  @ApiPropertyOptional({ enum: MemberRole })
  @IsOptional()
  @IsEnum(MemberRole)
  role?: MemberRole;
}
