import express from 'express';
import Note from '../models/Note.js';
import auth from '../middleware/auth.js';
import { generateEmbedding, cosineSimilarity, generateAIResponse } from '../services/aiService.js';

const router = express.Router();

// AI Chat endpoint - answer questions based on user's notes
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, limit = 5 } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Generate embedding for the user's question
    const queryEmbedding = await generateEmbedding(message);
    
    if (!queryEmbedding) {
      return res.status(500).json({ message: 'Error processing your question' });
    }

    // Find most relevant notes
    const notes = await Note.find({ 
      userId: req.user._id,
      embedding: { $exists: true, $ne: null }
    });

    // Calculate similarity scores and get top relevant notes
    const scoredNotes = notes.map(note => ({
      ...note.toObject(),
      similarity: cosineSimilarity(queryEmbedding, note.embedding)
    }));

    const relevantNotes = scoredNotes
      .filter(note => note.similarity > 0.15) // Higher threshold for chat
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    // Generate AI response using the relevant notes
    const aiResponse = await generateAIResponse(message, relevantNotes);

    res.json({
      message,
      response: aiResponse,
      sources: relevantNotes.map(note => ({
        _id: note._id,
        title: note.title,
        type: note.type,
        similarity: Math.round(note.similarity * 100) / 100,
        snippet: note.content ? note.content.substring(0, 150) + '...' : 
                note.extractedText ? note.extractedText.substring(0, 150) + '...' : 
                'No content preview available'
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate insights for a specific note
router.post('/insights/:noteId', auth, async (req, res) => {
  try {
    const { type, content: providedContent, title: providedTitle } = req.body; // 'summarize' or 'flashcards'
    
    let content = '';
    let note = null;
    let title;
    
    // Handle case for new notes (noteId = "new")
    if (req.params.noteId === 'new') {
      content = providedContent || providedTitle || '';
      title = providedTitle || 'New Note';
      
      if (!content.trim()) {
        return res.status(400).json({ message: 'Content is required for generating insights' });
      }
    } else {
      // Handle existing notes
      note = await Note.findOne({ 
        _id: req.params.noteId, 
        userId: req.user._id 
      });

      if (!note) {
        return res.status(404).json({ message: 'Note not found' });
      }

      content = note.content || note.extractedText || note.title;
      title = note.title;
    }
    
    let prompt = '';
    
    if (type === 'summarize') {
      prompt = `Please provide a concise summary of the following note:

Title: ${title}
Content: ${content}

Summary:`;
    } else if (type === 'flashcards') {
      prompt = `Based on the following note, create 3-5 flashcard questions and answers that would help someone study this material:

Title: ${title}
Content: ${content}

Please format as:
Q: [Question]
A: [Answer]

Flashcards:`;
    }

    // Use the same AI service that handles fallbacks
    const aiResponse = await generateAIResponse(prompt, []);
    
    res.json({
      type,
      noteId: req.params.noteId,
      insight: aiResponse
    });
  } catch (error) {
    console.error('AI Insights Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
