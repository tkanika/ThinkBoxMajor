import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Simple embedding function using a free API (you can replace this with Hugging Face)
const generateEmbedding = async (text) => {
  try {
    // Using a simple approach - you can replace this with sentence-transformers API
    // For now, we'll create a simple text-based similarity using word frequency
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const wordCount = {};
    
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Create a simple vector representation
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const meaningfulWords = words.filter(word => !commonWords.includes(word) && word.length > 2);
    
    // Create a 100-dimension vector (simplified approach)
    const embedding = new Array(100).fill(0);
    meaningfulWords.slice(0, 100).forEach((word, index) => {
      embedding[index] = (wordCount[word] || 0) / words.length;
    });
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
};

// Calculate cosine similarity between two vectors
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Generate AI response using Gemini
const generateAIResponse = async (query, relevantNotes) => {
  try {
    // Try using Gemini first
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const context = relevantNotes.map(note => 
      `Title: ${note.title}\nContent: ${note.content || note.extractedText || 'No content'}\nTags: ${note.tags.join(', ')}`
    ).join('\n\n---\n\n');
    
    const prompt = `Based on the following notes from the user's knowledge base, please answer their question: "${query}"

Context from user's notes:
${context}

Please provide a helpful and accurate response based on the information available in these notes. If the notes don't contain enough information to fully answer the question, please mention that and suggest what additional information might be helpful.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating AI response:', error);
    
    // Fallback to a simple rule-based response
    const context = relevantNotes.map(note => 
      `Title: ${note.title}\nContent: ${note.content || note.extractedText || 'No content'}\nTags: ${note.tags.join(', ')}`
    ).join('\n\n---\n\n');
    
    if (relevantNotes.length === 0) {
      return `I couldn't find any relevant notes for "${query}". Try creating some notes first, or use different search terms.`;
    }
    
    return `Based on your ${relevantNotes.length} relevant note(s), here's what I found:

${context}

Note: AI features are currently limited. Please ensure your Gemini API key is configured correctly for full AI capabilities.`;
  }
};

export { generateEmbedding, cosineSimilarity, generateAIResponse };
