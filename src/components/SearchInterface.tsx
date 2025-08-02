import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Loader2, Search, AlertCircle, Moon, Sun, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [streamProgress, setStreamProgress] = useState(0);
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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Reset state
    setParsedResults([]);
    setParseError(null);
    setStreamProgress(0);
    
    await handleSearch(
      query,
      abortRef,
      setLoading,
      setError,
      (streamingSummary) => {
        setSummary(streamingSummary);
        
        // Update progress based on streaming content
        const lines = streamingSummary.split('\n').length;
        setStreamProgress(Math.min((lines / 20) * 100, 90)); // Estimate progress
        
        // Try to parse complete JSON
        try {
          // Strip markdown code fences if present
          const cleaned = streamingSummary
            .replace(/```json|```/g, "")
            .trim();
          
          if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
            const parsed = JSON.parse(cleaned);
            setParsedResults(parsed);
            setParseError(null);
            setStreamProgress(100);
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

  return (
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
              className={`${darkMode ? 'text-white hover:bg-white/10' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
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
        {/* Loading State with Progress */}
        {loading && (
          <div className="mb-6 space-y-4">
            <Card className={`border-primary/20 ${darkMode ? 'bg-white/5' : 'bg-gradient-subtle'}`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className={`text-sm ${darkMode ? 'text-white/80' : 'text-muted-foreground'}`}>
                    Searching and analyzing documents...
                  </span>
                </div>
                <Progress value={streamProgress} className="h-2" />
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
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-foreground'}`}>
              Search Results ({parsedResults.length})
            </h2>
            
            {parsedResults.map((result, index) => {
              const isExpanded = expandedSummaries.has(result.id || `result-${index}`);
              const summaryLines = result.summary.split('\n').length;
              const isLongSummary = summaryLines > 5 || result.summary.length > 400;
              
              return (
                <Card key={result.id || index} className={`shadow-elegant hover:shadow-glow transition-shadow ${
                  darkMode ? 'bg-white/5 border-white/10' : ''
                }`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                         <div className="flex items-center gap-2">
                           <Badge variant={result.type === 'conversation' ? 'default' : 'secondary'}>
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
                           {result.type === 'conversation' ? `Conversation` : `Product`} {result.id}
                         </CardTitle>
                    </div>
                  </div>
                  
                    {/* Participants */}
                    {(result.advisor.name || result.client.name) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                         {result.advisor.name && (
                           <div className="text-sm">
                             <span className={darkMode ? 'text-white/60' : 'text-muted-foreground'}>Advisor:</span>{' '}
                             <span className={`font-medium ${darkMode ? 'text-white' : 'text-foreground'}`}>{result.advisor.name}</span>
                           </div>
                         )}
                         {result.client.name && (
                           <div className="text-sm">
                             <span className={darkMode ? 'text-white/60' : 'text-muted-foreground'}>Client:</span>{' '}
                             <span className={`font-medium ${darkMode ? 'text-white' : 'text-foreground'}`}>{result.client.name}</span>
                           </div>
                         )}
                      </div>
                    )}

                    {/* Product */}
                    {result.product.name && (
                      <div className="text-sm">
                        <span className={darkMode ? 'text-white/60' : 'text-muted-foreground'}>Product:</span>{' '}
                        <span className="font-medium">{result.product.name}</span>
                        {result.product.type && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {result.product.type}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Summary with Line Clamping */}
                    <div>
                      <p className={`leading-relaxed ${darkMode ? 'text-white' : 'text-foreground'} ${
                        isLongSummary && !isExpanded ? 'line-clamp-5' : ''
                      }`}>
                        {result.summary}
                      </p>
                      {isLongSummary && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSummaryExpansion(result.id || `result-${index}`)}
                          className={`mt-2 h-8 px-2 ${darkMode ? 'text-white/80 hover:text-white' : ''}`}
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
                  
                    {/* Topics */}
                    {result.topics.length > 0 && (
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
                     {result.actions.length > 0 && (
                       <div>
                         <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-white/60' : 'text-muted-foreground'}`}>
                           Actions
                         </h4>
                         <ul className="space-y-2">
                           {result.actions.map((action, i) => (
                             <li key={i} className={`text-sm flex items-start gap-2 ${darkMode ? 'text-white/90' : 'text-foreground'}`}>
                               <span className="text-primary mt-1">•</span>
                               <span>{action}</span>
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
  );
};

export default SearchInterface;