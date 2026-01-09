import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { dbConnections } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { ConnectionManager } from '@/lib/database/connection-manager';

/**
 * GET /api/db/:connectionId/data/:table
 * 获取表数据（分页）
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

    // 获取查询参数
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // 验证参数范围
    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'limit必须在1-1000之间' },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: 'offset不能为负数' },
        { status: 400 }
      );
    }

    // 获取表数据
    const data = await ConnectionManager.getTableData(connectionId, table, limit, offset);

    // 获取总行数
    const totalCount = await ConnectionManager.executeQuery(
      connectionId,
      `SELECT COUNT(*) as count FROM "${safeTableName}"`
    );

    // 记录历史
    await ConnectionManager.logHistory(
      session.user.id,
      connectionId,
      'browse',
      { action: 'get_table_data', table, limit, offset, count: data.length }
    );

    return NextResponse.json({
      success: true,
      data: {
        table,
        rows: data,
        pagination: {
          limit,
          offset,
          total: parseInt(totalCount[0]?.count || '0'),
          hasMore: offset + data.length < parseInt(totalCount[0]?.count || '0'),
        },
      },
    });

  } catch (error) {
    console.error('获取表数据失败:', error);
    return NextResponse.json(
      { error: '获取表数据失败', details: String(error) },
      { status: 500 }
    );
  }
}
