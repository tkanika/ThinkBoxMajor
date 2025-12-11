import express from 'express';
import Note from '../models/Note.js';
import auth from '../middleware/auth.js';
import { upload, uploadToCloudinary } from '../config/cloudinary.js';
import { generateEmbedding } from '../services/aiService.js';
import mammoth from 'mammoth';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Get all unique tags for user (simpler endpoint)
router.get('/tags', auth, async (req, res) => {
  try {
    const tags = await Note.distinct('tags', { userId: req.user._id });
    res.json({ tags: tags.filter(tag => tag) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download PDF file from local storage (must be before /:id route)
router.get('/:id/download', auth, async (req, res) => {
  try {
    
    const note = await Note.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if file is on Cloudinary or local
    if (note.fileUrl.startsWith('http://') || note.fileUrl.startsWith('https://')) {
      // File is on Cloudinary, redirect to it
      return res.redirect(note.fileUrl);
    }

    // File is stored locally
    // Extract filename from fileUrl, decode URL encoding, and remove double extension
    let filename = note.fileUrl.split('/').pop();
    filename = decodeURIComponent(filename);
    
    // Remove double .pdf.pdf extension if present
    filename = filename.replace('.pdf.pdf', '.pdf');
    
    // Construct absolute path to the PDF file
    const filePath = path.join(__dirname, '..', 'uploads', 'pdfs', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server', path: filePath });
    }

    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', fs.statSync(filePath).size);
    
    // Stream file to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming file' });
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Download failed', error: error.message });
    }
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
        const isPdf = req.file.mimetype === 'application/pdf' || 
                      req.file.originalname.toLowerCase().endsWith('.pdf');
        
        // Save PDFs locally, others to Cloudinary
        if (isPdf) {
          // Create uploads/pdfs directory if it doesn't exist
          const uploadDir = path.join(__dirname, '..', 'uploads', 'pdfs');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          // Save PDF file locally
          const filePath = path.join(uploadDir, filename);
          fs.writeFileSync(filePath, req.file.buffer);
          
          // Store relative path in database
          noteData.fileUrl = `/uploads/pdfs/${filename}`;
          console.log('PDF saved locally:', filePath);
        } else {
          // Upload non-PDF files to Cloudinary
          const result = await uploadToCloudinary(req.file.buffer, filename, req.file.mimetype);
          noteData.fileUrl = result.secure_url;
        }
        
        // Extract text from different file types
        let extractedText = '';
        
        console.log('Processing file:', req.file.originalname, '| Type:', req.file.mimetype);
        
        if (req.file.mimetype === 'text/plain' || req.file.originalname.toLowerCase().endsWith('.txt')) {
          extractedText = req.file.buffer.toString('utf-8');
        } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                   req.file.mimetype === 'application/msword' ||
                   req.file.originalname.toLowerCase().endsWith('.docx') ||
                   req.file.originalname.toLowerCase().endsWith('.doc')) {
          try {
            const result = await mammoth.extractRawText({ buffer: req.file.buffer });
            extractedText = result.value;
          } catch (docxError) {
            console.error('DOCX extraction error:', docxError.message);
            extractedText = content || title;
          }
        } else {          
          if (isPdf) {
            try {
              const pdfData = await pdfParse(req.file.buffer);
              extractedText = pdfData.text || '';
              
              console.log('=== PDF EXTRACTION ===');
              console.log('Pages:', pdfData.numpages);
              console.log('Text length:', extractedText.length);
              console.log('First 200 chars:', extractedText.substring(0, 200));
              console.log('=====================\n');
              
              if (extractedText.length < 100) {
                console.warn('⚠️ Scanned/image-based PDF - needs OCR');
                extractedText = `[PDF: ${req.file.originalname}]\n\nThis is a scanned/image-based PDF.\nText extraction requires OCR (not available).\n\nPlease download the file to view content.`;
              }
            } catch (pdfError) {
              console.error('PDF extraction error:', pdfError.message);
              extractedText = `[PDF: ${req.file.originalname}]\n\nError extracting text: ${pdfError.message}`;
            }
          }
        }
        
        if (extractedText && extractedText.length > 0) {
          noteData.extractedText = extractedText;
          if (!noteData.content || noteData.content.trim().length === 0 || noteData.content === noteData.title) {
            noteData.content = extractedText;
          }
        } else if (req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) {
          noteData.extractedText = `[PDF file: ${req.file.originalname}]\n\nImage-based PDF - text extraction not possible.\nDownload to view content.`;
          noteData.content = noteData.extractedText;
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
        
        // Extract text from different file types (same as create route)
        let extractedText = '';
        
        if (req.file.mimetype === 'text/plain') {
          extractedText = req.file.buffer.toString('utf-8');
        } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                   req.file.mimetype === 'application/msword') {
          try {
            const result = await mammoth.extractRawText({ buffer: req.file.buffer });
            extractedText = result.value;
          } catch (docxError) {
            console.error('DOCX extraction error:', docxError);
            extractedText = content || title;
          }
        } else if (req.file.mimetype === 'application/pdf') {
          try {
            console.log('UPDATE: Extracting text from PDF:', req.file.originalname);
            const pdfData = await pdfParse(req.file.buffer);
            extractedText = pdfData.text;
            console.log('UPDATE: PDF text extracted, length:', extractedText.length);
          } catch (pdfError) {
            console.error('UPDATE: PDF extraction error:', pdfError);
            extractedText = content || title || 'Error extracting PDF content';
          }
        }
        
        if (extractedText && extractedText.length > 0) {
          note.extractedText = extractedText;
          // Also update content if it's empty
          if (!note.content || note.content.trim().length === 0) {
            note.content = extractedText;
          }
          console.log('UPDATE: Saved extractedText to note');
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