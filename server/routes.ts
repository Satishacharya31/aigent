import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContentSchema, insertApiKeySchema } from "@shared/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Groq } from "groq-sdk";
import { OpenAI } from "openai";
import { setupAuth } from "./auth";

// Middleware to check if user is authenticated
const requireAuth = (req: Express.Request, res: Express.Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export function registerRoutes(app: Express): Server {
  // Set up authentication routes
  setupAuth(app);

  // API Key management
  app.get("/api/settings/api-keys", requireAuth, async (req, res) => {
    const apiKeys = await storage.getApiKeys(req.user!.id);
    res.json(apiKeys);
  });

  app.post("/api/settings/api-keys", requireAuth, async (req, res) => {
    const data = insertApiKeySchema.parse(req.body);
    const apiKey = await storage.createApiKey(req.user!.id, data);
    res.json(apiKey);
  });

  app.delete("/api/settings/api-keys/:id", requireAuth, async (req, res) => {
    await storage.deleteApiKey(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // Content generation with multiple AI models
  app.post("/api/generate", requireAuth, async (req, res) => {
    try {
      const { prompt, model } = req.body;
      const contentType = detectContentType(prompt);
      let content;

      if (model.startsWith('llama')) {
        // Groq model
        const groqKey = await storage.getApiKey(req.user!.id, 'groq');
        if (!groqKey) throw new Error("Groq API key not found");

        const groq = new Groq({ apiKey: groqKey.apiKey });
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `Generate ${contentType} content that is SEO-optimized and human-like.`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          model,
          temperature: 0.7,
        });
        content = completion.choices[0]?.message?.content;
      } else if (model.startsWith('gpt')) {
        // OpenAI model
        const openaiKey = await storage.getApiKey(req.user!.id, 'openai');
        if (!openaiKey) throw new Error("OpenAI API key not found");

        const openai = new OpenAI({ apiKey: openaiKey.apiKey });
        const completion = await openai.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `Generate ${contentType} content that is SEO-optimized and human-like.`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          model,
        });
        content = completion.choices[0]?.message?.content;
      } else if (model.startsWith('gemini')) {
        // Gemini model
        const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const genModel = gemini.getGenerativeModel({ model: "gemini-pro" });
        const result = await genModel.generateContent([prompt]);
        content = result.response.text();
      } else if (model.startsWith('claude')) {
        const anthropicKey = await storage.getApiKey(req.user!.id, 'anthropic');
        if (!anthropicKey) throw new Error("Anthropic API key not found");

        // Use Anthropic's API (Add Anthropic SDK implementation)
        throw new Error("Claude models not implemented yet");
      } else if (model.startsWith('deepseek')) {
        const deepseekKey = await storage.getApiKey(req.user!.id, 'deepseek');
        if (!deepseekKey) throw new Error("DeepSeek API key not found");

        // Use DeepSeek's API (Add DeepSeek SDK implementation)
        throw new Error("DeepSeek models not implemented yet");
      }

      if (!content) {
        throw new Error("Failed to generate content");
      }

      const contentData = {
        title: prompt.slice(0, 50),
        content,
        type: contentType,
        model,
      };

      const validatedContent = insertContentSchema.parse(contentData);
      const savedContent = await storage.createContent(req.user!.id, validatedContent);

      res.json({ content: savedContent.content });
    } catch (error: any) {
      console.error('Content generation failed:', error);
      res.status(500).json({ message: error.message || "Failed to generate content" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function detectContentType(prompt: string): 'blog' | 'facebook' | 'script' {
  const lowercasePrompt = prompt.toLowerCase();

  if (lowercasePrompt.includes('blog') || 
      lowercasePrompt.includes('article') || 
      lowercasePrompt.includes('post')) {
    return 'blog';
  } else if (lowercasePrompt.includes('facebook') || 
             lowercasePrompt.includes('social media') || 
             lowercasePrompt.includes('fb')) {
    return 'facebook';
  } else if (lowercasePrompt.includes('script') || 
             lowercasePrompt.includes('video') || 
             lowercasePrompt.includes('dialogue')) {
    return 'script';
  }

  // Default to blog if no specific type is detected
  return 'blog';
}