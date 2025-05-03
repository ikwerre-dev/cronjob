import { Suspense } from 'react';
import WebsiteProcessor from './components/WebsiteProcessor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchWebsites() {
  try {
    const response = await fetch(`https://cronjob-one.vercel.app/api/websites`, {
      cache: 'no-store'
    });
    const data = await response.json();
    return data.websites;
  } catch (error) {
    console.error('Error fetching websites:', error);
    return [];
  }
}

export default async function Home() {
  const initialWebsites = await fetchWebsites();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Website Processor</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <WebsiteProcessor initialWebsites={initialWebsites} />
      </Suspense>
    </div>
  );
}
