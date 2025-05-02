import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const data = await fs.readFile(path.join(process.cwd(), 'data', 'list.json'), 'utf-8');
    const { websites } = JSON.parse(data);
    
    if (!Array.isArray(websites)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 500 });
    }

    return NextResponse.json({
      websites
    });
  } catch (error) {
    console.error('Error reading websites:', error);
    return NextResponse.json({ error: 'Failed to load websites' }, { status: 500 });
  }
}