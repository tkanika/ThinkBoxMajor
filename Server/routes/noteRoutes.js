import express from 'express';
import Note from '../models/Note.js';
import auth from '../middleware/auth.js';
import { upload, uploadToCloudinary } from '../config/cloudinary.js';
import { generateEmbedding } from '../services/aiService.js';

const router = express.Router();

// Get all notes for user
router.get('/', auth, async (req, res) => {
  try {
    const { tag, favorite, type, page = 1, limit = 20 } = req.query;
    
    const filter = { userId: req.user._id };
    
    if (tag) filter.tags = { $in: [tag] };
    if (favorite === 'true') filter.isFavorite = true;
    if (type) filter.type = type;

    const notes = await Note.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Note.countDocuments(filter);

    res.json({
      notes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single note
router.get('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json({ note });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new note
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const { title, content, type, tags, url, urlTitle, urlDescription } = req.body;
    
    let parsedTags = [];
    if (tags) {
      parsedTags = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags;
    }

    const noteData = {
      title,
      content: content || '',
      type: type || 'text',
      tags: parsedTags,
      userId: req.user._id,
      url,
      urlTitle,
      urlDescription
    };

    // Handle file upload
    if (req.file) {
      try {
        const filename = `${Date.now()}-${req.file.originalname}`;
        const result = await uploadToCloudinary(req.file.buffer, filename, req.file.mimetype);
        noteData.fileUrl = result.secure_url;
        
        // For PDFs and images, we might want to extract text for embedding
        // This is a simplified version - you'd want to use OCR for images and PDF parsers for PDFs
        if (type === 'pdf' || type === 'image') {
          noteData.extractedText = content || title; // Simplified - you'd extract actual text here
        }
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        if (uploadError.message && uploadError.message.includes('File size too large')) {
          return res.status(413).json({ message: 'File size too large. Maximum size is 50MB.' });
        }
        if (uploadError.message && uploadError.message.includes('timeout')) {
          return res.status(408).json({ message: 'Upload timeout. Please try again.' });
        }
        return res.status(500).json({ message: 'File upload failed. Please try again.' });
      }
    }

    // Generate embedding for AI search
    const textToEmbed = noteData.extractedText || noteData.content || noteData.title;
    if (textToEmbed) {
      noteData.embedding = await generateEmbedding(textToEmbed);
    }

    const note = new Note(noteData);
    await note.save();

    res.status(201).json({ note });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update note
router.put('/:id', auth, upload.single('file'), async (req, res) => {
  try {
    const { title, content, tags, isFavorite, url, urlTitle, urlDescription } = req.body;
    
    let parsedTags = [];
    if (tags) {
      parsedTags = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags;
    }

    const note = await Note.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Update fields
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (parsedTags.length > 0) note.tags = parsedTags;
    if (isFavorite !== undefined) note.isFavorite = isFavorite;
    if (url !== undefined) note.url = url;
    if (urlTitle !== undefined) note.urlTitle = urlTitle;
    if (urlDescription !== undefined) note.urlDescription = urlDescription;

    // Handle new file upload
    if (req.file) {
      try {
        const filename = `${Date.now()}-${req.file.originalname}`;
        const result = await uploadToCloudinary(req.file.buffer, filename, req.file.mimetype);
        note.fileUrl = result.secure_url;
        if (note.type === 'pdf' || note.type === 'image') {
          note.extractedText = content || title;
        }
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        if (uploadError.message && uploadError.message.includes('File size too large')) {
          return res.status(413).json({ message: 'File size too large. Maximum size is 50MB.' });
        }
        if (uploadError.message && uploadError.message.includes('timeout')) {
          return res.status(408).json({ message: 'Upload timeout. Please try again.' });
        }
        return res.status(500).json({ message: 'File upload failed. Please try again.' });
      }
    }

    // Regenerate embedding if content changed
    if (title !== undefined || content !== undefined) {
      const textToEmbed = note.extractedText || note.content || note.title;
      if (textToEmbed) {
        note.embedding = await generateEmbedding(textToEmbed);
      }
    }

    await note.save();

    res.json({ note });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete note
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all unique tags for user
router.get('/tags/all', auth, async (req, res) => {
  try {
    const tags = await Note.distinct('tags', { userId: req.user._id });
    res.json({ tags: tags.filter(tag => tag) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
