import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { dbConnections, queryHistory } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { ConnectionManager } from '@/lib/database/connection-manager';

/**
 * POST /api/db/:connectionId/query
 * 执行自定义SQL查询
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  try {
    const session = await auth();
    const { connectionId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权 - 需要登录' },
        { status: 401 }
      );
    }

    // 验证连接权限
    const connection = await db.query.dbConnections.findFirst({
      where: and(
        eq(dbConnections.id, connectionId),
        eq(dbConnections.userId, session.user.id)
      ),
    });

    if (!connection) {
      return NextResponse.json(
        { error: '连接不存在或无权限' },
        { status: 404 }
      );
    }

    // 获取查询内容
    const body = await request.json();
    const { sql } = body;

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json(
        { error: '缺少SQL查询语句' },
        { status: 400 }
      );
    }

    // SQL注入防护：验证SQL语句
    const sanitizedSql = sql.trim();

    // 检查是否包含危险关键字（简单防护）
    const dangerousKeywords = [
      'DROP', 'DELETE', 'INSERT', 'UPDATE', 'CREATE', 'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE'
    ];

    // 允许SELECT和常见查询操作
    const allowedKeywords = ['SELECT', 'WITH', 'EXPLAIN', 'DESCRIBE', 'SHOW'];

    const upperSql = sanitizedSql.toUpperCase();
    const hasDangerous = dangerousKeywords.some(keyword => upperSql.includes(keyword));
    const hasAllowed = allowedKeywords.some(keyword => upperSql.includes(keyword));

    // 如果包含危险关键字且不是SELECT查询，拒绝执行
    if (hasDangerous && !hasAllowed) {
      // 记录安全事件
      await ConnectionManager.logHistory(
        session.user.id,
        connectionId,
        'security',
        { action: 'blocked_query', sql: sanitizedSql.substring(0, 100) }
      );

      return NextResponse.json(
        { error: 'SQL查询包含不允许的操作类型' },
        { status: 403 }
      );
    }

    // 限制查询长度
    if (sanitizedSql.length > 5000) {
      return NextResponse.json(
        { error: 'SQL查询过长，最大允许5000字符' },
        { status: 400 }
      );
    }

    // 执行查询
    const startTime = Date.now();
    const result = await ConnectionManager.executeQuery(connectionId, sanitizedSql);
    const executionTime = Date.now() - startTime;

    // 记录查询历史
    await db.insert(queryHistory).values({
      userId: session.user.id,
      connectionId: connectionId,
      query: sanitizedSql,
      queryType: 'manual',
      manualSql: sanitizedSql,
      result: JSON.stringify(result),
      executionTimeMs: executionTime,
      rowCount: result.length,
    });

    // 记录连接历史
    await ConnectionManager.logHistory(
      session.user.id,
      connectionId,
      'query',
      {
        sql: sanitizedSql.substring(0, 100),
        executionTime,
        rowCount: result.length
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        rows: result,
        executionTime,
        rowCount: result.length,
      },
    });

  } catch (error) {
    console.error('执行SQL查询失败:', error);

    // 记录失败的查询
    const session = await auth();
    const { connectionId } = await params;

    if (session?.user?.id) {
      const body = await request.json().catch(() => ({}));
      const sql = body.sql || '';

      await db.insert(queryHistory).values({
        userId: session.user.id,
        connectionId: connectionId,
        query: sql,
        queryType: 'manual',
        manualSql: sql,
        error: String(error),
        executionTimeMs: 0,
        rowCount: 0,
      });

      await ConnectionManager.logHistory(
        session.user.id,
        connectionId,
        'query',
        {
          sql: sql.substring(0, 100),
          success: false,
          error: String(error)
        }
      );
    }

    return NextResponse.json(
      { error: '执行SQL查询失败', details: String(error) },
      { status: 500 }
    );
  }
}
