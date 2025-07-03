import { NextRequest, NextResponse } from 'next/server';
import { Agent, run } from '@openai/agents';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const chatAgent = new Agent({
      name: 'Chat Assistant',
      instructions: 'You are a helpful AI assistant. Respond naturally and helpfully to user questions.',
      model: 'gpt-4o-mini'
    });

    const result = await run(chatAgent, message);

    return NextResponse.json({ 
      response: result.finalOutput 
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}