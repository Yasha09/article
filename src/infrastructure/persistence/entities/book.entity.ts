import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Author } from './author.entity';
import { Category } from './category.entity';
import { User } from './user.entity';

@Entity({ name: 'books' })
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  summary: string;

  @Index()
  @Column({ type: 'timestamp with time zone', name: 'published_at' })
  publishedAt: Date;

  @Column({ type: 'varchar', name: 'cover_image_path', nullable: true })
  coverImagePath: string | null;

  @Column({ type: 'varchar', name: 'book_file_path', nullable: true })
  bookFilePath: string | null;

  @ManyToOne(() => Author, (author) => author.books, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'author_id' })
  author: Author;

  @ManyToOne(() => User, (user) => user.createdBooks, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: User;

  @ManyToMany(() => Category, (category) => category.books)
  @JoinTable({
    name: 'books_categories',
    joinColumn: { name: 'book_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: Category[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
