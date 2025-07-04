import { NextRequest, NextResponse } from 'next/server';
import { Agent, run, tool } from '@openai/agents';
import { z } from 'zod';

// TODO作成ツール
const createTodoTool = tool({
  name: 'create_todo',
  description: 'Create a TODO item when the user mentions tasks, goals, or things they need to do',
  parameters: z.object({
    title: z.string().describe('The title of the TODO item'),
    description: z.string().nullable().optional().describe('Optional description of the TODO')
  }),
  async execute({ title, description }) {
    // TODO作成のロジック（実際にはデータベースに保存など）
    console.log('Creating TODO:', { title, description });
    
    return {
      success: true,
      message: 'TODO item created successfully',
      data: { title, description, id: Date.now().toString() },
      showToast: true // トースト表示のフラグ
    };
  }
});

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const chatAgent = new Agent({
      name: 'Chat Assistant',
      instructions: `You are a helpful AI assistant. When users mention tasks, goals, or things they need to do, you should use the create_todo tool to help them organize their tasks. 

Examples of when to create TODOs:
- "I need to buy groceries"
- "Don't forget to call mom"
- "I should finish the report by Friday"
- "Tomorrow I have to clean the house"
- "I want to learn Japanese"

Always respond naturally to the user while also creating the TODO if appropriate.`,
      model: 'gpt-4o-mini',
      tools: [createTodoTool]
    });

    const result = await run(chatAgent, message);

    // Extract tool results for client-side processing
    const toolResults: any[] = [];
    if (result.newItems) {
      for (const item of result.newItems) {
        if (item.type === 'tool_call_output_item') {
          toolResults.push(item.output);
        }
      }
    }

    return NextResponse.json({ 
      response: result.finalOutput,
      tools: toolResults
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}