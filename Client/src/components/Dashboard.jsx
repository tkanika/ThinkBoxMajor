import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  FileText, 
  Image, 
  FileDown, 
  Link, 
  Heart, 
  Calendar,
  Tag,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';

const Dashboard = () => {
    // Helper to get file extension
    const getFileExtension = (fileUrl) => {
      if (!fileUrl) return '';
      const parts = fileUrl.split('.');
      return parts.length > 1 ? parts.pop().toLowerCase() : '';
    };

  // Helper to get file type label
  const getFileTypeLabel = (note) => {
    // Check actual file extension first
    const ext = getFileExtension(note.fileUrl);
    if (ext === 'pdf') return 'PDF';
    if (ext === 'docx' || ext === 'doc') return 'Word';
    if (ext === 'txt') return 'Text';
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'webp') return 'Image';
    
    // Fallback to note.type if no file extension
    if (note.type === 'pdf') return 'PDF';
    if (note.type === 'image') return 'Image';
    if (note.type === 'url') return 'URL';
    if (note.type === 'text') return 'Text';
    return 'Document';
  };  // Helper to get file type icon
  const getFileTypeIcon = (note) => {
    // Check actual file extension first
    const ext = getFileExtension(note.fileUrl);
    if (ext === 'pdf') return <FileDown className="w-5 h-5 text-red-600" />;
    if (ext === 'docx' || ext === 'doc') return <FileText className="w-5 h-5 text-indigo-600" />;
    if (ext === 'txt') return <FileText className="w-5 h-5 text-gray-600" />;
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'webp') return <Image className="w-5 h-5 text-green-600" />;
    
    // Fallback to note.type if no file extension
    if (note.type === 'pdf') return <FileDown className="w-5 h-5 text-red-600" />;
    if (note.type === 'image') return <Image className="w-5 h-5 text-green-600" />;
    if (note.type === 'url') return <Link className="w-5 h-5 text-blue-600" />;
    return <FileText className="w-5 h-5 text-gray-600" />;
  };

  // Helper to get type color
  const getTypeColor = (note) => {
    // Check actual file extension first
    const ext = getFileExtension(note.fileUrl);
    if (ext === 'pdf') return 'bg-red-100 text-red-800';
    if (ext === 'docx' || ext === 'doc') return 'bg-indigo-100 text-indigo-800';
    if (ext === 'txt') return 'bg-gray-100 text-gray-800';
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'webp') return 'bg-green-100 text-green-800';
    
    // Fallback to note.type if no file extension
    if (note.type === 'pdf') return 'bg-red-100 text-red-800';
    if (note.type === 'image') return 'bg-green-100 text-green-800';
    if (note.type === 'url') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [tags, setTags] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotes();
    fetchTags();
  }, [selectedType]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedType !== 'all') params.type = selectedType;
      
      const response = await api.get('/api/notes', { params });
      setNotes(response.data.notes);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await api.get('/api/notes/tags');
      setTags(response.data.tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const toggleFavorite = async (noteId, currentStatus) => {
    try {
      const response = await api.put(`/api/notes/${noteId}`, {
        isFavorite: !currentStatus
      });
      setNotes(notes.map(note => 
        note._id === noteId ? response.data.note : note
      ));
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await api.delete(`/api/notes/${noteId}`);
      setNotes(notes.filter(note => note._id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const filteredNotes = selectedTag === 'all' 
    ? notes 
    : notes.filter(note => note.tags.includes(selectedTag));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Manage your personal knowledge base</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Type:</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="text">Text</option>
            <option value="image">Images</option>
            <option value="pdf">PDFs</option>
            <option value="url">URLs</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Tag:</label>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Tags</option>
            {tags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{notes.length}</div>
          <div className="text-sm text-gray-600">Total Notes</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-indigo-600">
            {notes.filter(note => note.isFavorite).length}
          </div>
          <div className="text-sm text-gray-600">Favorites</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{tags.length}</div>
          <div className="text-sm text-gray-600">Tags</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {notes.filter(note => 
              new Date(note.createdAt) > new Date(Date.now() - 7*24*60*60*1000)
            ).length}
          </div>
          <div className="text-sm text-gray-600">This Week</div>
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notes found</h3>
          <p className="text-gray-600 mb-4">
            {selectedType === 'all' && selectedTag === 'all' 
              ? "Get started by creating your first note" 
              : "Try adjusting your filters"}
          </p>
          <button
            onClick={() => navigate('/notes/new')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded ${getTypeColor(note)}`}> 
                      {getFileTypeIcon(note)}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(note)}`}> 
                      {getFileTypeLabel(note)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(note._id, note.isFavorite);
                      }}
                      className={`p-1 rounded hover:bg-gray-100 ${
                        note.isFavorite ? 'text-red-500' : 'text-gray-400'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${note.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/notes/${note._id}/edit`);
                      }}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(note._id);
                      }}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div onClick={() => navigate(`/notes/${note._id}`)}>
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {note.title}
                  </h3>
                  
                  {note.type === 'image' && note.fileUrl && (
                    <img
                      src={note.fileUrl}
                      alt={note.title}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  )}
                  
                  {note.type === 'url' && note.url && (
                    <div className="bg-blue-50 p-2 rounded mb-2">
                      <p className="text-sm text-blue-800 truncate">{note.url}</p>
                    </div>
                  )}
                  
                  {note.content && (
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                      {note.content}
                    </p>
                  )}

                  {/* Tags */}
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {note.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{note.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(note.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;