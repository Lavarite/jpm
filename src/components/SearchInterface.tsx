import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, AlertCircle } from 'lucide-react';
import { handleSearch } from '@/helpers/handleSearch';

interface SearchResult {
  type: "conversation" | "product";
  id: string;
  date: string | null;
  advisor: { id: string | null; name: string | null };
  client: { id: string | null; name: string | null };
  product: { id: string | null; name: string | null; type: string | null };
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
  const abortRef = useRef<AbortController | null>(null);

  const API_BASE_URL = "https://api.jpm.vasylevskyi.net";

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Reset parsed results
    setParsedResults([]);
    
    await handleSearch(
      query,
      abortRef,
      setLoading,
      setError,
      (streamingSummary) => {
        setSummary(streamingSummary);
        // Try to parse partial JSON as it streams
        try {
          const cleaned = streamingSummary.trim();
          if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
            const parsed = JSON.parse(cleaned);
            setParsedResults(parsed);
          }
        } catch {
          // Ignore parsing errors during streaming
        }
      },
      setResults,
      null, // model will need to be provided
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">JP Morgan Research</h1>
          </div>
          
          {/* Search Box */}
          <form onSubmit={handleSubmit} className="relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search client conversations and products..."
              className="pr-12 h-12 text-base border-2 border-border focus:border-primary transition-colors"
              disabled={loading}
            />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              className="absolute right-2 top-2 h-8 w-8 p-0 text-muted-foreground hover:text-primary"
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
          <Card className="mb-6 border-primary/20 bg-gradient-subtle">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Searching and analyzing documents...
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {parsedResults.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">
              Search Results ({parsedResults.length})
            </h2>
            
            {parsedResults.map((result, index) => (
              <Card key={result.id || index} className="shadow-elegant hover:shadow-glow transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={result.type === 'conversation' ? 'default' : 'secondary'}>
                          {result.type}
                        </Badge>
                        {result.date && (
                          <span className="text-sm text-muted-foreground">{result.date}</span>
                        )}
                      </div>
                      <CardTitle className="text-lg">{result.id}</CardTitle>
                    </div>
                  </div>
                  
                  {/* Participants */}
                  {(result.advisor.name || result.client.name) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {result.advisor.name && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Advisor:</span>{' '}
                          <span className="font-medium">{result.advisor.name}</span>
                        </div>
                      )}
                      {result.client.name && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Client:</span>{' '}
                          <span className="font-medium">{result.client.name}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Product */}
                  {result.product.name && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Product:</span>{' '}
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
                  {/* Summary */}
                  <p className="text-foreground leading-relaxed">{result.summary}</p>
                  
                  {/* Topics */}
                  {result.topics.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Topics</h4>
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
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Actions</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.actions.map((action, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-primary text-primary">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Raw streaming output for debugging */}
        {summary && !parsedResults.length && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                Streaming Response {loading && "(in progress...)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-muted-foreground bg-muted p-4 rounded-md overflow-auto max-h-96">
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