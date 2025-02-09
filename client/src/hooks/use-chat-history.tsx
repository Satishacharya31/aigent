import { useState, useEffect } from 'react';

interface ChatMessage {
  type: 'user' | 'assistant';
  content: string;
}

export function useChatHistory(initialMessages: ChatMessage[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const savedMessages = localStorage.getItem('chat_history');
    return savedMessages ? JSON.parse(savedMessages) : initialMessages;
  });

  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
  }, [messages]);

  const addMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem('chat_history');
  };

  return {
    messages,
    addMessage,
    clearHistory
  };
}
