# AI Agent Implementation Guide

## Overview

This guide covers how to implement AI agents using the OpenAI Agents SDK for JavaScript. The SDK provides a comprehensive framework for building intelligent agents with tools, handoffs, guardrails, and human-in-the-loop capabilities.

## Getting Started

### 1. Installation

```bash
npm install @openai/agents
```

### 2. Environment Setup

```bash
export OPENAI_API_KEY=sk-your-api-key-here
```

### 3. Basic Agent Creation

```typescript
import { Agent, run } from '@openai/agents';

const agent = new Agent({
  name: 'Assistant',
  instructions: 'You are a helpful AI assistant.',
  model: 'gpt-4o'
});

// Run the agent
const result = await run(agent, 'Hello, how are you?');
console.log(result.finalOutput);
```

## Agent Configuration

### Core Properties

```typescript
const agent = new Agent({
  name: 'Customer Support Agent',
  instructions: 'You are a customer support specialist...',
  model: 'gpt-4o',
  tools: [toolArray],
  handoffs: [otherAgentsArray],
  modelSettings: {
    temperature: 0.7,
    maxTokens: 1000,
    topP: 0.9
  }
});
```

### Dynamic Instructions

```typescript
const agent = new Agent({
  name: 'Weather Assistant',
  instructions: (context) => `
    You are a weather assistant.
    Current user location: ${context.userLocation}
    Time zone: ${context.timeZone}
  `
});
```

### Model Settings

```typescript
// Per-agent settings
const agent = new Agent({
  name: 'Creative Writer',
  model: 'gpt-4o',
  modelSettings: {
    temperature: 0.9,
    topP: 0.95,
    toolChoice: 'auto'
  }
});

// Global settings via Runner
const runner = new Runner({
  modelSettings: {
    temperature: 0.3,
    maxTokens: 500
  }
});
```

## Running Agents

### Basic Execution

```typescript
import { Agent, run } from '@openai/agents';

const agent = new Agent({
  name: 'Math Tutor',
  instructions: 'Help students with math problems.'
});

const result = await run(agent, 'What is 2 + 2?');
console.log(result.finalOutput); // "4"
```

### Advanced Execution with Runner

```typescript
import { Runner } from '@openai/agents';

const runner = new Runner({
  maxTurns: 20,
  modelSettings: { temperature: 0.7 }
});

const result = await runner.run(agent, 'Complex multi-step problem', {
  context: { userId: '123', preferences: {} },
  stream: false
});
```

### Handling Results

```typescript
const result = await run(agent, 'Query');

// Access different result properties
console.log(result.finalOutput);      // Final response
console.log(result.history);          // Conversation history
console.log(result.newItems);         // Generated items
console.log(result.lastAgent);        // Last agent that ran
console.log(result.state);            // Serializable state
```

## Tools

### Function Tools

```typescript
import { tool } from '@openai/agents';
import { z } from 'zod';

const weatherTool = tool({
  name: 'get_weather',
  description: 'Get current weather for a city',
  parameters: z.object({
    city: z.string().describe('The city name'),
    units: z.enum(['celsius', 'fahrenheit']).default('celsius')
  }),
  async execute({ city, units }) {
    // Call weather API
    const weather = await fetchWeather(city, units);
    return `Weather in ${city}: ${weather.temperature}°${units === 'celsius' ? 'C' : 'F'}, ${weather.description}`;
  }
});

const agent = new Agent({
  name: 'Weather Assistant',
  instructions: 'Help users with weather information.',
  tools: [weatherTool]
});
```

### Tool Categories

1. **Function Tools**: Custom JavaScript functions
2. **Hosted Tools**: OpenAI-provided tools (web search, code interpreter)
3. **Agent Tools**: Other agents as tools
4. **MCP Tools**: Model Context Protocol servers

### Agent as Tool

