import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SocialButtons } from './social-buttons';
import { Eye, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface ContentWindowProps {
  content: string;
  onContentChange: (content: string) => void;
}

export function ContentWindow({ content, onContentChange }: ContentWindowProps) {
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');
  const { toast } = useToast();

  const handleSocialPost = async (platform: string) => {
    toast({
      title: 'Posting Content',
      description: `Preparing to post to ${platform}...`,
    });

    try {
      const response = await fetch('/api/social/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          content,
        }),
      });

      if (!response.ok) throw new Error('Failed to post content');

      toast({
        title: 'Success',
        description: `Content posted to ${platform} successfully!`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post content. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const renderPreview = () => {
    if (!content) {
      return (
        <div className="text-gray-500 italic p-4">
          Generated content will appear here...
        </div>
      );
    }

    const htmlContent = marked(content);
    const sanitizedHtml = DOMPurify.sanitize(htmlContent);

    return (
      <div 
        className="prose prose-sm md:prose-base lg:prose-lg max-w-none dark:prose-invert p-4"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  };

  return (
    <Card className="h-full flex flex-col p-6 bg-white">
      <div className="flex justify-between items-center mb-6">
        <Tabs defaultValue="preview" value={mode} onValueChange={(value) => setMode(value as 'preview' | 'edit')}>
          <TabsList className="grid w-[200px] grid-cols-2">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit2 className="h-4 w-4" />
              Edit
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <SocialButtons onPost={handleSocialPost} />
      </div>

      <div className="flex-grow overflow-auto">
        {mode === 'preview' ? (
          <div className="h-full overflow-y-auto custom-scrollbar bg-white rounded-lg border">
            {renderPreview()}
          </div>
        ) : (
          <textarea
            className="w-full h-full p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Edit your content here..."
            style={{ minHeight: '300px' }}
          />
        )}
      </div>
    </Card>
  );
}