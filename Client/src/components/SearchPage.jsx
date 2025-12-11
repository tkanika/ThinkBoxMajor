import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  Search, 
  FileText, 
  Image, 
  FileDown, 
  Link, 
  Calendar, 
  Tag,
  Zap,
  ArrowRight
} from 'lucide-react';

const SearchPage = () => {
    // Helper to get file extension
    const getFileExtension = (fileUrl) => {
      if (!fileUrl) return '';
      const parts = fileUrl.split('.');
      return parts.length > 1 ? parts.pop().toLowerCase() : '';
    };

    // Helper to get file type label
    const getFileTypeLabel = (note) => {
      if (note.type === 'pdf') return 'PDF';
      if (note.type === 'image') return 'Image';
      if (note.type === 'url') return 'URL';
      const ext = getFileExtension(note.fileUrl);
      if (ext === 'docx' || ext === 'doc') return 'Word';
      if (ext === 'txt') return 'Text';
      return 'Document';
    };

    // Helper to get file type icon
    const getFileTypeIcon = (note) => {
      if (note.type === 'pdf') return <FileDown className="w-4 h-4 text-red-600" />;
      if (note.type === 'image') return <Image className="w-4 h-4 text-green-600" />;
      if (note.type === 'url') return <Link className="w-4 h-4 text-blue-600" />;
      const ext = getFileExtension(note.fileUrl);
      if (ext === 'docx' || ext === 'doc') return <FileText className="w-4 h-4 text-indigo-600" />;
      if (ext === 'txt') return <FileText className="w-4 h-4 text-gray-600" />;
      return <FileText className="w-4 h-4 text-gray-600" />;
    };
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);
  const [searchStats, setSearchStats] = useState(null);

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const response = await api.get('/api/search', {
        params: { q: searchQuery, limit: 20 }
      });
      
      setResults(response.data.results || []);
      setSearchStats(response.data);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const getTypeColor = (note) => {
    if (note.type === 'image') return 'bg-green-100 text-green-800';
    if (note.type === 'pdf') return 'bg-red-100 text-red-800';
    if (note.type === 'url') return 'bg-blue-100 text-blue-800';
    const ext = getFileExtension(note.fileUrl);
    if (ext === 'docx' || ext === 'doc') return 'bg-indigo-100 text-indigo-800';
    if (ext === 'txt') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search your knowledge base..."
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {query && (
            <div className="text-sm text-gray-600">
              Searching for: <span className="font-medium text-gray-900">"{query}"</span>
            </div>
          )}
        </div>

        {/* Search Stats */}
        {searchStats && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Found <span className="font-medium text-gray-900">{searchStats.totalFound}</span> results
              </div>
              {searchStats.searchTypes && (
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {searchStats.searchTypes.semantic > 0 && (
                    <div className="flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-purple-500" />
                      <span>{searchStats.searchTypes.semantic} semantic</span>
                    </div>
                  )}
                  {searchStats.searchTypes.text > 0 && (
                    <div className="flex items-center space-x-1">
                      <FileText className="w-3 h-3 text-blue-500" />
                      <span>{searchStats.searchTypes.text} text</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Searching...</span>
          </div>
        )}

        {/* No Results */}
        {!loading && query && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-4">
              Try using different keywords or check your spelling
            </p>
            <button
              onClick={() => navigate('/chat')}
              className="text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 mx-auto"
            >
              <span>Try asking the AI chat instead</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search Results */}
        {!loading && results.length > 0 && (
          <div className="space-y-4">
            {results.map((note) => (
              <div
                key={note._id}
                onClick={() => navigate(`/notes/${note._id}`)}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded ${getTypeColor(note)}`}>
                      {getFileTypeIcon(note)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {note.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(note.createdAt).toLocaleDateString()}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(note)}`}>
                          {getFileTypeLabel(note)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {note.searchType === 'semantic' && note.relevanceScore && (
                      <div className="flex items-center space-x-1 bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">
                        <Zap className="w-3 h-3" />
                        <span>{Math.round(note.relevanceScore * 100)}% match</span>
                      </div>
                    )}
                    {note.searchType === 'text' && (
                      <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                        Text match
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Preview */}
                {note.content && (
                  <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                    {note.content}
                  </p>
                )}

                {/* URL Preview */}
                {note.type === 'url' && note.url && (
                  <div className="bg-blue-50 p-2 rounded mb-3">
                    <p className="text-blue-800 text-sm truncate">{note.url}</p>
                  </div>
                )}

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.slice(0, 5).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 5 && (
                      <span className="text-xs text-gray-500">
                        +{note.tags.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!query && !loading && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Search your knowledge base</h3>
            <p className="text-gray-600 mb-6">
              Find notes by content, tags, or ask natural language questions
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>Try searching for:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['machine learning', 'project ideas', 'meeting notes', 'recipes'].map((example) => (
                  <button
                    key={example}
                    onClick={() => setSearchInput(example)}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;