import express from 'express';
import Note from '../models/Note.js';
import auth from '../middleware/auth.js';
import { generateEmbedding, cosineSimilarity, generateAIResponse } from '../services/aiService.js';

const router = express.Router();

// AI Chat endpoint - answer questions based on user's notes
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, limit = 20, noteIds } = req.body; // Accept optional noteIds
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }
    
    console.log('AI Chat Request - User ID:', req.user._id);
    console.log('Query:', message);
    console.log('Selected Note IDs:', noteIds);

    // Generate embedding for the user's question
    const queryEmbedding = await generateEmbedding(message);
    
    if (!queryEmbedding) {
      return res.status(500).json({ message: 'Error processing your question' });
    }

    // Find notes - either specific selected notes or all user notes
    const filter = { userId: req.user._id };
    if (noteIds && noteIds.length > 0) {
      filter._id = { $in: noteIds };
    }
    
    const notes = await Note.find(filter);
    
    console.log('Total notes found for user:', notes.length);
    if (noteIds && noteIds.length > 0) {
      console.log('Filtering to selected notes:', noteIds.length);
    }

    // Extract keywords from query
    const queryLower = message.toLowerCase();
    const keywords = queryLower.split(/\s+/).filter(w => w.length > 2); // Use regex to split better
    
    console.log('Query keywords:', keywords); // Debug
    
    // Calculate similarity scores and keyword matches
    const scoredNotes = notes.map(note => {
      const noteTitle = (note.title || '').toLowerCase();
      const noteContent = (note.content || '').toLowerCase();
      const noteExtracted = (note.extractedText || '').toLowerCase();
      const noteTags = (note.tags || []).join(' ').toLowerCase();
      const allNoteText = `${noteTitle} ${noteContent} ${noteExtracted} ${noteTags}`;
      
      // Calculate embedding similarity
      let embeddingSimilarity = 0;
      if (note.embedding && queryEmbedding) {
        embeddingSimilarity = cosineSimilarity(queryEmbedding, note.embedding);
      }
      
      // Calculate keyword match score with better matching
      let keywordScore = 0;
      let titleMatches = 0;
      
      keywords.forEach(keyword => {
        // Exact title match gets highest score
        if (noteTitle.includes(keyword)) {
          keywordScore += 5; // Increased from 3
          titleMatches++;
        }
        // Tag match gets medium score
        if (noteTags.includes(keyword)) {
          keywordScore += 2;
        }
        // Content match gets lower score
        if (noteContent.includes(keyword) || noteExtracted.includes(keyword)) {
          keywordScore += 0.5; // Reduced to prioritize titles
        }
      });
      
      // Huge bonus if multiple keywords match the title
      const titleMatchBonus = titleMatches > 0 ? titleMatches * 2 : 0;
      
      // Combined score: heavily favor keyword matching in titles
      const combinedScore = (embeddingSimilarity * 0.2) + (keywordScore * 0.3) + titleMatchBonus;
      
      return {
        ...note.toObject(),
        similarity: embeddingSimilarity,
        keywordScore: keywordScore,
        combinedScore: combinedScore
      };
    });

    // Get top relevant notes based on combined score
    // Remove threshold completely to see all results
    let relevantNotes = scoredNotes
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, limit);
    
    // Debug logging
    console.log('\n=== Search Debug ===');
    console.log('Query:', message);
    console.log('Total notes found:', notes.length);
    console.log('Top 10 by combined score:');
    scoredNotes.slice(0, 10).forEach((n, i) => {
      console.log(`${i + 1}. "${n.title}" - Combined: ${n.combinedScore?.toFixed(4)}, Keywords: ${n.keywordScore}, Similarity: ${n.similarity?.toFixed(4)}`);
    });
    console.log('Relevant notes being sent to AI:', relevantNotes.length);
    console.log('===================\n');

    // If still no results, return all notes with any keyword match
    if (relevantNotes.length === 0) {
      const keywordNotes = notes.filter(note => {
        const noteText = ((note.content || '') + ' ' + (note.extractedText || '') + ' ' + note.title).toLowerCase();
        return keywords.some(keyword => noteText.includes(keyword));
      }).slice(0, limit);
      
      relevantNotes = keywordNotes.map(note => ({
        ...note,
        similarity: 0.5 // Give it a medium similarity score
      }));
    }

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