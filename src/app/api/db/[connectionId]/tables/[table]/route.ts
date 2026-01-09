import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { dbConnections } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { ConnectionManager } from '@/lib/database/connection-manager';

/**
 * GET /api/db/:connectionId/tables/:table
 * 获取指定表的结构信息
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ connectionId: string; table: string }> }
) {
  try {
    const session = await auth();
    const { connectionId, table } = await params;

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

    // 验证表名安全性
    const safeTableName = table.replace(/[^a-zA-Z0-9_]/g, '');
    if (safeTableName !== table) {
      return NextResponse.json(
        { error: '表名包含非法字符' },
        { status: 400 }
      );
    }

    // 获取表结构
    const schema = await ConnectionManager.getTableSchema(connectionId, table);

    // 获取表行数统计
    const rowCount = await ConnectionManager.executeQuery(
      connectionId,
      `SELECT COUNT(*) as count FROM "${safeTableName}"`
    );

    // 记录历史
    await ConnectionManager.logHistory(
      session.user.id,
      connectionId,
      'browse',
      { action: 'get_table_schema', table, rowCount: rowCount[0]?.count || 0 }
    );

    return NextResponse.json({
      success: true,
      data: {
        table,
        rowCount: parseInt(rowCount[0]?.count || '0'),
        columns: schema,
      },
    });

  } catch (error) {
    console.error('获取表结构失败:', error);
    return NextResponse.json(
      { error: '获取表结构失败', details: String(error) },
      { status: 500 }
    );
  }
}
