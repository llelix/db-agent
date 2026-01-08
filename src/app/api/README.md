# API 文档

## 认证
所有 API 需要用户登录或提供 API Key。

## 端点

### POST /api/query
执行数据库查询

**请求体**:
```json
{
  "query": "查询过去30天销售额最高的前5个产品"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "result": "最终回答文本",
    "steps": [...],
    "sql": "SELECT ...",
    "data": [...],
    "usage": { "input": 100, "output": 200 }
  },
  "metadata": {
    "executionTime": 1500,
    "timestamp": "2026-01-08T10:00:00Z"
  }
}
```

### GET /api/query
获取查询历史

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)

**响应**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### DELETE /api/query/:id
删除查询记录

**响应**:
```json
{
  "success": true,
  "message": "删除成功"
}
```

## 错误响应
```json
{
  "error": "错误描述",
  "details": "详细信息 (开发环境)"
}
```

## 使用示例

### 使用 Server Action (推荐)
```typescript
import { executeQueryAction } from '@/lib/actions/query-action';

const formData = new FormData();
formData.append('query', '查询所有产品');

const result = await executeQueryAction(formData);
```

### 使用 REST API
```bash
# 执行查询
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -H "Cookie: session=用户会话ID" \
  -d '{"query": "查询所有产品"}'

# 获取历史
curl -X GET "http://localhost:3000/api/query?page=1&limit=20" \
  -H "Cookie: session=用户会话ID"

# 删除记录
curl -X DELETE http://localhost:3000/api/query/记录ID \
  -H "Cookie: session=用户会话ID"
```

### 使用 API Key (开发环境)
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -H "x-api-key: 测试Key" \
  -d '{"query": "查询所有产品"}'
```
