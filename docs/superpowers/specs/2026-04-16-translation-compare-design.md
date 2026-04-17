# 翻译对比工具 - 设计文档

## 概述

创建一个 Web App 用于翻译原文和译文对比。核心技术栈：Next.js + React + Tailwind CSS + shadcn/ui。

## 功能需求

### 1. 多模型翻译支持
- 支持 MiniMax 和 DeepSeek 两种模型
- 可切换使用的模型
- 可配置 API 端点和 Key

### 2. 智能分段
- 根据句号、问号、感叹号等断句点自动分割
- 可配置每段的最小和最大字符长度
- 长内容自动分段处理

### 3. 翻译流程
- 粘贴内容到输入框后自动触发分段
- 自动进行翻译
- 翻译结果按顺序显示
- 失败时分段显示错误提示

### 4. 界面布局
- 左右分列：原文 | 译文
- 段落上下对齐
- 原文可编辑，译文只读

## 技术架构

### 前端
- Next.js 14 (App Router)
- React
- Tailwind CSS
- shadcn/ui 组件库

### 后端
- Next.js API Routes 代理翻译请求
- API Key 仅存储在服务端，不暴露给浏览器
- 避免 CORS 问题

### 配置存储
- localStorage 保存 API 配置
- 配置项：端点、模型、Key

## 组件设计

### 1. Header
- 左侧：设置图标（打开设置面板）
- 右侧：模型选择下拉菜单

### 2. Settings Panel
- API 端点输入
- API Key 输入
- 模型选择
- 保存/取消按钮

### 3. TranslationPanel
- 左右分栏容器
- 原文区域（左侧，可编辑）
- 译文区域（右侧，只读）
- 分段设置区域

### 4. SegmentBlock
- 原文段落
- 译文段落
- 状态指示（翻译中/成功/失败）
- 错误信息显示

## 数据流

```
用户粘贴内容
    ↓
自动分段（根据断句点 + 长度配置）
    ↓
逐段调用 /api/translate
    ↓
API Routes 转发到 MiniMax/DeepSeek
    ↓
翻译结果按顺序渲染到右侧
    ↓
失败分段显示错误和重试按钮
```

## API 设计

### POST /api/translate
**请求体：**
```json
{
  "text": "要翻译的文本",
  "model": "minimax | deepseek",
  "endpoint": "API端点",
  "apiKey": "API密钥"
}
```

**响应：**
```json
{
  "success": true,
  "translatedText": "翻译结果"
}
```

**错误响应：**
```json
{
  "success": false,
  "error": "错误信息"
}
```

## 分段算法

1. 按断句符分割：`。！？.!?`
2. 计算每段字符数
3. 如果段落超过最大长度，继续按逗号、顿号等细分
4. 如果段落小于最小长度，与下一段合并
5. 返回分段数组

## 错误处理

- 网络错误：显示"网络连接失败，请检查网络"
- API 错误：显示具体错误信息
- 超时错误：显示"翻译超时，请重试"
- 单段失败不影响其他段落
