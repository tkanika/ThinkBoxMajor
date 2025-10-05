import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['text', 'image', 'pdf', 'url'],
    default: 'text'
  },
  tags: [{
    type: String,
    trim: true
  }],
  fileUrl: {
    type: String,
    default: null // For images, PDFs, etc.
  },
  url: {
    type: String,
    default: null // For bookmark URLs
  },
  urlTitle: {
    type: String,
    default: null
  },
  urlDescription: {
    type: String,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  embedding: {
    type: [Number],
    default: null // Vector embedding for AI search
  },
  extractedText: {
    type: String,
    default: null // Text extracted from PDFs or images for embedding
  }
}, {
  timestamps: true
});

// Index for vector search (if using MongoDB Atlas Vector Search)
noteSchema.index({ embedding: '2dsphere' });
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ tags: 1 });

export default mongoose.model('Note', noteSchema);
