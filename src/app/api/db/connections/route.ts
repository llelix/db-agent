import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { dbConnections, type NewDbConnection } from '@db/schema';
import { eq } from 'drizzle-orm';
import { encryptPassword } from '@/lib/database/connection-manager';
import { ConnectionManager } from '@/lib/database/connection-manager';
import { DatabaseClientFactory, type DatabaseType } from '@/lib/types/database';

/**
 * GET /api/db/connections
 * 获取用户的所有数据库连接
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

    const connections = await db.query.dbConnections.findMany({
      where: eq(dbConnections.userId, session.user.id),
      orderBy: (table) => [table.createdAt],
    });

    // 不返回密码字段
    const safeConnections = connections.map(conn => {
      const { password, ...rest } = conn;
      return rest;
    });

    return NextResponse.json({
      success: true,
      data: safeConnections,
    });

  } catch (error) {
    console.error('获取连接列表失败:', error);
    return NextResponse.json(
      { error: '获取连接列表失败', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/db/connections
 * 创建新的数据库连接
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

    const body = await request.json();
    const { name, host, port, database, username, password, ssl, type, schema } = body;

    // 验证必填字段
    if (!name || !host || !database || !username || !password) {
      return NextResponse.json(
        { error: '缺少必要字段: name, host, database, username, password' },
        { status: 400 }
      );
    }

    // 验证数据库类型
    const dbType: DatabaseType = type === 'mysql' ? 'mysql' : 'postgresql';

    // 自动设置默认端口
    const finalPort = port || DatabaseClientFactory.getDefaultPort(dbType);

    // PostgreSQL schema，默认为 'public'
    const finalSchema = dbType === 'postgresql' ? (schema || 'public') : undefined;

    // 测试连接
    const testConfig = {
      name,
      host,
      port: finalPort,
      database,
      username,
      password,
      ssl: ssl || false,
      type: dbType,
      schema: finalSchema,
      userId: session.user.id,
    };

    const isConnected = await ConnectionManager.testConnection(testConfig);
    if (!isConnected) {
      return NextResponse.json(
        { error: '连接测试失败，请检查配置' },
        { status: 400 }
      );
    }

    // 加密密码
    const encryptedPassword = encryptPassword(password);

    // 创建连接记录
    const newConnection: NewDbConnection = {
      userId: session.user.id,
      name,
      host,
      port: finalPort,
      database,
      username,
      password: encryptedPassword,
      ssl: ssl || false,
      type: dbType,
      schema: finalSchema,
    };

    const [connection] = await db.insert(dbConnections).values(newConnection).returning();

    // 记录历史
    await ConnectionManager.logHistory(
      session.user.id,
      connection.id,
      'create',
      { name, host, database }
    );

    // 返回不包含密码的数据
    const { password: _, ...safeConnection } = connection;

    return NextResponse.json({
      success: true,
      message: '连接创建成功',
      data: safeConnection,
    }, { status: 201 });

  } catch (error) {
    console.error('创建连接失败:', error);
    return NextResponse.json(
      { error: '创建连接失败', details: String(error) },
      { status: 500 }
    );
  }
}