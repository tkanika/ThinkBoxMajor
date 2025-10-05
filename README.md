# ThinkBox - Personal Knowledge Base

**"Notion + ChatGPT"** - A complete Personal Knowledge Base (PKB) application built with the MERN stack, featuring AI-powered search and conversational interaction with your notes.

## 🚀 Features

### 📝 Content Management
- **Full CRUD Operations**: Create, read, update, and delete notes
- **Multiple Note Types**: 
  - Text notes with Markdown support
  - Image uploads with preview
  - PDF document storage
  - URL bookmarks with metadata
- **Smart Organization**: Tag-based organization system
- **Favorites**: Mark important notes for quick access

### 🤖 AI-Powered Features
- **Semantic Search**: Find notes based on meaning, not just keywords
- **AI Chat Interface**: Ask questions about your notes and get intelligent responses
- **Smart Insights**: Generate summaries and flashcards from your notes
- **Content Understanding**: AI processes and understands your knowledge base

### 🎨 Modern UI/UX
- **Clean Design**: Minimal, modern interface inspired by Notion and Linear
- **Responsive**: Works perfectly on desktop and mobile
- **Real-time**: Instant search and updates
- **Intuitive Navigation**: Easy-to-use sidebar and routing

## 🛠 Tech Stack

### Frontend
- **React 19** with Vite for fast development
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API communication
- **Lucide React** for icons
- **React Markdown** for content rendering

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Cloudinary** for file storage
- **Google Gemini AI** for conversational features
- **Vector embeddings** for semantic search

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- Cloudinary account (for file uploads)
- Google Gemini AI API key

### Installation

1. **Clone and setup the project**:
   ```bash
   cd ThinkBox
   ```

2. **Setup Backend**:
   ```bash
   cd Server
   npm install
   
   # Create .env file
   cp .env.example .env
   ```

3. **Configure Environment Variables**:
   Edit `Server/.env` with your credentials:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   GEMINI_API_KEY=your_gemini_api_key
   PORT=7000
   ```

4. **Setup Frontend**:
   ```bash
   cd ../Client
   npm install
   ```

5. **Start Development Servers**:
   
   Backend (Terminal 1):
   ```bash
   cd Server
   npm run dev
   ```
   
   Frontend (Terminal 2):
   ```bash
   cd Client
   npm run dev
   ```

6. **Open Application**:
   Navigate to `http://localhost:5173`

## 📚 Usage Guide

### Getting Started
1. **Register/Login**: Create an account or sign in
2. **Create Your First Note**: Click "New Note" to start building your knowledge base
3. **Organize with Tags**: Add relevant tags to make notes discoverable
4. **Upload Files**: Add images and PDFs to your notes

### AI Features
1. **Smart Search**: Use the search bar to find notes by meaning, not just keywords
2. **AI Chat**: Go to the AI Chat page to ask questions about your notes
3. **Generate Insights**: Use the AI sidebar in the note editor for summaries and flashcards

### Note Types
- **Text Notes**: Rich markdown content with formatting
- **Image Notes**: Visual content with automatic text extraction
- **PDF Notes**: Document storage with text extraction for search
- **URL Bookmarks**: Save and organize important links

## 🏗 Architecture

### Backend Structure
```
Server/
├── config/          # Database and service configurations
├── middleware/      # Authentication and request processing
├── models/         # MongoDB data models
├── routes/         # API endpoints
├── services/       # AI and external service integrations
└── server.js       # Main application entry point
```

### Frontend Structure
```
Client/src/
├── components/     # React components
├── contexts/       # Global state management
├── utils/         # Helper functions and API configuration
└── App.jsx        # Main application component
```

## 🔧 API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/me` - Get current user

### Notes
- `GET /api/notes` - Get all user notes
- `POST /api/notes` - Create new note
- `GET /api/notes/:id` - Get specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### AI Features
- `POST /api/ai/chat` - AI chat interface
- `POST /api/ai/insights/:noteId` - Generate insights
- `POST /api/search` - Semantic search

## 🌟 Key Features Explained

### Semantic Search
The application uses vector embeddings to understand the meaning of your content, not just matching keywords. This allows you to find relevant notes even when you don't remember the exact words used.

### AI Chat Interface
Ask natural language questions about your knowledge base. The AI will:
- Find relevant notes using semantic search
- Generate comprehensive answers based on your content
- Provide clickable references to source notes
- Maintain conversation context

### Smart File Handling
- **Images**: Automatic preview and text extraction for search
- **PDFs**: Secure cloud storage with text extraction
- **URLs**: Automatic metadata extraction and preview

### Real-time Updates
All changes are reflected immediately across the interface, providing a smooth user experience.

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Protected Routes**: API endpoints require authentication
- **User Isolation**: Each user can only access their own data
- **File Security**: Secure cloud storage with access controls

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas database
2. Configure Cloudinary for file storage
3. Deploy to your preferred platform (Heroku, Railway, etc.)
4. Set environment variables in production

### Frontend Deployment
1. Update API base URL for production
2. Build the application: `npm run build`
3. Deploy to Vercel, Netlify, or your preferred platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the console for error messages
2. Ensure all environment variables are set correctly
3. Verify MongoDB and external service connections
4. Check the GitHub issues for similar problems

## 🎯 Future Enhancements

- [ ] Real-time collaboration features
- [ ] Advanced search filters
- [ ] Note templates
- [ ] Export functionality
- [ ] Mobile app
- [ ] Integrations with external services
- [ ] Advanced AI features (auto-tagging, content suggestions)

---

Built with ❤️ using the MERN stack and modern AI technologies.
