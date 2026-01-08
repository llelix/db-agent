import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * 健康检查端点
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'db-agent',
  });
}
