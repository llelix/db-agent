import { NextRequest, NextResponse } from 'next/server';
import { DatabaseAgent } from '../../../../lib/agent/database-agent';
import { auth, createTestSession } from '../../../../lib/auth';
import { db } from '../../../../lib/database/client';
import { queryHistory } from '../../../../db/schema';
import { sql, eq, and } from 'drizzle-orm';

/**
 * POST /api/query
 * 执行数据库查询
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 认证验证
    const session = await auth();

    // 开发环境: 允许测试
    let sessionData = session;
    if (!sessionData && process.env.NODE_ENV === 'development') {
      // 可选: 允许 API Key 认证
      const apiKey = request.headers.get('x-api-key');
      if (apiKey === process.env.TEST_API_KEY) {
        // 创建临时会话
        sessionData = await createTestSession();
      } else {
        return NextResponse.json(
          { error: '未授权 - 需要登录或 API Key' },
          { status: 401 }
        );
      }
    }

    if (!sessionData?.user?.id) {
      return NextResponse.json(
        { error: '未授权 - 需要登录' },
        { status: 401 }
      );
    }

    // 2. 解析请求体
    const body = await request.json();
    const { query } = body;

    // 3. 验证请求
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: '无效的请求 - 缺少 query 参数' },
        { status: 400 }
      );
    }

    if (query.trim().length === 0 || query.trim().length > 500) {
      return NextResponse.json(
        { error: '查询内容无效 (长度限制: 1-500 字符)' },
        { status: 400 }
      );
    }

    // 4. 执行查询
    const agent = new DatabaseAgent();
    const startTime = Date.now();

    const result = await agent.executeQuery(query);
    const executionTime = Date.now() - startTime;

    // 5. 保存历史记录
    await db.insert(queryHistory).values({
      userId: sessionData.user.id,
      naturalLanguageQuery: query,
      generatedSql: result.sql || null,
      result: result.data || null,
      reactTrace: result.steps,
      executionTimeMs: executionTime,
      status: result.sql ? 'completed' : 'no_sql',
    });

    // 6. 返回结果
    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('API Error:', error);

    return NextResponse.json(
      {
        error: '服务器内部错误',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/query
 * 获取查询历史
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 获取历史记录
    const history = await db.query.queryHistory.findMany({
      where: (table, { eq }) => eq(table.userId, session.user.id),
      orderBy: (table, { desc }) => desc(table.createdAt),
      limit,
      offset: (page - 1) * limit,
    });

    // 获取总数
    const totalResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM query_history WHERE user_id = ${session.user.id}`
    );
    const total = Number(totalResult[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/query/:id
 * 删除查询记录
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    const { id } = params;

    // 验证权限并删除
    const result = await db.delete(queryHistory)
      .where(
        and(
          eq(queryHistory.id, id),
          eq(queryHistory.userId, session.user.id)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: '记录不存在或无权限' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '删除成功',
    });

  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
