import { NextRequest, NextResponse } from 'next/server';
import { aiAssistant } from '@/lib/ai-assistant';

/**
 * POST handler for the AI chat API endpoint.
 * Receives a message, mode, and history, and returns the AI's response.
 */
export async function POST(request: NextRequest) {
  try {
    const { message, userId, history, mode } = await request.json();
    // Optionally, you could update the AI assistant's context/history here if needed
    // For now, just pass mode to parseCommand
    const action = await aiAssistant.parseCommand(message, mode);
    // You could also execute the action if needed, or just return the parsed response
    return NextResponse.json({ response: action });
  } catch (error) {
    console.error('AI Chat API error:', error);
    return NextResponse.json({ error: 'Failed to process chat message' }, { status: 500 });
  }
}
