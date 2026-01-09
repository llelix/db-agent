'use server';

import { DatabaseAgent } from '../../../lib/agent/database-agent';
import { db } from '../../../lib/database/client';
import { queryHistory } from '../../../db/schema';
import { auth } from '@/lib/auth';
import { eq, and, desc, sql } from 'drizzle-orm';

export interface QueryActionResult {
  data?: {
    result: string;
    steps: any[];
    sql?: string;
    data?: any[];
    usage?: { input: number; output: number };
  };
  error?: string;
}

/**
 * 执行查询并保存历史记录
 */
export async function executeQueryAction(
  formData: FormData
): Promise<QueryActionResult> {
  // 获取用户会话
  const session = await auth();

  if (!session?.user?.id) {
    return { error: '未登录或会话已过期' };
  }

  // 获取查询内容
  const query = formData.get('query') as string;

  if (!query || query.trim().length === 0) {
    return { error: '查询内容不能为空' };
  }

  if (query.trim().length > 500) {
    return { error: '查询内容过长 (最大 500 字符)' };
  }

  try {
    // 创建智能体实例
    const agent = new DatabaseAgent();
    const startTime = Date.now();

    // 执行查询
    const result = await agent.executeQuery(query);

    const executionTime = Date.now() - startTime;

    // 保存到历史记录
    await db.insert(queryHistory).values({
      userId: session.user.id,
      naturalLanguageQuery: query,
      generatedSql: result.sql || null,
      result: result.data || null,
      reactTrace: result.steps,
      executionTimeMs: executionTime,
      status: result.sql ? 'completed' : 'no_sql',
    });

    return { data: result };

  } catch (error) {
    console.error('Query execution error:', error);

    // 保存错误记录
    await db.insert(queryHistory).values({
      userId: session.user.id,
      naturalLanguageQuery: query,
      status: 'error',
      reactTrace: [{ thought: String(error) }],
    });

    return { error: String(error) };
  }
}

/**
 * 获取查询历史
 */
export async function getQueryHistoryAction(
  page: number = 1,
  limit: number = 20
): Promise<{
  data?: any[];
  error?: string;
  pagination?: { page: number; limit: number; total: number; pages: number };
}> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: '未登录' };
  }

  try {
    // 获取总数
    const totalResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM query_history WHERE user_id = ${session.user.id}`
    );
    const total = Number(totalResult[0]?.count || 0);

    // 获取分页数据
    const history = await db.query.queryHistory.findMany({
      where: (table, { eq }) => eq(table.userId, session.user.id),
      orderBy: (table, { desc }) => desc(table.createdAt),
      limit,
      offset: (page - 1) * limit,
    });

    return {
      data: history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    return { error: String(error) };
  }
}

/**
 * 获取单条查询详情
 */
export async function getQueryDetailAction(
  queryId: string
): Promise<{
  data?: any;
  error?: string;
}> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: '未登录' };
  }

  try {
    const query = await db.query.queryHistory.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.id, queryId),
          eq(table.userId, session.user.id)
        ),
    });

    if (!query) {
      return { error: '查询记录不存在或无权限访问' };
    }

    return { data: query };
  } catch (error) {
    return { error: String(error) };
  }
}
