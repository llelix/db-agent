import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { dbConnections } from '@db/schema';
import { eq } from 'drizzle-orm';
import { ConnectionManager } from '@/lib/database/connection-manager';

/**
 * GET /api/db/diagnostic
 * 诊断数据库连接状态和缓存
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权 - 需要登录' },
        { status: 401 }
      );
    }

    // 获取用户的所有连接
    const connections = await db.query.dbConnections.findMany({
      where: eq(dbConnections.userId, session.user.id),
      orderBy: (table) => [table.createdAt],
    });

    // 获取缓存的连接ID
    const cachedIds = ConnectionManager.getCachedConnectionIds();

    // 检查每个连接的有效性
    const connectionDetails = await Promise.all(
      connections.map(async (conn) => {
        const isCached = cachedIds.includes(conn.id);
        let isValid = false;

        if (isCached) {
          isValid = await ConnectionManager.validateConnection(conn.id);
        }

        return {
          id: conn.id,
          name: conn.name,
          database: conn.database,
          host: conn.host,
          port: conn.port,
          isCached,
          isValid,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        userConnections: connectionDetails,
        cachedConnectionIds: cachedIds,
        totalConnections: connections.length,
        totalCached: cachedIds.length,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('诊断失败:', error);
    return NextResponse.json(
      { error: '诊断失败', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/db/diagnostic
 * 清除所有连接缓存
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权 - 需要登录' },
        { status: 401 }
      );
    }

    // 清除所有连接缓存
    await ConnectionManager.closeAllConnections();

    return NextResponse.json({
      success: true,
      message: '所有连接缓存已清除',
      cleared: true,
    });

  } catch (error) {
    console.error('清除缓存失败:', error);
    return NextResponse.json(
      { error: '清除缓存失败', details: String(error) },
      { status: 500 }
    );
  }
}