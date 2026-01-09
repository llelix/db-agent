import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { dbConnections } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { ConnectionManager, decryptPassword } from '@/lib/database/connection-manager';

/**
 * POST /api/db/connections/:id/test
 * 测试数据库连接
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权 - 需要登录' },
        { status: 401 }
      );
    }

    // 获取连接配置
    const connection = await db.query.dbConnections.findFirst({
      where: and(
        eq(dbConnections.id, id),
        eq(dbConnections.userId, session.user.id)
      ),
    });

    if (!connection) {
      return NextResponse.json(
        { error: '连接不存在或无权限' },
        { status: 404 }
      );
    }

    // 解密密码
    const decryptedPassword = decryptPassword(connection.password);

    // 测试连接
    const testConfig = {
      name: connection.name,
      host: connection.host,
      port: connection.port,
      database: connection.database,
      username: connection.username,
      password: decryptedPassword,
      ssl: connection.ssl,
      userId: session.user.id,
    };

    const isConnected = await ConnectionManager.testConnection(testConfig);

    // 记录历史
    await ConnectionManager.logHistory(
      session.user.id,
      id,
      'test',
      { success: isConnected }
    );

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: '连接测试成功',
        data: {
          host: connection.host,
          port: connection.port,
          database: connection.database,
        },
      });
    } else {
      return NextResponse.json(
        { error: '连接测试失败，请检查配置' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('连接测试失败:', error);

    // 记录失败历史
    const { id } = await params;
    const session = await auth();
    if (session?.user?.id) {
      await ConnectionManager.logHistory(
        session.user.id,
        id,
        'test',
        { success: false, error: String(error) }
      );
    }

    return NextResponse.json(
      { error: '连接测试失败', details: String(error) },
      { status: 500 }
    );
  }
}