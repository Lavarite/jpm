import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, AlertCircle, Moon, Sun, ChevronDown, ChevronUp, Filter, FileText, ArrowUpDown, Download, User } from 'lucide-react';
import { handleSearch } from '@/helpers/handleSearch';
import { model, API_BASE_URL } from '@/lib/firebase';

interface SearchResult {
  type: "conversation" | "product";
  id: string;
  date: string;
  advisor: { 
    id: string | null; 
    name: string | null; 
  };
  client: { 
    id: string | null; 
    name: string | null; 
  };
  product: { 
    id: string | null; 
    name: string | null; 
    type: string | null; 
  };
  summary: string;
  topics: string[];
  actions: string[];
  rawText?: string; // For conversations
}

const SearchInterface = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [results, setResults] = useState("");
  const [parsedResults, setParsedResults] = useState<SearchResult[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set());
  const [expandedRawText, setExpandedRawText] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "conversation" | "product">("all");
  const [sortBy, setSortBy] = useState<"date" | "type" | "advisor" | "client">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const abortRef = useRef<AbortController | null>(null);

  const toggleSummaryExpansion = (id: string) => {
    const newExpanded = new Set(expandedSummaries);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSummaries(newExpanded);
  };

  const toggleRawTextExpansion = (id: string) => {
    const newExpanded = new Set(expandedRawText);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRawText(newExpanded);
  };

  const handleNameClick = async (name: string) => {
    setQuery(name);
    
    // Reset state
    setParsedResults([]);
    setParseError(null);
    
    const parsed = await handleSearch(
      name,
      abortRef,
      setLoading,
      setError,
      setSummary,
      setResults,
      setParsedResults,
      model,
      API_BASE_URL
    );
    
    if (parsed) {
      setParsedResults(parsed);
    }
  };

  const exportResults = () => {
    const dataStr = JSON.stringify(parsedResults, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `search-results-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const filteredResults = (parsedResults || []).filter(result => {
    if (filter === "all") return true;
    return result.type === filter;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case "date":
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case "type":
        comparison = a.type.localeCompare(b.type);
        break;
      case "advisor":
        comparison = (a.advisor.name || "").localeCompare(b.advisor.name || "");
        break;
      case "client":
        comparison = (a.client.name || "").localeCompare(b.client.name || "");
        break;
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Reset state
    setParsedResults([]);
    setParseError(null);
    
    const parsed = await handleSearch(
      query,
      abortRef,
      setLoading,
      setError,
      setSummary,
      setResults,
      setParsedResults,
      model,
      API_BASE_URL
    );
    
    if (parsed) {
      setParsedResults(parsed);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <TooltipProvider>
    <div className={`min-h-screen transition-colors ${darkMode ? 'bg-[#0A3622] text-white' : 'bg-background'}`}>
      {/* Header */}
      <div className={`border-b ${darkMode ? 'border-white/20 bg-white/5' : 'border-border bg-card'}`}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Search className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-foreground'}`}>JP Morgan Research</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Export Button */}
              {parsedResults.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportResults}
                  className={`${darkMode ? 'border-white/30 text-white bg-white/5 hover:bg-white/20 hover:text-white hover:border-white/50' : 'hover:bg-accent'}`}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className={`${darkMode ? 'text-white hover:bg-white/10' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          {/* Search Box */}
          <form onSubmit={handleSubmit} className="relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search client conversations and products..."
              className={`pr-12 h-12 text-base border-2 transition-colors ${
                darkMode 
                  ? 'bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40' 
                  : 'border-border focus:border-primary'
              }`}
              disabled={loading}
            />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              className={`absolute right-2 top-2 h-8 w-8 p-0 ${
                darkMode 
                  ? 'text-white/60 hover:text-white' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
              disabled={loading || !query.trim()}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Loading State */}
        {loading && (
          <div className="mb-6 space-y-4">
            <Card className={`border-primary/20 ${darkMode ? 'bg-white/5' : 'bg-gradient-subtle'}`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className={`text-sm ${darkMode ? 'text-white/80' : 'text-muted-foreground'}`}>
                    Searching and analyzing documents...
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Skeleton Cards */}
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i} className={`${darkMode ? 'bg-white/5 border-white/10' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Error States */}
        {error && (
          <Card className={`mb-6 border-destructive/50 ${darkMode ? 'bg-red-900/20' : 'bg-destructive/5'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parse Error State */}
        {parseError && (
          <Card className={`mb-6 border-destructive/50 ${darkMode ? 'bg-red-900/20' : 'bg-destructive/5'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <span className="text-sm text-destructive">
                  Failed to parse response: {parseError}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Results State */}
        {!loading && summary && parsedResults.length === 0 && !parseError && (
          <Card className={`mb-6 ${darkMode ? 'bg-white/5 border-white/10' : 'border-muted'}`}>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-white/60' : 'text-muted-foreground'}`} />
                <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-foreground'}`}>
                  No relevant information found
                </h3>
                <p className={`${darkMode ? 'text-white/80' : 'text-muted-foreground'}`}>
                  Try adjusting your search terms or check the raw response below.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {parsedResults.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-foreground'}`}>
                Search Results ({sortedResults.length}{sortedResults.length !== parsedResults.length && ` of ${parsedResults.length}`})
              </h2>
              <div className="flex items-center gap-4">
                {/* Filter */}
                <div className="flex items-center gap-2">
                  <Filter className={`w-4 h-4 ${darkMode ? 'text-white/60' : 'text-muted-foreground'}`} />
                  <Select value={filter} onValueChange={(value: "all" | "conversation" | "product") => setFilter(value)}>
                    <SelectTrigger className={`w-40 ${darkMode ? 'bg-white/10 border-white/20 text-white' : ''}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={`${darkMode ? 'bg-primary border-white/20 text-white' : ''}`}>
                      <SelectItem value="all" className={`${darkMode ? 'text-white hover:bg-white hover:text-primary focus:bg-white focus:text-primary' : ''}`}>All Results</SelectItem>
                      <SelectItem value="conversation" className={`${darkMode ? 'text-white hover:bg-white hover:text-primary focus:bg-white focus:text-primary' : ''}`}>Conversations</SelectItem>
                      <SelectItem value="product" className={`${darkMode ? 'text-white hover:bg-white hover:text-primary focus:bg-white focus:text-primary' : ''}`}>Products</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Sort */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className={`w-4 h-4 ${darkMode ? 'text-white/60' : 'text-muted-foreground'}`} />
                  <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                    const [sort, order] = value.split('-') as [typeof sortBy, typeof sortOrder];
                    setSortBy(sort);
                    setSortOrder(order);
                  }}>
                    <SelectTrigger className={`w-40 ${darkMode ? 'bg-white/10 border-white/20 text-white' : ''}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={`${darkMode ? 'bg-primary border-white/20 text-white' : ''}`}>
                      <SelectItem value="date-desc" className={`${darkMode ? 'text-white hover:bg-white hover:text-primary focus:bg-white focus:text-primary' : ''}`}>Newest First</SelectItem>
                      <SelectItem value="date-asc" className={`${darkMode ? 'text-white hover:bg-white hover:text-primary focus:bg-white focus:text-primary' : ''}`}>Oldest First</SelectItem>
                      <SelectItem value="type-asc" className={`${darkMode ? 'text-white hover:bg-white hover:text-primary focus:bg-white focus:text-primary' : ''}`}>Type A-Z</SelectItem>
                      <SelectItem value="type-desc" className={`${darkMode ? 'text-white hover:bg-white hover:text-primary focus:bg-white focus:text-primary' : ''}`}>Type Z-A</SelectItem>
                      <SelectItem value="advisor-asc" className={`${darkMode ? 'text-white hover:bg-white hover:text-primary focus:bg-white focus:text-primary' : ''}`}>Advisor A-Z</SelectItem>
                      <SelectItem value="advisor-desc" className={`${darkMode ? 'text-white hover:bg-white hover:text-primary focus:bg-white focus:text-primary' : ''}`}>Advisor Z-A</SelectItem>
                      <SelectItem value="client-asc" className={`${darkMode ? 'text-white hover:bg-white hover:text-primary focus:bg-white focus:text-primary' : ''}`}>Client A-Z</SelectItem>
                      <SelectItem value="client-desc" className={`${darkMode ? 'text-white hover:bg-white hover:text-primary focus:bg-white focus:text-primary' : ''}`}>Client Z-A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {sortedResults.map((result, index) => {
              const isExpanded = expandedSummaries.has(result.id || `result-${index}`);
              const isRawTextExpanded = expandedRawText.has(result.id || `result-${index}`);
              
              // Simple line count check for show more/less
              const lineCount = result.summary.split('\n').length;
              const wordCount = result.summary.split(' ').length;
              const isLongSummary = lineCount > 3 || wordCount > 80;
              
              return (
                <Card key={result.id || index} className={`shadow-elegant hover:shadow-glow transition-shadow ${
                  darkMode ? 'bg-white/5 border-white/10' : ''
                }`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={result.type === 'conversation' ? 'default' : 'secondary'} 
                              className={`${
                                result.type === 'product' 
                                  ? 'bg-yellow-500 text-black hover:bg-yellow-600 border-yellow-400' 
                                  : darkMode ? 'border border-white/30' : ''
                              }`}
                            >
                              {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                            </Badge>
                          <span className={`text-sm ${darkMode ? 'text-white/60' : 'text-muted-foreground'}`}>
                            {new Date(result.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                    </div>
                  </div>
                  
                    {/* Participants */}
                    {(result.advisor?.name || result.client?.name) && (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          {result.advisor?.name && (
                            <div className="text-sm">
                              <span className={darkMode ? 'text-white/60' : 'text-muted-foreground'}>Advisor:</span>{' '}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleNameClick(result.advisor.name!)}
                                      className={`font-medium underline hover:no-underline transition-all ${
                                        darkMode ? 'text-white hover:text-white/80' : 'text-foreground hover:text-primary'
                                      }`}
                                    >
                                      {result.advisor.name}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Click to search for this advisor</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                          {result.client?.name && (
                            <div className="text-sm">
                              <span className={darkMode ? 'text-white/60' : 'text-muted-foreground'}>Client:</span>{' '}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleNameClick(result.client.name!)}
                                      className={`font-medium underline hover:no-underline transition-all ${
                                        darkMode ? 'text-white hover:text-white/80' : 'text-foreground hover:text-primary'
                                      }`}
                                    >
                                      {result.client.name}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Click to search for this client</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                       </div>
                    )}

                     {/* Product */}
                     {result.product?.name && (
                       <div className="text-sm">
                         <span className={darkMode ? 'text-white/60' : 'text-muted-foreground'}>Product:</span>{' '}
                         <span className={`font-medium ${darkMode ? 'text-white' : 'text-foreground'}`}>{result.product.name}</span>
                         {result.product.type && (
                           <Badge variant="outline" className={`ml-2 text-xs ${darkMode ? 'text-white' : ''}`}>
                             {result.product.type}
                           </Badge>
                         )}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                     {/* Summary */}
                     <div>
                       <p className={`leading-relaxed ${darkMode ? 'text-white' : 'text-foreground'}`}>
                         {result.summary}
                       </p>
                    </div>

                   {/* Raw Text for Conversations */}
                   {result.type === 'conversation' && result.rawText && (
                     <div>
                       <div className="flex items-center justify-between mb-2">
                         <h4 className={`text-sm font-medium ${darkMode ? 'text-white/60' : 'text-muted-foreground'}`}>
                           Raw Conversation
                         </h4>
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => toggleRawTextExpansion(result.id || `result-${index}`)}
                           className={`h-6 px-2 ${darkMode ? 'text-white/80 hover:text-white hover:bg-white/10' : 'hover:bg-muted'}`}
                         >
                           <FileText className="w-3 h-3 mr-1" />
                           {isRawTextExpanded ? 'Hide' : 'Show'}
                         </Button>
                       </div>
                       {isRawTextExpanded && (
                         <div className={`p-3 rounded-md text-xs font-mono whitespace-pre-wrap max-h-60 overflow-auto ${
                           darkMode ? 'bg-black/20 text-white/80' : 'bg-muted text-muted-foreground'
                         }`}>
                           {result.rawText}
                         </div>
                       )}
                     </div>
                   )}
                   
                      {/* Topics */}
                      {result.topics && result.topics.length > 0 && (
                       <div>
                         <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-white/60' : 'text-muted-foreground'}`}>
                           Topics
                         </h4>
                         <div className="flex flex-wrap gap-2">
                           {result.topics.map((topic, i) => (
                             <Badge key={i} variant="secondary" className="text-xs">
                               {topic}
                             </Badge>
                           ))}
                         </div>
                       </div>
                     )}
                   
                      {/* Actions */}
                      {result.actions && result.actions.length > 0 && (
                       <div>
                         <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-white/60' : 'text-muted-foreground'}`}>
                           Actions
                         </h4>
                         <ul className="space-y-2">
                            {result.actions.map((action, i) => (
                              <li key={i} className={`text-sm flex items-start gap-2 ${darkMode ? 'text-white/90' : 'text-foreground'}`}>
                                <span className={`text-xs mt-0.5 ${darkMode ? 'text-white/60' : 'text-muted-foreground'}`}>•</span>
                                <span>{action && typeof action === 'string' ? action.charAt(0).toUpperCase() + action.slice(1) : action}</span>
                              </li>
                            ))}
                         </ul>
                       </div>
                     )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Raw streaming output for debugging */}
        {summary && !parsedResults.length && !loading && (
          <Card className={`mt-6 ${darkMode ? 'bg-white/5 border-white/10' : ''}`}>
            <CardHeader>
              <CardTitle className={`text-sm ${darkMode ? 'text-white/60' : 'text-muted-foreground'}`}>
                Raw Response (Debug)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className={`text-xs p-4 rounded-md overflow-auto max-h-96 ${
                darkMode 
                  ? 'text-white/80 bg-black/20' 
                  : 'text-muted-foreground bg-muted'
              }`}>
                {summary}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
};

export default SearchInterface;