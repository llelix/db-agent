import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { dbConnections } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { ConnectionManager } from '@/lib/database/connection-manager';

/**
 * GET /api/db/:connectionId/validate
 * 验证连接并清除缓存
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

    // 清除连接缓存
    ConnectionManager.clearConnectionCache(connectionId);

    // 验证连接是否有效
    const isValid = await ConnectionManager.validateConnection(connectionId);

    return NextResponse.json({
      success: true,
      message: '连接缓存已清除',
      cleared: true,
      isValid,
      connection: {
        id: connection.id,
        name: connection.name,
        database: connection.database,
        host: connection.host,
        port: connection.port,
      },
    });

  } catch (error) {
    console.error('连接验证失败:', error);
    return NextResponse.json(
      { error: '连接验证失败', details: String(error) },
      { status: 500 }
    );
  }
}