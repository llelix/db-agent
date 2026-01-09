import { NextRequest } from 'next/server';
import { executeQueryStream } from '@/lib/actions/query-action';

/**
 * POST /api/query/stream
 * 流式执行数据库查询
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { query } = body;

    // 验证请求
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ type: 'error', data: '无效的请求 - 缺少 query 参数' }) + '\n',
        { status: 400, headers: { 'Content-Type': 'application/x-ndjson' } }
      );
    }

    // 创建 FormData
    const formData = new FormData();
    formData.append('query', query);

    // 执行流式查询
    const stream = await executeQueryStream(formData);

    // 返回流式响应
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Stream query error:', error);
    return new Response(
      JSON.stringify({ type: 'error', data: String(error) }) + '\n',
      {
        status: 500,
        headers: { 'Content-Type': 'application/x-ndjson' }
      }
    );
  }
}
