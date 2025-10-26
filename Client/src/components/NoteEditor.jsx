import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { uploadFile } from '../utils/api';
import ReactMarkdown from 'react-markdown';
import { 
  Save, 
  ArrowLeft, 
  Upload, 
  Link2, 
  FileText, 
  Image, 
  FileDown,
  Tag,
  Lightbulb,
  Brain,
  Eye,
  Edit3
} from 'lucide-react';

const NoteEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [note, setNote] = useState({
    title: '',
    content: '',
    type: 'text',
    tags: [],
    url: '',
    urlTitle: '',
    urlDescription: ''
  });
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [aiInsight, setAiInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (isEditing) {
      fetchNote();
    }
  }, [id, isEditing]);

  const fetchNote = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/notes/${id}`);
      setNote(response.data.note);
    } catch (error) {
      console.error('Error fetching note:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setNote(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !note.tags.includes(tagInput.trim())) {
      setNote(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setNote(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Auto-detect type based on file
      if (selectedFile.type.startsWith('image/')) {
        setNote(prev => ({ ...prev, type: 'image' }));
      } else if (selectedFile.type === 'application/pdf') {
        setNote(prev => ({ ...prev, type: 'pdf' }));
      }
    }
  };

  const handleSave = async () => {
    if (!note.title.trim()) {
      alert('Please enter a title for your note');
      return;
    }

    try {
      setSaving(true);
      setUploadProgress(0);
      const formData = new FormData();
      
      // Add all note fields
      Object.keys(note).forEach(key => {
        if (key === 'tags') {
          formData.append('tags', note.tags.join(','));
        } else {
          formData.append(key, note[key]);
        }
      });

      // Add file if present
      if (file) {
        formData.append('file', file);
      }

      let response;
      const endpoint = isEditing ? `/api/notes/${id}` : '/api/notes';
      
      // Use the uploadFile function for better timeout handling and progress tracking
      if (file) {
        // Use the specialized upload function for file uploads
        response = await uploadFile(endpoint, formData, {
          method: isEditing ? 'PUT' : 'POST',
          onProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        });
      } else {
        // Use regular API for text-only updates
        if (isEditing) {
          response = await api.put(endpoint, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          response = await api.post(endpoint, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }

      navigate(`/notes/${response.data.note._id}`);
    } catch (error) {
      console.error('Error saving note:', error);
      if (error.code === 'ECONNABORTED') {
        alert('Upload timeout. Please try again with a smaller file or check your internet connection.');
      } else if (error.response?.status === 413) {
        alert('File is too large. Please try a smaller file.');
      } else {
        alert('Error saving note. Please try again.');
      }
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const generateInsight = async (type) => {
    if (!note.content && !note.title) {
      alert('Please add some content first');
      return;
    }

    try {
      setLoadingInsight(true);
      const response = await api.post(`/api/ai/insights/${id || 'new'}`, {
        type,
        content: note.content,
        title: note.title
      });
      setAiInsight(response.data.insight);
    } catch (error) {
      console.error('Error generating insight:', error);
      alert('Error generating insight. Please try again.');
    } finally {
      setLoadingInsight(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Note' : 'New Note'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {showPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showPreview ? 'Edit' : 'Preview'}</span>
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 relative"
              >
                <Save className="w-4 h-4" />
                <span>
                  {saving 
                    ? (file && uploadProgress > 0 
                        ? `Uploading... ${uploadProgress}%` 
                        : 'Saving...')
                    : 'Save'
                  }
                </span>
                {saving && file && uploadProgress > 0 && (
                  <div className="absolute bottom-0 left-0 h-1 bg-indigo-400 rounded-b transition-all duration-300"
                       style={{ width: `${uploadProgress}%` }}>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Title */}
            <input
              type="text"
              value={note.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter note title..."
              className="w-full text-2xl font-bold border-none outline-none placeholder-gray-400 bg-transparent"
            />

            {/* Type Selection */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Type:</label>
              <div className="flex space-x-2">
                {[
                  { value: 'text', icon: FileText, label: 'Text' },
                  { value: 'image', icon: Image, label: 'Image' },
                  { value: 'pdf', icon: FileDown, label: 'PDF' },
                  { value: 'url', icon: Link2, label: 'URL' }
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => handleInputChange('type', value)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      note.type === value
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* File Upload */}
            {(note.type === 'image' || note.type === 'pdf') && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Upload {note.type === 'image' ? 'Image' : 'PDF'}
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept={note.type === 'image' ? 'image/*' : '.pdf'}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
                {file && (
                  <p className="text-sm text-gray-600">Selected: {file.name}</p>
                )}
                {note.fileUrl && !file && (
                  <div className="mt-2">
                    {note.type === 'image' ? (
                      <img src={note.fileUrl} alt="Preview" className="max-w-xs rounded-lg" />
                    ) : (
                      <a
                        href={note.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 underline"
                      >
                        View PDF
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* URL Fields */}
            {note.type === 'url' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
                  <input
                    type="url"
                    value={note.url}
                    onChange={(e) => handleInputChange('url', e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL Title</label>
                  <input
                    type="text"
                    value={note.urlTitle}
                    onChange={(e) => handleInputChange('urlTitle', e.target.value)}
                    placeholder="Optional: Title for the link"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={note.urlDescription}
                    onChange={(e) => handleInputChange('urlDescription', e.target.value)}
                    placeholder="Optional: Description of the link"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
              {showPreview ? (
                <div className="min-h-64 p-4 border border-gray-200 rounded-lg prose max-w-none">
                  <ReactMarkdown>{note.content || 'No content to preview'}</ReactMarkdown>
                </div>
              ) : (
                <textarea
                  value={note.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Write your note content here... (Markdown supported)"
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none font-mono text-sm"
                />
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <form onSubmit={handleAddTag} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
                <button
                  type="submit"
                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </form>
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-indigo-600 hover:text-indigo-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
          <p className="text-sm text-gray-600">Get AI-powered help with your note</p>
        </div>
        
        <div className="flex-1 p-4 space-y-4">
          <div className="space-y-2">
            <button
              onClick={() => generateInsight('summarize')}
              disabled={loadingInsight || (!note.content && !note.title)}
              className="w-full flex items-center space-x-2 px-3 py-2 text-left text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Lightbulb className="w-4 h-4" />
              <span>Summarize this note</span>
            </button>
            
            <button
              onClick={() => generateInsight('flashcards')}
              disabled={loadingInsight || (!note.content && !note.title)}
              className="w-full flex items-center space-x-2 px-3 py-2 text-left text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Brain className="w-4 h-4" />
              <span>Generate flashcards</span>
            </button>
          </div>

          {loadingInsight && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {aiInsight && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="font-medium text-gray-900 mb-2">AI Insight</h3>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {aiInsight}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
