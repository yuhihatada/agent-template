import { NextRequest, NextResponse } from 'next/server';
import { Agent, run, tool } from '@openai/agents';
import { z } from 'zod';
import toast from 'react-hot-toast';

// TODO管理ツール（子分1用）
const todoManagerTool = tool({
  name: 'manage_todo',
  description: 'Create, update, or list TODO items for the user',
  parameters: z.object({
    action: z.enum(['create', 'list', 'complete']).describe('The action to perform'),
    title: z.string().nullable().optional().describe('Title for new TODO'),
    description: z.string().nullable().optional().describe('Description for new TODO'),
    id: z.string().nullable().optional().describe('TODO ID for complete action')
  }),
  async execute({ action, title, description, id }) {
    console.log('TODO Manager:', { action, title, description, id });
    
    switch (action) {
      case 'create':
        return {
          success: true,
          message: `TODO「${title}」を作成しました！`,
          data: { title, description, id: Date.now().toString() },
          showToast: true,
          speaker: 'TODO管理係'
        };
      case 'list':
        return {
          success: true,
          message: '現在のTODOリストを確認しています...',
          data: { todos: [] },
          speaker: 'TODO管理係'
        };
      case 'complete':
        return {
          success: true,
          message: `TODO「${id}」を完了にしました！`,
          data: { completedId: id },
          speaker: 'TODO管理係'
        };
      default:
        return {
          success: false,
          message: '不明なアクションです',
          speaker: 'TODO管理係'
        };
    }
  }
});

// 連絡管理ツール（子分2用）
const contactManagementTool = tool({
  name: 'manage_contact',
  description: 'Manage contacts, schedule meetings, and handle communications',
  parameters: z.object({
    action: z.enum(['add_contact', 'schedule_meeting', 'send_reminder', 'check_schedule']).describe('The contact management action'),
    name: z.string().nullable().optional().describe('Contact name or meeting title'),
    details: z.string().nullable().optional().describe('Contact details or meeting details'),
    datetime: z.string().nullable().optional().describe('Date and time for meetings')
  }),
  async execute({ action, name, details, datetime }) {
    console.log('Contact Management:', { action, name, details, datetime });
    
    switch (action) {
      case 'add_contact':
        return {
          success: true,
          message: `連絡先「${name}」を追加しました！\n詳細: ${details || '詳細なし'}`,
          data: { contactName: name, details },
          speaker: '連絡管理係',
          showToast: true
        };
      case 'schedule_meeting':
        return {
          success: true,
          message: `会議「${name}」をスケジュールしました！\n日時: ${datetime}\n詳細: ${details || '詳細なし'}`,
          data: { meetingTitle: name, datetime, details },
          speaker: '連絡管理係',
          showToast: true
        };
      case 'send_reminder':
        return {
          success: true,
          message: `リマインダーを送信しました: ${details}`,
          data: { reminder: details },
          speaker: '連絡管理係',
          showToast: true
        };
      case 'check_schedule':
        return {
          success: true,
          message: `本日のスケジュールを確認しています...\n現在、予定されている会議はありません。`,
          data: { schedule: [] },
          speaker: '連絡管理係'
        };
      default:
        return {
          success: false,
          message: '不明なアクションです',
          speaker: '連絡管理係'
        };
    }
  }
});

