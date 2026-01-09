import { NextRequest, NextResponse } from 'next/server';
import { createTools } from '@/lib/agent/tools';

/**
 * GET /api/schema
 * 获取数据库表结构
 * 需要 connectionId 参数
 */
export async function GET(request: NextRequest) {
  try {
    // 从 URL 参数获取 connectionId
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');

    if (!connectionId) {
      return NextResponse.json(
        { error: '缺少 connectionId 参数' },
        { status: 400 }
      );
    }

    // 使用工厂函数创建工具
    const tools = createTools(connectionId);
    const getSchemaTool = tools.find(tool => tool.name === 'get_database_schema');

    if (!getSchemaTool) {
      throw new Error('get_database_schema 工具未找到');
    }

    // 调用工具，使用类型断言绕过 TypeScript 联合类型问题
    const schema = await (getSchemaTool.execute as (args: any) => Promise<any>)({});

    return NextResponse.json({
      success: true,
      data: schema,
    });
  } catch (error) {
    console.error('Schema API Error:', error);

    return NextResponse.json(
      {
        error: '获取数据库结构失败',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