```typescript
const specialistAgent = new Agent({
  name: 'Specialist',
  instructions: 'You are a domain specialist.'
});

const generalAgent = new Agent({
  name: 'General Assistant',
  tools: [specialistAgent.asTool()]
});
```

### Tool Best Practices

- Use clear, explicit descriptions
- Validate inputs with Zod schemas
- Keep tools focused and small
- Handle errors gracefully
- Avoid side effects in error handlers

## Multi-Agent Systems

### Agent Handoffs

```typescript
import { handoff } from '@openai/agents';

const billingAgent = new Agent({
  name: 'Billing Specialist',
  instructions: 'Handle billing inquiries and issues.'
});

const refundAgent = new Agent({
  name: 'Refund Specialist', 
  instructions: 'Process refund requests.'
});

const triageAgent = new Agent({
  name: 'Customer Service Triage',
  instructions: 'Route customer inquiries to appropriate specialists.',
  handoffs: [billingAgent, refundAgent]
});
```

### Custom Handoff Configuration

```typescript
const customHandoff = handoff(specialistAgent, {
  toolNameOverride: 'escalate_to_specialist',
  toolDescriptionOverride: 'Escalate complex issues to a specialist',
  onHandoff: (context) => {
    console.log('Handoff initiated:', context);
  },
  inputType: z.object({
    issue: z.string(),
    priority: z.enum(['low', 'medium', 'high'])
  })
});
```

### Orchestration Patterns

#### 1. LLM-Driven Orchestration
```typescript
const orchestratorAgent = new Agent({
  name: 'Task Orchestrator',
  instructions: `
    You coordinate between different specialist agents.
    Use your judgment to determine which agent should handle each task.
  `,
  handoffs: [dataAgent, analysisAgent, reportAgent]
});
```

#### 2. Code-Driven Orchestration
```typescript
async function processRequest(input: string) {
  // Categorize the request
  const category = await run(categoryAgent, input);
  
  // Route to appropriate agent
  let result;
  switch(category.finalOutput) {
    case 'technical':
      result = await run(techAgent, input);
      break;
    case 'billing':
      result = await run(billingAgent, input);
      break;
    default:
      result = await run(generalAgent, input);
  }
  
  return result;
}
```

## Context Management

### Local Context

```typescript
interface AppContext {
  userId: string;
  userPreferences: any;
  sessionData: any;
}

const result = await run(agent, 'Help me', {
  context: {
    userId: '123',
    userPreferences: { theme: 'dark' },
    sessionData: { lastAction: 'login' }
  }
});
```

### Accessing Context in Tools

```typescript
const userTool = tool({
  name: 'get_user_info',
  description: 'Get current user information',
  parameters: z.object({}),
  async execute({}, context: AppContext) {
    return `User ID: ${context.userId}`;
  }
});
```

### Agent Context (LLM Visible)

```typescript
const agent = new Agent({
  name: 'Personal Assistant',
  instructions: (context: AppContext) => `
    You are assisting user ${context.userId}.
    Their preferences: ${JSON.stringify(context.userPreferences)}
    Remember to personalize responses based on their settings.
  `
});
```

## Guardrails

### Input Guardrails

```typescript
import { guardrail } from '@openai/agents';

const inputGuardrail = guardrail({
  name: 'content_filter',
  async execute(input: string) {
    if (input.includes('inappropriate_content')) {
      return {
        allowed: false,
        reason: 'Content violates policy'
      };
    }
    return { allowed: true };
  }
});

const runner = new Runner({
  inputGuardrails: [inputGuardrail]
});
```

### Output Guardrails

```typescript
const outputGuardrail = guardrail({
  name: 'safety_check',
  async execute(output: string) {
    // Use another agent for safety checking
    const safetyAgent = new Agent({
      name: 'Safety Checker',
      instructions: 'Determine if the response is safe and appropriate.'
    });
    
    const result = await run(safetyAgent, `Check this response: ${output}`);
    
    if (result.finalOutput.includes('unsafe')) {
      return {
        allowed: false,
        reason: 'Response failed safety check'
      };
    }
    
    return { allowed: true };
  }
});

const runner = new Runner({
  outputGuardrails: [outputGuardrail]
});
```