// 仕様書管理ツール（子分3用）
const specificationTool = tool({
  name: 'manage_specification',
  description: 'Manage project specifications, requirements, and documentation',
  parameters: z.object({
    action: z.enum(['create_spec', 'update_requirement', 'review_doc', 'generate_template']).describe('The specification management action'),
    title: z.string().nullable().optional().describe('Specification title or requirement name'),
    content: z.string().nullable().optional().describe('Specification content or requirement details'),
    type: z.string().nullable().optional().describe('Document type (API, UI, Database, etc.)')
  }),
  async execute({ action, title, content, type }) {
    console.log('Specification Management:', { action, title, content, type });
    
    switch (action) {
      case 'create_spec':
        const markdownContent = content || `# ${title}

## 概要
${title}の仕様書です。

## 要件
- 機能要件を記載してください
- 非機能要件を記載してください

## 設計
### アーキテクチャ
- システム構成を記載

### データ構造
- データモデルを記載

## 実装方針
- 開発方針
- 技術選定

## テスト計画
- テスト方針
- テストケース

---
*作成日: ${new Date().toLocaleDateString()}*`;

        return {
          success: true,
          message: `仕様書「${title}」を作成しました！\nタイプ: ${type || '未指定'}\nマークダウン形式で構造化されています。`,
          data: { title, type, content: markdownContent },
          speaker: '仕様書管理係',
          showToast: true
        };
      case 'update_requirement':
        return {
          success: true,
          message: `要件「${title}」を更新しました！\n更新内容: ${content}`,
          data: { requirement: title, updates: content },
          speaker: '仕様書管理係',
          showToast: true
        };
      case 'review_doc':
        return {
          success: true,
          message: `ドキュメント「${title}」をレビューしています...\n現在の仕様書は適切に管理されています。`,
          data: { reviewed: title },
          speaker: '仕様書管理係'
        };
      case 'generate_template':
        const templateContent = `# ${type}仕様書テンプレート

## 1. 概要
${type}に関する仕様書のテンプレートです。

## 2. 目的
- この仕様書の目的を記載
- 対象範囲を明確にする

## 3. 要件定義
### 3.1 機能要件
- 必要な機能をリストアップ
- 各機能の詳細説明

### 3.2 非機能要件
- パフォーマンス要件
- セキュリティ要件
- 可用性要件

## 4. システム設計
### 4.1 アーキテクチャ
\`\`\`
[アーキテクチャ図をここに記載]
\`\`\`

### 4.2 データ設計
\`\`\`json
{
  "example": "データ構造の例"
}
\`\`\`

## 5. インターフェース仕様
### 5.1 API仕様
- エンドポイント一覧
- リクエスト/レスポンス仕様

### 5.2 UI仕様
- 画面設計
- 操作フロー

## 6. 実装方針
- 開発言語・フレームワーク
- 開発環境
- デプロイ方針

## 7. テスト計画
### 7.1 テスト戦略
- ユニットテスト
- 統合テスト
- システムテスト

### 7.2 テストケース
| No | テスト項目 | 期待結果 |
|----|-----------|----------|
| 1  | 例1       | 結果1    |
| 2  | 例2       | 結果2    |

## 8. 運用・保守
- 監視項目
- 保守方針
- 障害対応手順

---
*テンプレート作成日: ${new Date().toLocaleDateString()}*`;

        return {
          success: true,
          message: `${type}仕様書のテンプレートを生成しました！\nマークダウン形式の詳細なテンプレートです。`,
          data: { title: `${type}仕様書テンプレート`, type, content: templateContent },
          speaker: '仕様書管理係',
          showToast: true
        };
      default:
        return {
          success: false,
          message: '不明なアクションです',
          speaker: '仕様書管理係'
        };
    }
  }
});

// エージェント定義
const todoManagerAgent = new Agent({
  name: 'TODO管理係',
  instructions: 'あなたはTODO管理の専門家です。ユーザーのタスク管理をサポートし、効率的な作業環境を提供します。親しみやすい口調で、丁寧にサポートしてください。',
  model: 'gpt-4o-mini',
  tools: [todoManagerTool]
});

const contactManagementAgent = new Agent({
  name: '連絡管理係',
  instructions: 'あなたは連絡管理とコミュニケーションの専門家です。連絡先の管理、会議のスケジューリング、リマインダーの送信など、ユーザーのコミュニケーション業務をサポートします。効率的で丁寧な口調で対応してください。',
  model: 'gpt-4o-mini',
  tools: [contactManagementTool]
});

const specificationAgent = new Agent({
  name: '仕様書管理係',
  instructions: 'あなたは仕様書管理とドキュメント作成の専門家です。プロジェクトの要件定義、仕様書の作成・更新、ドキュメントのレビューなどをサポートします。技術的で正確な口調で、分かりやすく説明してください。',
  model: 'gpt-4o-mini',
  tools: [specificationTool]
});

const bossAgent = new Agent({
  name: 'ボス',
  instructions: `あなたはチームのボスです。ユーザーの要求を分析し、以下の対応を行います：

**部下への依頼が必要な場合：**
- TODO管理係: タスク管理、スケジュール、生産性向上が必要な場合
- 連絡管理係: 連絡先管理、会議スケジューリング、コミュニケーション業務が必要な場合
- 仕様書管理係: 仕様書作成、要件定義、ドキュメント管理が必要な場合

部下に依頼する場合は「○○係に依頼いたします。」という簡潔な返答をしてからhandoffしてください。

**部下への依頼が不要な場合：**
一般的な質問や挨拶、雑談などは自分で直接答えてください。

威厳のある丁寧な口調で話してください。`,
  model: 'gpt-4o-mini',
  handoffs: [todoManagerAgent, contactManagementAgent, specificationAgent]
});

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const result = await run(bossAgent, message);

    // Extract tool results and agent responses
    const toolResults: any[] = [];
    const agentResponses: any[] = [];
    const handoffOccurred = result.lastAgent && result.lastAgent.name !== 'ボス';
    
    if (result.newItems) {
      for (const item of result.newItems) {
        if (item.type === 'tool_call_output_item') {
          toolResults.push(item.output);
        } else if (item.type === 'message_output_item') {
          // Only include agent responses if they're from handoff agents (not the boss)
          if (item.agent && item.agent.name !== 'ボス') {
            agentResponses.push({
              content: item.content,
              speaker: item.agent.name
            });
          }
        }
      }
    }

    // If handoff occurred, show boss delegation message
    let bossResponse = result.finalOutput;
    if (handoffOccurred && result.lastAgent) {
      // Create a delegation message from boss
      const agentName = result.lastAgent.name;
      bossResponse = `${agentName}に依頼いたします。`;
    }

    return NextResponse.json({ 
      response: bossResponse,
      speaker: 'ボス',
      tools: toolResults,
      agentResponses: agentResponses,
      handoffOccurred: handoffOccurred
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}