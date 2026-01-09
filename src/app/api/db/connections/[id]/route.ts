import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { dbConnections } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { encryptPassword } from '@/lib/database/connection-manager';
import { ConnectionManager } from '@/lib/database/connection-manager';

/**
 * GET /api/db/connections/:id
 * 获取特定连接信息
 */
export async function GET(
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

    // 不返回密码
    const { password, ...safeConnection } = connection;

    return NextResponse.json({
      success: true,
      data: safeConnection,
    });

  } catch (error) {
    console.error('获取连接失败:', error);
    return NextResponse.json(
      { error: '获取连接失败', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/db/connections/:id
 * 更新连接配置
 */
export async function PUT(
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

    // 验证连接存在且属于当前用户
    const existing = await db.query.dbConnections.findFirst({
      where: and(
        eq(dbConnections.id, id),
        eq(dbConnections.userId, session.user.id)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: '连接不存在或无权限' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, host, port, database, username, password, ssl } = body;

    // 准备更新数据
    const updateData: any = {
      name,
      host,
      port: port || 5432,
      database,
      username,
      ssl: ssl || false,
      updatedAt: new Date(),
    };

    // 如果提供了新密码，加密并更新
    if (password) {
      updateData.password = encryptPassword(password);

      // 测试新连接
      const testConfig = {
        name: name || existing.name,
        host: host || existing.host,
        port: port || existing.port,
        database: database || existing.database,
        username: username || existing.username,
        password,
        ssl: ssl || existing.ssl,
        userId: session.user.id,
      };

      const isConnected = await ConnectionManager.testConnection(testConfig);
      if (!isConnected) {
        return NextResponse.json(
          { error: '连接测试失败，请检查配置' },
          { status: 400 }
        );
      }
    }

    // 更新连接
    const [updated] = await db
      .update(dbConnections)
      .set(updateData)
      .where(eq(dbConnections.id, id))
      .returning();

    // 清除缓存的连接池
    await ConnectionManager.closeConnection(id);

    // 记录历史
    await ConnectionManager.logHistory(
      session.user.id,
      id,
      'update',
      { name: updateData.name }
    );

    // 不返回密码
    const { password: _, ...safeConnection } = updated;

    return NextResponse.json({
      success: true,
      message: '连接更新成功',
      data: safeConnection,
    });

  } catch (error) {
    console.error('更新连接失败:', error);
    return NextResponse.json(
      { error: '更新连接失败', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/db/connections/:id
 * 删除连接配置
 */
export async function DELETE(
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

    // 验证连接存在且属于当前用户
    const existing = await db.query.dbConnections.findFirst({
      where: and(
        eq(dbConnections.id, id),
        eq(dbConnections.userId, session.user.id)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: '连接不存在或无权限' },
        { status: 404 }
      );
    }

    // 删除连接
    await db.delete(dbConnections).where(eq(dbConnections.id, id));

    // 清除缓存的连接池
    await ConnectionManager.closeConnection(id);

    // 记录历史
    await ConnectionManager.logHistory(
      session.user.id,
      id,
      'delete',
      { name: existing.name }
    );

    return NextResponse.json({
      success: true,
      message: '连接删除成功',
    });

  } catch (error) {
    console.error('删除连接失败:', error);
    return NextResponse.json(
      { error: '删除连接失败', details: String(error) },
      { status: 500 }
    );
  }
}