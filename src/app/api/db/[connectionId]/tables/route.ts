import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { dbConnections } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { ConnectionManager } from '@/lib/database/connection-manager';

/**
 * GET /api/db/:connectionId/tables
 * 获取数据库所有表列表
 */
export async function GET(
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

    // 获取表列表
    const tables = await ConnectionManager.getTables(connectionId);

    // 记录历史
    await ConnectionManager.logHistory(
      session.user.id,
      connectionId,
      'browse',
      { action: 'list_tables', count: tables.length }
    );

    return NextResponse.json({
      success: true,
      data: tables,
    });

  } catch (error) {
    console.error('获取表列表失败:', error);
    return NextResponse.json(
      { error: '获取表列表失败', details: String(error) },
      { status: 500 }
    );
  }
}