import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { generateContent, type AIModel, modelProviders } from '@/lib/ai-client';
import { Send, Loader2, Bot, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { useChatHistory } from '@/hooks/use-chat-history';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  type: 'user' | 'assistant';
  content: string;
}

interface ChatWindowProps {
  onContentGenerated: (content: string) => void;
}

export function ChatWindow({ onContentGenerated }: ChatWindowProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemini-pro');
  const { messages, addMessage } = useChatHistory([{
    type: 'assistant',
    content: "Hi! I'm your AI assistant. I can help you create various types of content or just chat about any topic. To generate content, just ask me to create something specific like 'Write a blog post about AI' or 'Create a Facebook post about our new product'."
  }]);
  const { toast } = useToast();

  // Fetch API keys to determine available models
  const { data: apiKeys } = useQuery({
    queryKey: ['/api/settings/api-keys'],
  });

  const getAvailableModels = useCallback(() => {
    const availableProviders = new Set(['Google']); // Gemini is always available

    apiKeys?.forEach(key => {
      if (key.provider === 'openai') availableProviders.add('OpenAI');
      if (key.provider === 'anthropic') availableProviders.add('Anthropic');
      if (key.provider === 'deepseek') availableProviders.add('DeepSeek');
    });

    return modelProviders.filter(provider => availableProviders.has(provider.name));
  }, [apiKeys]);

  // Update selected model if it becomes unavailable
  useEffect(() => {
    const availableModels = getAvailableModels().flatMap(p => p.models);
    if (!availableModels.includes(selectedModel)) {
      setSelectedModel('gemini-pro'); // Default to Gemini if selected model is no longer available
    }
  }, [apiKeys, selectedModel]);

  const isContentGenerationPrompt = (text: string): boolean => {
    const generationKeywords = ['create', 'write', 'generate', 'make'];
    return generationKeywords.some(keyword => text.toLowerCase().includes(keyword));
  };

  const handleSubmit = async () => {
    if (!prompt) return;

    // Add user message to chat
    const userMessage: Message = { type: 'user', content: prompt };
    addMessage(userMessage);

    setLoading(true);
    try {
      if (isContentGenerationPrompt(prompt)) {
        // Handle content generation
        const result = await generateContent(prompt, selectedModel);
        onContentGenerated(result.content);

        // Add AI response about generation
        addMessage({
          type: 'assistant',
          content: "I've generated your content! You can view and edit it in the content panel. Would you like me to help you refine it further?"
        });

        toast({
          title: "Content Generated",
          description: "Your content has been generated successfully!",
        });
      } else {
        // Simple chat response
        addMessage({
          type: 'assistant',
          content: "I understand you want to chat. I'm here to help! If you'd like me to generate content, just ask me to create something specific."
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setPrompt('');
    }
  };

  return (
    <Card className="h-full flex flex-col p-6 border-0 bg-transparent">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bot className="w-10 h-10 text-blue-500" />
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">AI Assistant</h2>
            <p className="text-sm text-gray-500">Powered by advanced AI</p>
          </div>
        </div>
        <Select value={selectedModel} onValueChange={(value: AIModel) => setSelectedModel(value)}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select Model" />
          </SelectTrigger>
          <SelectContent>
            {getAvailableModels().map(provider => (
              <SelectGroup key={provider.name}>
                <SelectLabel className="font-semibold">{provider.name}</SelectLabel>
                {provider.models.map(model => (
                  <SelectItem 
                    key={model} 
                    value={model}
                    className="pl-6"
                  >
                    {model}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-grow overflow-y-auto mb-6 space-y-4 custom-scrollbar">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white ml-4'
                  : 'bg-gray-100 text-gray-800 mr-4'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Textarea 
              placeholder="Type your message or ask me to generate content..." 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="min-h-[100px] bg-white pr-24 resize-none"
            />
            <Button 
              onClick={handleSubmit}
              disabled={loading || !prompt}
              className="absolute bottom-2 right-2"
              size="sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Working...
                </>
              ) : isContentGenerationPrompt(prompt) ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}