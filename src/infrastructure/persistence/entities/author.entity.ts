import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Book } from './book.entity';
import { User } from './user.entity';

@Entity({ name: 'authors' })
export class Author {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'varchar', name: 'avatar_image_path', nullable: true })
  avatarImagePath: string | null;

  @ManyToOne(() => User, (user) => user.createdAuthors, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: User;

  @OneToMany(() => Book, (book) => book.author)
  books: Book[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
