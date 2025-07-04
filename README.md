# AI Agent Template

OpenAI Agents SDKを使用したチャットアプリケーションのテンプレートです。

## 🚀 クイックスタート

### 1. 環境設定
```bash
# OpenAI API キーを設定
export OPENAI_API_KEY=sk-your-api-key-here

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

### 2. アクセス
[http://localhost:3000/chat](http://localhost:3000/chat) でチャット画面を開く

## 📋 実装されている機能

### チャットアシスタント
- GPT-4o-miniを使用したAIチャット
- TODO自動作成機能（タスクを言及すると自動でTODO化）
- トースト通知

### 使用例
```
"明日資料を作成する必要がある" → TODO自動作成
"買い物に行かなきゃ" → TODO自動作成
"プレゼンの準備をしよう" → TODO自動作成
```

## 🛠️ Agent開発の基本

### 1. Agentの作成
```typescript
const agent = new Agent({
  name: 'Assistant',
  instructions: 'あなたは親切なアシスタントです',
  model: 'gpt-4o-mini',
  tools: [yourTool]
});
```

### 2. ツールの作成
```typescript
const todoTool = tool({
  name: 'create_todo',
  description: 'TODOを作成する',
  parameters: z.object({
    title: z.string().describe('タイトル'),
    description: z.string().optional()
  }),
  async execute({ title, description }) {
    // ツールの実行ロジック
    return { success: true, data: { title } };
  }
});
```

### 3. Agentの実行
```typescript
const result = await run(agent, userMessage);
console.log(result.finalOutput); // AIの応答
```

## 📁 ファイル構成

```
app/
├── api/chat/route.ts    # Agentの定義とAPI処理
├── chat/page.tsx        # チャットUI
└── layout.tsx           # レイアウト設定
docs/                    # Agent開発ガイド
```

## 🔧 カスタマイズ方法

### 新しいツールを追加
1. `route.ts`で新しいツールを定義
2. Agentの`tools`配列に追加
3. フロントエンドで結果を処理

### Agentの指示を変更
`route.ts`の`instructions`を編集してAgentの振る舞いを調整

## 📖 参考資料

- [OpenAI Agents SDK](https://github.com/openai/agents-sdk)
- `docs/ai_agent_guide.md` - 詳細な開発ガイド
- [Next.js Documentation](https://nextjs.org/docs)