# Voice AI Agent Implementation Guide

## Overview

This guide covers how to implement voice AI agents using the OpenAI Agents SDK for JavaScript. The SDK provides a complete framework for building real-time voice interactions with AI agents.

## Getting Started

### 1. Installation

```bash
npm install @openai/agents
```

### 2. Basic Setup

#### Create a Realtime Agent

```typescript
import { RealtimeAgent } from '@openai/agents-realtime';

const agent = new RealtimeAgent({
  name: 'AI Assistant',
  instructions: 'You are a helpful AI assistant.',
  // Optional: add tools for extended functionality
  tools: []
});
```

#### Create a Session

```typescript
import { RealtimeSession } from '@openai/agents-realtime';

const session = new RealtimeSession(agent, {
  model: 'gpt-4o-realtime-preview-2025-06-03',
  config: {
    inputAudioFormat: 'pcm16',
    outputAudioFormat: 'pcm16',
    turnDetection: {
      type: 'semantic_vad',
      eagerness: 'medium'
    }
  }
});
```

#### Connect to Session

```typescript
// Generate ephemeral client token first using OpenAI API
await session.connect({ apiKey: '<client-api-key>' });
```

## Transport Layers

### WebRTC (Browser Default)

WebRTC automatically handles audio recording and playback:

```typescript
import { OpenAIRealtimeWebRTC } from '@openai/agents';

const transport = new OpenAIRealtimeWebRTC({
  mediaStream: await navigator.mediaDevices.getUserMedia({ audio: true }),
  audioElement: document.createElement('audio')
});
```

### WebSocket (Server-side)

For server-side applications or when you need manual audio control:

```typescript
const wsSession = new RealtimeSession(agent, {
  transport: 'websocket',
  model: 'gpt-4o-realtime-preview-2025-06-03'
});
```

## Advanced Features

### 1. Turn Detection Configuration

```typescript
const session = new RealtimeSession(agent, {
  model: 'gpt-4o-realtime-preview-2025-06-03',
  config: {
    turnDetection: {
      type: 'semantic_vad',     // Voice Activity Detection
      eagerness: 'medium'       // Response timing
    }
  }
});
```

### 2. Adding Tools

```typescript
const weatherTool = {
  name: 'get_weather',
  description: 'Get current weather information',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'The city and state'
      }
    }
  },
  handler: async (params) => {
    // Weather API call implementation
    return { temperature: '72°F', condition: 'sunny' };
  }
};

const agent = new RealtimeAgent({
  name: 'Weather Assistant',
  instructions: 'Help users with weather information.',
  tools: [weatherTool]
});
```

### 3. Agent Handoffs

```typescript
const supportAgent = new RealtimeAgent({
  name: 'Support Agent',
  instructions: 'Handle customer support requests'
});

const salesAgent = new RealtimeAgent({
  name: 'Sales Agent',
  instructions: 'Help with sales inquiries',
  tools: [
    {
      name: 'handoff_to_support',
      handler: async () => {
        // Switch to support agent
        return { handoff: supportAgent };
      }
    }
  ]
});
```

### 4. Session Management

```typescript
// Session lifecycle management
session.on('connected', () => {
  console.log('Voice session connected');
});

session.on('disconnected', () => {
  console.log('Voice session disconnected');
});

session.on('error', (error) => {
  console.error('Session error:', error);
});

// Graceful cleanup
await session.disconnect();
```

## Alternative Models with AI SDK

For using models other than OpenAI's:

```bash
npm install @openai/agents-extensions @ai-sdk/openai
```

```typescript
import { openai } from '@ai-sdk/openai';
import { aisdk } from '@openai/agents-extensions';

const model = aisdk(openai('o4-mini'));
const agent = new Agent({
  name: 'Custom Model Agent',
  instructions: 'You are a helpful assistant.',
  model,
});
```

## Security Considerations

### 1. API Key Management

```typescript
// Generate ephemeral tokens for browser usage
const response = await fetch('/api/generate-token', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${serverApiKey}` }
});
const { token } = await response.json();

await session.connect({ apiKey: token });
```

### 2. User Authentication

```typescript
// Ensure user is authenticated before voice session
if (!user.isAuthenticated) {
  throw new Error('User must be authenticated for voice access');
}
```

### 3. Rate Limiting

```typescript
// Implement rate limiting for voice sessions
const rateLimiter = new RateLimiter({
  maxSessions: 5,
  windowMs: 60000 // 1 minute
});
```

## Browser Integration

### 1. Microphone Permissions

```typescript
async function requestMicrophoneAccess() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return stream;
  } catch (error) {
    console.error('Microphone access denied:', error);
    // Provide fallback UI
  }
}
```

### 2. Audio Element Setup

```typescript
const audioElement = document.createElement('audio');
audioElement.autoplay = true;
audioElement.controls = false;
document.body.appendChild(audioElement);
```

### 3. Browser Compatibility Check

```typescript
function isBrowserSupported() {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.RTCPeerConnection
  );
}
```

## Error Handling

### 1. Connection Errors

```typescript
try {
  await session.connect({ apiKey: token });
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    // Show network error message
  } else if (error.code === 'AUTH_ERROR') {
    // Redirect to login
  }
}
```

### 2. Audio Errors

```typescript
session.on('audio_error', (error) => {
  console.error('Audio processing error:', error);
  // Provide fallback to text-based interaction
});
```

## Best Practices

1. **Always request microphone permissions early** in the user flow
2. **Provide visual feedback** during voice interactions
3. **Implement graceful fallbacks** for unsupported browsers
4. **Use ephemeral tokens** for client-side connections
5. **Handle interruptions** gracefully (network drops, audio issues)
6. **Implement proper cleanup** when sessions end
7. **Test on multiple devices** and browsers
8. **Consider data usage** for mobile users

## Example Complete Implementation

```typescript
import { RealtimeAgent, RealtimeSession } from '@openai/agents-realtime';

class VoiceAgent {
  private agent: RealtimeAgent;
  private session: RealtimeSession;
  
  constructor() {
    this.agent = new RealtimeAgent({
      name: 'AI Manager Voice Assistant',
      instructions: 'You are a helpful AI assistant integrated with the user\'s life management system.',
      tools: []
    });
    
    this.session = new RealtimeSession(this.agent, {
      model: 'gpt-4o-realtime-preview-2025-06-03',
      config: {
        inputAudioFormat: 'pcm16',
        outputAudioFormat: 'pcm16',
        turnDetection: {
          type: 'semantic_vad',
          eagerness: 'medium'
        }
      }
    });
  }
  
  async start() {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Get ephemeral token
      const token = await this.getEphemeralToken();
      
      // Connect session
      await this.session.connect({ apiKey: token });
      
      console.log('Voice agent started successfully');
    } catch (error) {
      console.error('Failed to start voice agent:', error);
      throw error;
    }
  }
  
  async stop() {
    await this.session.disconnect();
  }
  
  private async getEphemeralToken(): Promise<string> {
    const response = await fetch('/api/voice-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get voice token');
    }
    
    const { token } = await response.json();
    return token;
  }
}
```

This comprehensive guide provides everything needed to implement voice AI agents in your application.