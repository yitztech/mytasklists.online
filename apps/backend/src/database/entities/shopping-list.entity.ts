import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ListMember } from './list-member.entity';
import { ListItem } from './list-item.entity';

export enum ListType {
  NORMAL = 'normal',
  ADVANCED = 'advanced',
}

const nullableNumericTransformer = {
  to: (value: number | null | undefined) => value ?? null,
  from: (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    return parseFloat(String(value));
  },
};

@Entity('shopping_lists')
export class ShoppingList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 400, nullable: true })
  description: string | null;

  /** Color de acento de la lista en la interfaz (#RRGGBB) */
  @Column({ length: 9, default: '#0d6efd' })
  color: string;

  @Column({ length: 8, default: '\u{1F6D2}' })
  icon: string;

  @Column({ name: 'list_type', type: 'varchar', length: 16, default: ListType.NORMAL })
  listType: ListType;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    default: null,
    transformer: nullableNumericTransformer,
  })
  budget: number | null;

  @Column({ length: 3, default: 'MXN' })
  currency: string;

  @Column({ name: 'auto_sort_aisles', default: true })
  autoSortAisles: boolean;

  @Index()
  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, (user) => user.ownedLists, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'is_archived', default: false })
  isArchived: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => ListMember, (member) => member.list, { cascade: true })
  members: ListMember[];

  @OneToMany(() => ListItem, (item) => item.list, { cascade: true })
  items: ListItem[];
}
