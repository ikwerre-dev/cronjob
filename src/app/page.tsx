'use client';

import { useState, useEffect } from 'react';

interface Website {
  id: number;
  url: string;
  name: string;
  status?: string;
}

interface PageData {
  websites: Website[];
}

export default function Home() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [processing, setProcessing] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<Map<number, string>>(new Map());
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()} - ${message}`]);
  };

  useEffect(() => {
    const sendInitialMessage = async () => {
      const currentTime = new Date().toISOString();
      await fetch('/api/telegram', {
        method: 'POST',
        body: JSON.stringify({
          message: `--starting--\n--${currentTime}--`
        })
      });
    };
    
    sendInitialMessage();
    fetchWebsites();
  }, []);

  const fetchWebsites = async () => {
    try {
      addLog('Fetching all websites');
      const response = await fetch('/api/websites');
      const data = await response.json();
      setWebsites(data.websites);
      addLog(`Successfully loaded ${data.websites.length} websites`);
      
      if (!isProcessing) {
        setIsProcessing(true);
        processWebsites(data.websites);
      }
    } catch (error) {
      const errorMessage = `Failed to fetch websites: ${error}`;
      addLog(errorMessage);
      console.error(errorMessage);
    }
  };

  const processWebsites = async (websiteList: Website[]) => {
    const processQueue = [...websiteList];
    const maxConcurrent = 2;
    const active = new Set<Promise<void>>();

    const processNext = async () => {
      if (processQueue.length === 0 && active.size === 0) {
        await fetch('/api/telegram', {
          method: 'POST',
          body: JSON.stringify({
            message: 'All websites have been processed successfully!'
          })
        });
        setIsProcessing(false);
        addLog('All websites processed successfully');
        return;
      }

      while (active.size < maxConcurrent && processQueue.length > 0) {
        const website = processQueue.shift();
        if (website) {
          const promise = processWebsite(website).then(() => {
            active.delete(promise);
            processNext();
          });
          active.add(promise);
        }
      }
    };

    await processNext();
  };

  const processWebsite = async (website: Website) => {
    if (processing.has(website.id)) return;

    setProcessing(prev => new Set([...prev, website.id]));
    addLog(`Starting to process website: ${website.name} (${website.url})`);

    try {
      await fetch('/api/telegram', {
        method: 'POST',
        body: JSON.stringify({
          message: `Starting to process website: ${website.name} (${website.url})`
        })
      });

      addLog(`Fetching content from: ${website.url}`);
      const response = await fetch(website.url);
      const result = await response.text();
      addLog(`Successfully fetched content from: ${website.url}`);

      await fetch('/api/telegram', {
        method: 'POST',
        body: JSON.stringify({
          message: `Successfully processed ${website.name}: ${result.substring(0, 100)}...`
        })
      });

      setResults(prev => new Map(prev.set(website.id, 'Success')));
      addLog(`Successfully processed website: ${website.name}`);
    } catch (error) {
      const errorMessage = `Failed to process ${website.name}: ${error}`;
      addLog(errorMessage);
      
      await fetch('/api/telegram', {
        method: 'POST',
        body: JSON.stringify({
          message: `Failed to process ${website.name}: ${error}`
        })
      });

      setResults(prev => new Map(prev.set(website.id, 'Failed')));
    } finally {
      setProcessing(prev => {
        const next = new Set(prev);
        next.delete(website.id);
        return next;
      });
    }
  };

  if (!websites.length) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Website Processor</h1>

      <div className="grid gap-4 mb-4">
        {websites.map(website => (
          <div key={website.id} className="border p-4 rounded">
            <h2 className="font-bold">{website.name}</h2>
            <p className="text-gray-600">{website.url}</p>
            <div className="mt-2">
              {processing.has(website.id) ? (
                <span className="text-blue-500">Processing...</span>
              ) : results.has(website.id) ? (
                <span className={results.get(website.id) === 'Success' ? 'text-green-500' : 'text-red-500'}>
                  {results.get(website.id)}
                </span>
              ) : (
                <span className="text-gray-500">Queued</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-100 p-4 rounded mb-4 max-h-60 overflow-y-auto">
        <h2 className="font-bold mb-2">Logs</h2>
        {logs.map((log, index) => (
          <div key={index} className="text-sm text-gray-700 mb-1">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
