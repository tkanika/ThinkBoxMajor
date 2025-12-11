import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate embeddings with better fallback strategy
const generateEmbedding = async (text) => {
  // Simple but effective TF-IDF-like embedding
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const wordCount = {};
  
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
  const meaningfulWords = words.filter(word => !commonWords.includes(word) && word.length > 2);
  
  // Create a more sophisticated embedding
  const embedding = new Array(384).fill(0);
  
  // Use word frequency and position for better semantic representation
  meaningfulWords.forEach((word, index) => {
    const position = Math.min(index, 383);
    const frequency = wordCount[word] / words.length;
    const wordHash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 384;
    
    embedding[position] = frequency;
    embedding[wordHash] = (embedding[wordHash] || 0) + frequency * 0.5;
  });
  
  // Normalize the vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] = embedding[i] / magnitude;
    }
  }
  
  return embedding;
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
    // Use Gemini 1.5 Flash (correct model name)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Check if this is a greeting or general query
    const greetings = ['hi', 'hello', 'hey', 'greetings'];
    const isGreeting = greetings.some(greeting => 
      query.toLowerCase().trim() === greeting || 
      query.toLowerCase().startsWith(greeting + ' ') ||
      query.toLowerCase().startsWith(greeting + ',')
    );
    
    let prompt;
    
    if (relevantNotes.length === 0 && !isGreeting) {
      // No relevant notes found, but try to answer anyway using Gemini
      prompt = `The user asked: "${query}"

I don't have specific notes from their knowledge base to reference. Please provide a helpful, friendly response that:
1. Acknowledges their question
2. Provides a brief, general answer if possible
3. Suggests they create notes about this topic for future reference

Keep the response concise and helpful.`;
    } else if (isGreeting || relevantNotes.length === 0) {
      // Handle greetings or general queries
      prompt = `The user said: "${query}"

Please provide a friendly, helpful greeting and briefly explain what you can help them with. Mention that you can:
- Answer questions based on their notes
- Help them search through their knowledge base
- Provide summaries and insights
- Create flashcards from their notes

Keep it warm and concise.`;
    } else {
      // Normal query with relevant notes
      const context = relevantNotes.map(note => {
        const content = note.content || note.extractedText || 'No content';
        // Limit content length to avoid overwhelming the AI
        const truncatedContent = content.length > 1000 ? content.substring(0, 1000) + '...' : content;
        return `Title: ${note.title}\nContent: ${truncatedContent}\nTags: ${(note.tags && Array.isArray(note.tags)) ? note.tags.join(', ') : 'No tags'}`;
      }).join('\n\n---\n\n');
      
      prompt = `Based on the following notes from the user's knowledge base, please answer their question: "${query}"

Context from user's notes:
${context}

Instructions:
1. Answer the specific question asked - DO NOT just repeat the entire note content
2. Extract only the relevant information that answers the question
3. Be concise and direct
4. If the answer is a specific fact (like a date, name, or event), provide just that fact
5. If the notes don't contain the answer, say so clearly

Please provide a focused answer based only on what's relevant to the question.`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating AI response:', error);
    
    // Return a simple error message instead of dumping all content
    if (relevantNotes.length === 0) {
      return `I couldn't find any relevant notes for "${query}". Try creating some notes first, or use different search terms.`;
    }
    
    // Try to extract a simple answer from the first relevant note
    const topNote = relevantNotes[0];
    const content = topNote.content || topNote.extractedText || '';
    
    return `I found information in your note "${topNote.title}", but I'm having trouble processing it right now. Please check the note directly or try rephrasing your question.

Note: AI features are experiencing issues. Please ensure your Gemini API key is configured correctly.`;
  }
};

export { generateEmbedding, cosineSimilarity, generateAIResponse };