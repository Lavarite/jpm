import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Moon, Sun, Download, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { handleSearch } from '@/helpers/handleSearch';

interface SearchResult {
  id?: string;
  summary: string;
  type: "conversation" | "product";
  date: string;
  advisor: {
    name?: string;
    id?: string;
  };
  client: {
    name?: string;
    id?: string;
  };
  rawText?: string;
  metadata?: {
    confidence: number;
    tags: string[];
  };
  model: string;
}

interface ResultItemProps {
  result: SearchResult;
  index: number;
  darkMode: boolean;
  isExpanded: boolean;
  isRawTextExpanded: boolean;
  onToggleSummary: (id: string) => void;
  onToggleRawText: (id: string) => void;
  onNameClick: (name: string) => void;
}

const ResultItem: React.FC<ResultItemProps> = ({
  result,
  index,
  darkMode,
  isExpanded,
  isRawTextExpanded,
  onToggleSummary,
  onToggleRawText,
  onNameClick,
}) => {
  const summaryRef = useRef<HTMLParagraphElement>(null);
  const [isLongSummary, setIsLongSummary] = useState(false);
  
  useEffect(() => {
    if (summaryRef.current) {
      const element = summaryRef.current;
      setIsLongSummary(element.scrollHeight > element.clientHeight);
    }
  }, [result.summary, isExpanded]);

  return (
    <Card className={`shadow-elegant hover:shadow-glow transition-shadow ${
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
            <CardTitle className={`text-lg ${darkMode ? 'text-white' : ''}`}>
              {result.type === 'conversation' ? 'Conversation' : 'Product'}
            </CardTitle>
          </div>
        </div>
        
        {/* Participants */}
        {(result.advisor.name || result.client.name) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {result.advisor.name && (
              <div className="text-sm">
                <span className={darkMode ? 'text-white/60' : 'text-muted-foreground'}>Advisor:</span>{' '}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onNameClick(result.advisor.name!)}
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
            {result.client.name && (
              <div className="text-sm">
                <span className={darkMode ? 'text-white/60' : 'text-muted-foreground'}>Client:</span>{' '}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onNameClick(result.client.name!)}
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
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary with Line Clamping */}
        <div>
          <p 
            ref={summaryRef}
            className={`leading-relaxed ${darkMode ? 'text-white' : 'text-foreground'} ${
              isLongSummary && !isExpanded ? 'line-clamp-5' : ''
            }`}
          >
            {result.summary}
          </p>
          {isLongSummary && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleSummary(result.id || `result-${index}`)}
              className={`mt-2 h-8 px-2 ${darkMode ? 'text-white/80 hover:text-white hover:bg-white/10' : 'hover:bg-muted'}`}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Show More
                </>
              )}
            </Button>
          )}
        </div>

        {/* Raw Text Toggle */}
        {result.rawText && (
          <div className="space-y-2">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleRawText(result.id || `result-${index}`)}
                className={`h-6 px-2 ${darkMode ? 'text-white/80 hover:text-white hover:bg-white/10' : 'hover:bg-muted'}`}
              >
                <FileText className="w-3 h-3 mr-1" />
                {isRawTextExpanded ? 'Hide' : 'Show'} Raw Text
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
      </CardContent>
    </Card>
  );
};

const SearchInterface = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  
  const [query, setQuery] = useState("");
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
    
    setParsedResults([]);
    setSummary("");
    setResults("");
    setParseError(null);

    await handleSearch(
      name, // Use the clicked name as the query
      abortRef,
      setLoading,
      setParseError,
      (streamingSummary: string) => {
        setSummary(streamingSummary);
        try {
          const cleaned = streamingSummary
            .replace(/```json|```/g, "")
            .trim();
          
          if (cleaned.startsWith('[') && (cleaned.includes('}]') || cleaned.endsWith(']'))) {
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed.some((item: any) => item && typeof item === 'object' && item.summary)) {
              setParsedResults(parsed);
              setParseError(null);
            }
          }
        } catch (parseErr) {
          // Only set parse error if streaming has finished
          const cleaned = streamingSummary
            .replace(/```json|```/g, "")
            .trim();
          if ((cleaned.includes('}]') || cleaned.endsWith(']')) && !loading) {
            setParseError((parseErr as Error).message);
          }
        }
      },
      setResults,
      model,
      API_BASE_URL
    );
  };

  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("gpt-4o-mini");

  const exportResults = () => {
    const dataStr = JSON.stringify(parsedResults, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `search-results-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleSubmit = async () => {
    if (!query.trim()) return;

    setParsedResults([]);
    setSummary("");
    setResults("");
    setParseError(null);

    await handleSearch(
      query,
      abortRef,
      setLoading,
      setParseError,
      (streamingSummary: string) => {
        setSummary(streamingSummary);
        try {
          const cleaned = streamingSummary
            .replace(/```json|```/g, "")
            .trim();
          
          if (cleaned.startsWith('[') && (cleaned.includes('}]') || cleaned.endsWith(']'))) {
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed.some((item: any) => item && typeof item === 'object' && item.summary)) {
              setParsedResults(parsed);
              setParseError(null);
            }
          }
        } catch (parseErr) {
          // Only set parse error if streaming has finished
          const cleaned = streamingSummary
            .replace(/```json|```/g, "")
            .trim();
          if ((cleaned.includes('}]') || cleaned.endsWith(']')) && !loading) {
            setParseError((parseErr as Error).message);
          }
        }
      },
      setResults,
      model,
      API_BASE_URL
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Filter and sort results
  const filteredResults = parsedResults.filter(result => {
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
        comparison = (a.advisor.name || '').localeCompare(b.advisor.name || '');
        break;
      case "client":
        comparison = (a.client.name || '').localeCompare(b.client.name || '');
        break;
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  });

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
                  className={`${
                    darkMode 
                      ? 'border-white/30 text-white hover:bg-white/10 hover:text-white' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Results
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className={`${darkMode ? 'hover:bg-white/10' : 'hover:bg-muted'}`}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Search Input */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your search query..."
                  className={`h-12 text-base ${darkMode ? 'bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40' : ''}`}
                  disabled={loading}
                />
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={loading || !query.trim()}
                className="h-12 px-6"
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {/* Model Selection */}
            <div className="flex items-center gap-4">
              <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-foreground'}`}>
                Model:
              </label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className={`w-40 ${darkMode ? 'bg-white/10 border-white/20 text-white' : ''}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={`${darkMode ? 'bg-[#0A3622] border-white/20' : ''}`}>
                  <SelectItem value="gpt-4o-mini" className={`${darkMode ? 'text-white hover:bg-white hover:text-primary focus:bg-white focus:text-primary' : ''}`}>GPT-4o Mini</SelectItem>
                  <SelectItem value="gpt-4o" className={`${darkMode ? 'text-white hover:bg-white hover:text-primary focus:bg-white focus:text-primary' : ''}`}>GPT-4o</SelectItem>
                  <SelectItem value="claude-3-5-sonnet-20241022" className={`${darkMode ? 'text-white hover:bg-white hover:text-primary focus:bg-white focus:text-primary' : ''}`}>Claude 3.5 Sonnet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className={`text-sm ${darkMode ? 'text-white/80' : 'text-muted-foreground'}`}>
                Searching and analyzing results...
              </span>
            </div>
            {[...Array(3)].map((_, i) => (
              <Card key={i} className={`${darkMode ? 'bg-white/5 border-white/10' : ''}`}>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="w-20 h-5" />
                    <Skeleton className="w-32 h-4" />
                  </div>
                  <Skeleton className="w-48 h-6" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="w-full h-4" />
                    <Skeleton className="w-3/4 h-4" />
                    <Skeleton className="w-1/2 h-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && parsedResults.length > 0 && (
          <div className="space-y-6">
            {/* Filter and Sort Controls */}
            <div className={`p-4 rounded-lg border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-card border-border'}`}>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-foreground'}`}>
                    Filter:
                  </label>
                  <Select value={filter} onValueChange={(value: "all" | "conversation" | "product") => setFilter(value)}>
                    <SelectTrigger className={`w-32 ${darkMode ? 'bg-white/10 border-white/20 text-white' : ''}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={`${darkMode ? 'bg-[#0A3622] border-white/20' : ''}`}>
                      <SelectItem value="all" className={`${darkMode ? 'text-white hover:bg-white hover:text-primary focus:bg-white focus:text-primary' : ''}`}>All</SelectItem>
                      <SelectItem value="conversation" className={`${darkMode ? 'text-white hover:bg-white hover:text-primary focus:bg-white focus:text-primary' : ''}`}>Conversations</SelectItem>
                      <SelectItem value="product" className={`${darkMode ? 'text-white hover:bg-white hover:text-primary focus:bg-white focus:text-primary' : ''}`}>Products</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-foreground'}`}>
                    Sort by:
                  </label>
                  <Select 
                    value={`${sortBy}-${sortOrder}`} 
                    onValueChange={(value) => {
                      const [newSortBy, newSortOrder] = value.split('-') as [typeof sortBy, typeof sortOrder];
                      setSortBy(newSortBy);
                      setSortOrder(newSortOrder);
                    }}
                  >
                    <SelectTrigger className={`w-36 ${darkMode ? 'bg-white/10 border-white/20 text-white' : ''}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={`${darkMode ? 'bg-[#0A3622] border-white/20' : ''}`}>
                      <SelectItem value="date-desc" className={`${darkMode ? 'text-white hover:bg-white hover:text-primary focus:bg-white focus:text-primary' : ''}`}>Date (Newest)</SelectItem>
                      <SelectItem value="date-asc" className={`${darkMode ? 'text-white hover:bg-white hover:text-primary focus:bg-white focus:text-primary' : ''}`}>Date (Oldest)</SelectItem>
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
              
              return (
                <ResultItem
                  key={result.id || index}
                  result={result}
                  index={index}
                  darkMode={darkMode}
                  isExpanded={isExpanded}
                  isRawTextExpanded={isRawTextExpanded}
                  onToggleSummary={toggleSummaryExpansion}
                  onToggleRawText={toggleRawTextExpansion}
                  onNameClick={handleNameClick}
                />
              );
            })}
          </div>
        )}

        {!loading && parsedResults.length === 0 && summary && (
          <div className={`p-6 rounded-lg border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-card border-border'}`}>
            <p className={`${darkMode ? 'text-white/80' : 'text-muted-foreground'}`}>
              No results found. Try adjusting your search query.
            </p>
          </div>
        )}

        {parseError && (
          <div className={`p-4 rounded-lg border border-red-500/20 ${darkMode ? 'bg-red-500/10' : 'bg-red-50'}`}>
            <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
              Error parsing results: {parseError}
            </p>
            {summary && (
              <details className="mt-2">
                <summary className={`cursor-pointer text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                  Raw response
                </summary>
                <pre className={`mt-2 p-2 rounded text-xs overflow-auto ${darkMode ? 'bg-black/20 text-white/80' : 'bg-gray-100 text-gray-700'}`}>
                  {summary}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
};

export default SearchInterface;