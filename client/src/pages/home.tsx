import { useState } from 'react';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ChatWindow } from '@/components/chat-window';
import { ContentWindow } from '@/components/content-window';
import { SiOpenai } from 'react-icons/si';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Settings2, LogOut } from 'lucide-react';

export default function Home() {
  const [content, setContent] = useState('');
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="w-full bg-white/80 backdrop-blur-sm border-b shadow-sm py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SiOpenai className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  AI Content Generator
                </h1>
                <p className="text-sm text-gray-600">Create SEO-optimized content with AI</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  Settings
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="h-[calc(100vh-8rem)]">
          <ResizablePanelGroup 
            direction="horizontal" 
            className="h-full rounded-xl overflow-hidden border shadow-lg bg-white/80 backdrop-blur-sm"
          >
            <ResizablePanel 
              defaultSize={50} 
              className="bg-gradient-to-b from-blue-50/50"
              minSize={30}
            >
              <ChatWindow onContentGenerated={setContent} />
            </ResizablePanel>
            <ResizablePanel 
              defaultSize={50}
              minSize={30}
            >
              <ContentWindow content={content} onContentChange={setContent} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </main>
    </div>
  );
}