import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = 3;

  try {
    const data = await fs.readFile(path.join(process.cwd(), 'data', 'list.json'), 'utf-8');
    const { websites } = JSON.parse(data);
    
    if (!Array.isArray(websites)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 500 });
    }

    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedWebsites = websites.slice(start, end);
    const totalPages = Math.ceil(websites.length / perPage);

    return NextResponse.json({
      websites: paginatedWebsites,
      currentPage: page,
      totalPages,
      hasMore: page < totalPages
    });
  } catch (error) {
    console.error('Error reading websites:', error);
    return NextResponse.json({ error: 'Failed to load websites' }, { status: 500 });
  }
}