import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/database/client';
import { users } from '@db/schema';
import bcrypt from 'bcryptjs';
import type { NextAuthResult, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { eq } from 'drizzle-orm';

/**
 * NextAuth v5 配置
 * 使用 Drizzle ORM 适配器和 Credentials 提供商
 */
const nextAuthResult = NextAuth({
  // 使用 Drizzle 适配器连接数据库
  adapter: DrizzleAdapter(db),

  // 会话策略：使用 JWT
  session: {
    strategy: 'jwt',
  },

  // 页面自定义
  pages: {
    signIn: '/login', // 自定义登录页面路径
  },

  // 提供商配置
  providers: [
    // Credentials 提供商（邮箱密码登录）
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: '邮箱', type: 'email' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // 查找用户
        const user = await db.query.users.findFirst({
          where: (table, { eq }) => eq(table.email, email),
        });

        if (!user) {
          // 开发环境：自动创建用户（用于测试）
          if (process.env.NODE_ENV === 'development') {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await db.insert(users).values({
              email,
              name: email.split('@')[0],
              password: hashedPassword,
            }).returning();

            return {
              id: newUser[0].id,
              email: newUser[0].email,
              name: newUser[0].name,
            };
          }
          return null;
        }

        // 验证密码
        if (user.password) {
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            return null;
          }
        } else {
          // 如果没有密码（OAuth 用户），开发环境允许登录
          if (process.env.NODE_ENV === 'development') {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            };
          }
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],

  // 回调配置
  callbacks: {
    // JWT 回调：在 token 创建时添加自定义信息
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? '';
        token.email = user.email ?? '';
      }
      return token as JWT;
    },

    // Session 回调：在 session 创建时添加用户信息
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? '';
        session.user.email = (token.email as string) ?? '';
      }
      return session;
    },
  },

  // 事件处理（可选）
  events: {
    async createUser({ user }) {
      // 用户创建后的额外处理
      console.log('新用户创建:', user.email);
    },
  },

  // 启用调试（开发环境）
  debug: process.env.NODE_ENV === 'development',
}) as NextAuthResult;

export const handlers = nextAuthResult.handlers;
export const auth = nextAuthResult.auth;
export const signIn = nextAuthResult.signIn;
export const signOut = nextAuthResult.signOut;
export const GET = handlers.GET;
export const POST = handlers.POST;
