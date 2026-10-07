import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { User } from "../users/user.entity.js";

export enum AuthTokenType {
  EmailVerification = "EMAIL_VERIFICATION",
  PasswordReset = "PASSWORD_RESET",
}

@Entity({ name: "auth_tokens" })
@Index("IDX_auth_tokens_user_type", ["userId", "type"])
export class AuthToken {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  userId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "varchar", length: 30 })
  type!: AuthTokenType;

  @Index("IDX_auth_tokens_hash", { unique: true })
  @Column({ name: "token_hash", type: "char", length: 64 })
  tokenHash!: string;

  @Column({ name: "expires_at", type: "datetime" })
  expiresAt!: Date;

  @Column({ name: "used_at", type: "datetime", nullable: true })
  usedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
