import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function fetchWebsites() {
  try {
    const response = await fetch(`https://cronjob-one.vercel.app/api/websites`, {
      cache: 'no-store'
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetchoing website:' + error); 

    return { websites: [] };
  }
}


async function processWebsite(website: any) {
  try {
    const response = await fetch(website.url);
    await response.text();
    return 'Success';
  } catch (error) {
    await fetch('https://cronjob-one.vercel.app/api/telegram', {
      method: 'POST',
      body: JSON.stringify({
        message: `Failed to process ${website.name}: ${error}`
      })
    });
    return 'Failed';
  }
}

export async function GET() {
  try {
    const currentTime = new Date().toISOString();
    
    await fetch('https://cronjob-one.vercel.app/api/telegram', {
      method: 'POST',
      body: JSON.stringify({
        message: `--starting cron job--\n--${currentTime}--`
      })
    });

    const { websites } = await fetchWebsites();
    
    const results = await Promise.all(
      websites.map(async (website: any) => {
        const status = await processWebsite(website);
        return { ...website, status };
      })
    );

    await fetch('https://cronjob-one.vercel.app/api/telegram', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Cron job completed successfully!'
      })
    });

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}