## Streaming

### Basic Streaming

```typescript
const stream = await runner.run(agent, 'Tell me a story', { 
  stream: true 
});

for await (const event of stream) {
  if (event.type === 'agent_output') {
    console.log('Agent output:', event.data);
  }
}

// Wait for completion
const result = await stream.completed;
```

### Text-Only Streaming

```typescript
const stream = await runner.run(agent, 'Write a poem', { 
  stream: true 
});

const textStream = stream.toTextStream();

// Pipe to stdout
textStream.pipe(process.stdout);

// Or collect text manually
for await (const textChunk of textStream) {
  console.log(textChunk);
}
```

### Event Types

```typescript
for await (const event of stream) {
  switch (event.type) {
    case 'agent_output':
      console.log('Agent response:', event.data);
      break;
    case 'tool_call':
      console.log('Tool called:', event.data.name);
      break;
    case 'handoff':
      console.log('Handoff to:', event.data.targetAgent);
      break;
    case 'error':
      console.error('Error:', event.data);
      break;
  }
}
```

## Human-in-the-Loop

### Tool Approval

```typescript
const sensitiveActionTool = tool({
  name: 'delete_file',
  description: 'Delete a file from the system',
  parameters: z.object({
    filename: z.string()
  }),
  requiresApproval: true, // Always require approval
  async execute({ filename }) {
    // Delete file logic
    return `File ${filename} deleted successfully`;
  }
});
```

### Dynamic Approval

```typescript
const paymentTool = tool({
  name: 'process_payment',
  description: 'Process a payment',
  parameters: z.object({
    amount: z.number(),
    currency: z.string()
  }),
  requiresApproval: ({ amount }) => amount > 1000, // Approve large amounts
  async execute({ amount, currency }) {
    // Payment processing logic
    return `Payment of ${amount} ${currency} processed`;
  }
});
```

### Handling Interruptions

```typescript
const result = await runner.run(agent, 'Process this order');

if (result.interruptions && result.interruptions.length > 0) {
  // Present interruptions to user
  for (const interruption of result.interruptions) {
    console.log(`Approval needed: ${interruption.toolCall.name}`);
    console.log(`Parameters: ${JSON.stringify(interruption.toolCall.parameters)}`);
    
    // Get user approval
    const approved = await getUserApproval(interruption);
    
    if (approved) {
      interruption.approve();
    } else {
      interruption.reject('User declined');
    }
  }
  
  // Resume execution
  const finalResult = await runner.resume(result.state);
  console.log(finalResult.finalOutput);
}
```

## Error Handling

### Common Error Types

```typescript
import { MaxTurnsExceededError, GuardrailError } from '@openai/agents';

try {
  const result = await run(agent, 'Complex task');
} catch (error) {
  if (error instanceof MaxTurnsExceededError) {
    console.log('Agent exceeded maximum turns');
  } else if (error instanceof GuardrailError) {
    console.log('Guardrail blocked execution:', error.reason);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Cancellation

```typescript
const controller = new AbortController();

// Cancel after 30 seconds
setTimeout(() => controller.abort(), 30000);

try {
  const result = await runner.run(agent, 'Long running task', {
    signal: controller.signal
  });
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Operation cancelled');
  }
}
```

## Advanced Features

### Structured Output

```typescript
import { z } from 'zod';

const analysisSchema = z.object({
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  confidence: z.number().min(0).max(1),
  keywords: z.array(z.string())
});

const agent = new Agent({
  name: 'Text Analyzer',
  instructions: 'Analyze text and return structured results.',
  outputSchema: analysisSchema
});

