import express from 'express';
import Note from '../models/Note.js';
import auth from '../middleware/auth.js';
import { generateEmbedding, cosineSimilarity } from '../services/aiService.js';

const router = express.Router();

// Semantic search endpoint
router.get('/', auth, async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);
    
    if (!queryEmbedding) {
      return res.status(500).json({ message: 'Error processing search query' });
    }

    // Get all notes for the user that have embeddings
    const notes = await Note.find({ 
      userId: req.user._id,
      embedding: { $exists: true, $ne: null }
    });

    // Calculate similarity scores
    const scoredNotes = notes.map(note => ({
      ...note.toObject(),
      similarity: cosineSimilarity(queryEmbedding, note.embedding)
    }));

    // Sort by similarity and return top results
    const results = scoredNotes
      .filter(note => note.similarity > 0.1) // Filter out very low similarity scores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    res.json({ 
      query,
      results: results.map(note => ({
        ...note,
        similarity: Math.round(note.similarity * 100) / 100 // Round to 2 decimal places
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Traditional text search (fallback)
router.post('/text', auth, async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchRegex = new RegExp(query, 'i');
    
    const notes = await Note.find({
      userId: req.user._id,
      $or: [
        { title: searchRegex },
        { content: searchRegex },
        { tags: { $in: [searchRegex] } },
        { extractedText: searchRegex }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(limit);

    res.json({ 
      query,
      results: notes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
