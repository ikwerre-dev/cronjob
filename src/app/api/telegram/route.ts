import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('Starting Telegram message processing');
  
  try {
    const { message } = await request.json();
    console.log('Received message:', message);
    
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Missing Telegram credentials:', {
        hasToken: !!TELEGRAM_BOT_TOKEN,
        hasChatId: !!TELEGRAM_CHAT_ID
      });
      throw new Error('Missing Telegram credentials');
    }
    
    console.log('Sending message to Telegram API');
    console.log( `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`)
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Telegram API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error('Failed to send message to Telegram');
    }

    console.log('Successfully sent message to Telegram');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in Telegram route:', error);
    return NextResponse.json({ error: 'Failed to send message to Telegram' }, { status: 500 });
  }
}