const result = await run(agent, 'This is a great product!');
// result.finalOutput is now typed and validated
```

### Agent Cloning

```typescript
const baseAgent = new Agent({
  name: 'Base Assistant',
  instructions: 'You are a helpful assistant.'
});

const specializedAgent = baseAgent.clone({
  name: 'Specialized Assistant',
  instructions: 'You are a specialized technical assistant.',
  tools: [technicalTool]
});
```

### Lifecycle Hooks

```typescript
const agent = new Agent({
  name: 'Monitored Agent',
  instructions: 'You are a monitored assistant.',
  hooks: {
    beforeRun: (context) => {
      console.log('Agent starting:', context);
    },
    afterRun: (context, result) => {
      console.log('Agent finished:', result);
    },
    onError: (context, error) => {
      console.error('Agent error:', error);
    }
  }
});
```

## Best Practices

### Agent Design
1. **Clear Instructions**: Write specific, unambiguous instructions
2. **Single Responsibility**: Keep each agent focused on one domain
3. **Error Handling**: Always handle potential failures
4. **Context Management**: Use context efficiently
5. **Testing**: Test agents thoroughly with various inputs

### Tool Development
1. **Descriptive Names**: Use clear, action-oriented names
2. **Input Validation**: Always validate tool parameters
3. **Error Messages**: Provide helpful error messages
4. **Documentation**: Document tool behavior clearly
5. **Idempotency**: Make tools safe to retry

### Performance Optimization
1. **Model Selection**: Choose appropriate models for tasks
2. **Token Management**: Monitor and optimize token usage
3. **Caching**: Cache expensive operations
4. **Batching**: Batch similar operations when possible
5. **Streaming**: Use streaming for better user experience

### Security Considerations
1. **Input Sanitization**: Validate all user inputs
2. **Output Filtering**: Use guardrails for sensitive content
3. **Access Control**: Implement proper authentication
4. **Audit Logging**: Log important agent actions
5. **Rate Limiting**: Prevent abuse with rate limits

## Example Complete Implementation

```typescript
import { Agent, Runner, tool, handoff, guardrail } from '@openai/agents';
import { z } from 'zod';

// Define tools
const calculatorTool = tool({
  name: 'calculate',
  description: 'Perform mathematical calculations',
  parameters: z.object({
    expression: z.string()
  }),
  async execute({ expression }) {
    try {
      return `Result: ${eval(expression)}`;
    } catch (error) {
      return 'Invalid mathematical expression';
    }
  }
});

// Define specialized agents
const mathAgent = new Agent({
  name: 'Math Specialist',
  instructions: 'You are a mathematics specialist. Help with calculations and math problems.',
  tools: [calculatorTool]
});

const generalAgent = new Agent({
  name: 'General Assistant',
  instructions: 'You are a helpful general assistant. For math problems, use the math specialist.',
  handoffs: [mathAgent]
});

// Define guardrails
const safetyGuardrail = guardrail({
  name: 'safety_check',
  async execute(output: string) {
    if (output.toLowerCase().includes('harmful')) {
      return { allowed: false, reason: 'Potentially harmful content' };
    }
    return { allowed: true };
  }
});

// Create runner with configuration
const runner = new Runner({
  maxTurns: 15,
  outputGuardrails: [safetyGuardrail],
  modelSettings: {
    temperature: 0.7
  }
});

// Usage example
async function chatWithAgent(userInput: string) {
  try {
    const result = await runner.run(generalAgent, userInput, {
      context: {
        sessionId: Date.now().toString(),
        userPreferences: {}
      },
      stream: false
    });

    return result.finalOutput;
  } catch (error) {
    console.error('Agent execution error:', error);
    return 'I apologize, but I encountered an error processing your request.';
  }
}

// Example usage
chatWithAgent('What is 15 * 23?').then(console.log);
```

This comprehensive guide provides everything needed to implement sophisticated AI agents with the OpenAI Agents SDK.