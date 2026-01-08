import { NextRequest, NextResponse } from 'next/server';
import { getSchemaTool } from '../../../../lib/agent/tools';

/**
 * GET /api/schema
 * 获取数据库表结构
 */
export async function GET(request: NextRequest) {
  try {
    const schema = await getSchemaTool.execute({});

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
