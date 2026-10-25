import type {
  CreateItemRequest,
  ReceiptApplyMatchInput,
  ReceiptApplyRequest,
  ReceiptScanRequest,
  ReorderItemsRequest,
  SmartEntryRequest,
  UpdateItemRequest,
} from '@lista/contracts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class CreateItemDto implements CreateItemRequest {
  @ApiProperty({ example: 'Pan de caja' })
  @IsString()
  @Length(1, 140)
  name: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99999)
  quantity?: number;

  @ApiPropertyOptional({ example: 'pza' })
  @IsOptional()
  @IsString()
  @Transform(({value}) => typeof value === 'string' ? value.trim() : value)
  @Length(1, 20)
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 300)
  note?: string;

  @ApiPropertyOptional({ example: 'panaderia' })
  @IsOptional()
  @IsString()
  @Length(1, 40)
  category?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Si es true el producto se vuelve a activar solo cada `recurrenceDays` días',
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ example: 14, minimum: 1, maximum: 365 })
  @ValidateIf((dto: CreateItemDto) => dto.isRecurring === true)
  @Type(() => Number)
  @IsInt({ message: 'Los días de recurrencia deben ser un número entero' })
  @Min(1, { message: 'La recurrencia mínima es de 1 día' })
  @Max(365, { message: 'La recurrencia máxima es de 365 días' })
  recurrenceDays?: number;

  @ApiPropertyOptional({ example: 35.5 })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999.99)
  estimatedPrice?: number | null;

  @ApiPropertyOptional({ example: 35.5 })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999.99)
  lastPaidPrice?: number | null;

  @ApiPropertyOptional({ example: 'Costco' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @Length(0, 80)
  storeName?: string | null;
}

export class UpdateItemDto implements UpdateItemRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 140)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99999)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({value}) => typeof value === 'string' ? value.trim() : value)
  @Length(1, 20)
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 300)
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 40)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 365 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  recurrenceDays?: number | null;

  @ApiPropertyOptional({ example: 35.5 })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999.99)
  estimatedPrice?: number | null;

  @ApiPropertyOptional({ example: 35.5 })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999.99)
  lastPaidPrice?: number | null;

  @ApiPropertyOptional({ example: 'Walmart' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @Length(0, 80)
  storeName?: string | null;
}

export class ReorderItemsDto implements ReorderItemsRequest {
  @ApiProperty({ type: [String], description: 'Ids de los productos en el orden deseado' })
  @IsArray()
  @IsUUID('4', { each: true })
  itemIds: string[];
}

export class SmartEntryDto implements SmartEntryRequest {
  @ApiProperty({ example: '2 kg de tomate a $35, 1 leche y jabón cada 15 días' })
  @IsString()
  @Length(1, 2000)
  text: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoCreate?: boolean;
}

export class ReceiptScanDto implements ReceiptScanRequest {
  @ApiProperty({ example: 'LECHE DESLACTOSADA 1L 28.50\nTOMATE SALADET 2KG 35.00' })
  @IsString()
  @Length(1, 8000)
  receiptText: string;
}

export class ReceiptApplyMatchDto implements ReceiptApplyMatchInput {
  @ApiProperty()
  @IsUUID('4')
  itemId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999.99)
  paidPrice?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  suggestedRecurrenceDays?: number | null;
}

export class ReceiptApplyDto implements ReceiptApplyRequest {
  @ApiProperty({ type: [ReceiptApplyMatchDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiptApplyMatchDto)
  matches: ReceiptApplyMatchDto[];
}
