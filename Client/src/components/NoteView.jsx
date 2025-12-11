import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ReactMarkdown from 'react-markdown';
import { 
  ArrowLeft, 
  Edit, 
  Heart, 
  Calendar, 
  Tag, 
  ExternalLink,
  Download,
  FileText,
  Image as ImageIcon,
  FileDown,
  Link
} from 'lucide-react';

const NoteView = () => {
    // Helper to get file extension
    const getFileExtension = (fileUrl) => {
      if (!fileUrl) return '';
      const parts = fileUrl.split('.');
      return parts.length > 1 ? parts.pop().toLowerCase() : '';
    };

    // Helper to get file type label
    const getFileTypeLabel = (note) => {
      if (note.type === 'pdf') return 'PDF Document';
      if (note.type === 'image') return 'Image File';
      if (note.type === 'url') return 'URL Link';
      const ext = getFileExtension(note.fileUrl);
      if (ext === 'docx' || ext === 'doc') return 'Word Document';
      if (ext === 'txt') return 'Text File';
      return 'Document File';
    };

    // Helper to get file type icon
    const getFileTypeIcon = (note) => {
      if (note.type === 'pdf') return <FileDown className="w-5 h-5 text-red-600" />;
      if (note.type === 'image') return <ImageIcon className="w-5 h-5 text-green-600" />;
      if (note.type === 'url') return <Link className="w-5 h-5 text-blue-600" />;
      const ext = getFileExtension(note.fileUrl);
      if (ext === 'docx' || ext === 'doc') return <FileText className="w-5 h-5 text-indigo-600" />;
      if (ext === 'txt') return <FileText className="w-5 h-5 text-gray-600" />;
      return <FileText className="w-5 h-5 text-gray-600" />;
    };
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNote();
  }, [id]);

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

  const toggleFavorite = async () => {
    try {
      const response = await api.put(`/api/notes/${id}`, {
        isFavorite: !note.isFavorite
      });
      setNote(response.data.note);
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const handleDownload = async () => {
    try {
      const ext = getFileExtension(note.fileUrl);
      
      // Handle PDF files - download from backend
      if (ext === 'pdf') {
        const response = await api.get(`/api/notes/${id}/download`, {
          responseType: 'blob'
        });
        
        // Create blob and download
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${note.title}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      // Handle TXT files - force download from Cloudinary
      else if (ext === 'txt') {
        const response = await fetch(note.fileUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${note.title}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      // Handle Word files - direct download from Cloudinary
      else if (ext === 'docx' || ext === 'doc') {
        const link = document.createElement('a');
        link.href = note.fileUrl;
        link.download = `${note.title}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      // Handle other files
      else {
        window.open(note.fileUrl, '_blank');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-5 h-5" />;
      case 'pdf': return <FileDown className="w-5 h-5" />;
      case 'url': return <Link className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'image': return 'bg-green-100 text-green-800';
      case 'pdf': return 'bg-red-100 text-red-800';
      case 'url': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Note not found</h2>
        <button
          onClick={() => navigate('/')}
          className="text-indigo-600 hover:text-indigo-700"
        >
          Go back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white">
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
            <div className="flex items-center space-x-2">
              <div className={`p-1.5 rounded ${getTypeColor(note.type)}`}>
                {getTypeIcon(note.type)}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(note.type)}`}>
                {note.type}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleFavorite}
              className={`p-2 rounded-lg transition-colors ${
                note.isFavorite 
                  ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                  : 'text-gray-400 hover:bg-gray-100 hover:text-red-600'
              }`}
            >
              <Heart className={`w-5 h-5 ${note.isFavorite ? 'fill-current' : ''}`} />
            </button>
            
            <button
              onClick={() => navigate(`/notes/${note._id}/edit`)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{note.title}</h1>

        {/* Meta info */}
        <div className="flex items-center space-x-6 text-sm text-gray-600 mb-6">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            Created {new Date(note.createdAt).toLocaleDateString()}
          </div>
          {note.updatedAt !== note.createdAt && (
            <div className="flex items-center">
              <Edit className="w-4 h-4 mr-1" />
              Updated {new Date(note.updatedAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* File/URL content */}
        {/* File preview for images */}
        {note.type === 'image' && note.fileUrl && (
          <div className="mb-6">
            <img
              src={note.fileUrl}
              alt={note.title}
              className="max-w-full h-auto rounded-lg shadow-sm"
            />
          </div>
        )}

        {/* File download/view for all document types */}
        {note.fileUrl && (note.type === 'pdf' || note.type === 'image' || getFileExtension(note.fileUrl)) && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getFileTypeIcon(note)}
                <span className="font-medium text-gray-800">{getFileTypeLabel(note)}</span>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        )}

        {note.type === 'url' && note.url && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Link className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">
                  {note.urlTitle || 'Bookmarked Link'}
                </span>
              </div>
              <a
                href={note.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Visit</span>
              </a>
            </div>
            <p className="text-blue-700 break-all">{note.url}</p>
            {note.urlDescription && (
              <p className="text-blue-600 mt-2">{note.urlDescription}</p>
            )}
          </div>
        )}

        {/* Main content */}
        {(note.content || note.extractedText) && (
          <div className="prose max-w-none">
            {note.extractedText && note.type === 'pdf' && (
              <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-yellow-800">
                <strong>📄 Extracted Text from Document:</strong>
              </div>
            )}
            <ReactMarkdown>{note.content || note.extractedText}</ReactMarkdown>
          </div>
        )}

        {!note.content && !note.extractedText && note.type === 'text' && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>This note doesn't have any content yet.</p>
            <button
              onClick={() => navigate(`/notes/${note._id}/edit`)}
              className="text-indigo-600 hover:text-indigo-700 mt-2"
            >
              Add some content
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteView;