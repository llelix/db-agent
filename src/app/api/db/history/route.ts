import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { connectionHistory } from '@db/schema';
import { eq, desc, and } from 'drizzle-orm';

/**
 * GET /api/db/history
 * 获取数据库操作历史记录
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

    // 获取查询参数
    const url = new URL(request.url);
    const connectionId = url.searchParams.get('connectionId');
    const action = url.searchParams.get('action');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // 构建查询条件
    const conditions = [eq(connectionHistory.userId, session.user.id)];

    if (connectionId) {
      conditions.push(eq(connectionHistory.connectionId, connectionId));
    }

    if (action) {
      conditions.push(eq(connectionHistory.action, action));
    }

    const whereCondition = conditions.length > 1 ? and(...conditions) : conditions[0];

    // 获取历史记录
    const history = await db.query.connectionHistory.findMany({
      where: whereCondition,
      orderBy: [desc(connectionHistory.createdAt)],
      limit,
      offset,
    });

    // 获取总数
    const totalCount = await db.query.connectionHistory.findMany({
      where: whereCondition,
    });

    return NextResponse.json({
      success: true,
      data: {
        history,
        pagination: {
          limit,
          offset,
          total: totalCount.length,
          hasMore: offset + history.length < totalCount.length,
        },
      },
    });

  } catch (error) {
    console.error('获取历史记录失败:', error);
    return NextResponse.json(
      { error: '获取历史记录失败', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/db/history
 * 清空历史记录
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权 - 需要登录' },
        { status: 401 }
      );
    }

    // 获取查询参数
    const url = new URL(request.url);
    const connectionId = url.searchParams.get('connectionId');

    // 构建删除条件
    const conditions = [eq(connectionHistory.userId, session.user.id)];

    if (connectionId) {
      conditions.push(eq(connectionHistory.connectionId, connectionId));
    }

    const whereCondition = conditions.length > 1 ? and(...conditions) : conditions[0];

    // 删除历史记录
    await db.delete(connectionHistory).where(whereCondition);

    return NextResponse.json({
      success: true,
      message: connectionId ? '指定连接的历史记录已清空' : '所有历史记录已清空',
    });

  } catch (error) {
    console.error('清空历史记录失败:', error);
    return NextResponse.json(
      { error: '清空历史记录失败', details: String(error) },
      { status: 500 }
    );
  }
}
