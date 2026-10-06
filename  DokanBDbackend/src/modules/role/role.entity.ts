import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "roles" })
export class Role {
  @PrimaryGeneratedColumn({
    type: "bigint",
    unsigned: true,
  })
  id!: string;

  @Column({
    type: "varchar",
    length: 50,
  })
  name!: string;

  @Column({
    type: "varchar",
    length: 50,
    unique: true,
  })
  code!: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  description!: string | null;

  @CreateDateColumn({
    name: "created_at",
    type: "datetime",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "datetime",
  })
  updatedAt!: Date;
}