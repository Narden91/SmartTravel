// hooks/useCityAutocomplete.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { getAutocompleteResults, EnhancedCityResult, AutocompleteOptions } from '../services/cityAutocompleteService';
import cityAutocompleteService from '../services/cityAutocompleteService';

const { AutocompleteError } = cityAutocompleteService;

export interface UseCityAutocompleteOptions extends AutocompleteOptions {
  debounceMs?: number;
  showSuggestionsOnFocus?: boolean;
  minQueryLength?: number;
}

export interface UseCityAutocompleteResult {
  // State
  suggestions: EnhancedCityResult[];
  isLoading: boolean;
  error: string | null;
  showSuggestions: boolean;
  
  // Metadata
  source: 'local' | 'api' | 'cache' | 'mixed' | null;
  fromCache: boolean;
  
  // Actions
  search: (query: string) => void;
  selectSuggestion: (suggestion: EnhancedCityResult) => void;
  showSuggestionsDropdown: () => void;
  hideSuggestionsDropdown: () => void;
  clearSuggestions: () => void;
  
  // Input handlers (convenience)
  handleInputChange: (value: string) => void;
  handleInputFocus: () => void;
  handleInputBlur: () => void;
}

export function useCityAutocomplete(
  onSelect?: (suggestion: EnhancedCityResult) => void,
  options: UseCityAutocompleteOptions = {}
): UseCityAutocompleteResult {
  const {
    debounceMs = 300,
    showSuggestionsOnFocus = true,
    minQueryLength = 2,
    maxResults = 8,
    useExternalAPI = true,
    fallbackToLocal = true,
    ...autocompleteOptions
  } = options;

  // State
  const [suggestions, setSuggestions] = useState<EnhancedCityResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [source, setSource] = useState<'local' | 'api' | 'cache' | 'mixed' | null>(null);
  const [fromCache, setFromCache] = useState(false);

  // Refs
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>('');

  // Cleanup function
  const cleanup = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Search function
  const search = useCallback(async (query: string) => {
    // Store current query
    lastQueryRef.current = query;
    
    // Clean previous requests
    cleanup();

    // Reset error
    setError(null);

    // Handle empty query
    if (!query || query.trim().length < minQueryLength) {
      if (showSuggestionsOnFocus && query.trim().length === 0) {
        // Show initial suggestions
        try {
          const result = await getAutocompleteResults('', {
            ...autocompleteOptions,
            maxResults,
            useExternalAPI: false // Use only local for initial suggestions
          });
          
          setSuggestions(result.results);
          setSource(result.source);
          setFromCache(result.fromCache);
          setShowSuggestions(true);
        } catch (err) {
          console.warn('Failed to load initial suggestions:', err);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setSource(null);
        setFromCache(false);
      }
      setIsLoading(false);
      return;
    }

    // Set loading state
    setIsLoading(true);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const result = await getAutocompleteResults(query, {
        ...autocompleteOptions,
        maxResults,
        useExternalAPI,
        fallbackToLocal
      });

      // Check if this is still the current query
      if (lastQueryRef.current === query) {
        setSuggestions(result.results);
        setSource(result.source);
        setFromCache(result.fromCache);
        setShowSuggestions(result.results.length > 0);
        
        // Handle API errors with graceful fallback
        if (result.error) {
          const errorMessage = getErrorMessage(result.error);
          console.warn('Autocomplete API warning:', errorMessage);
          // Don't set error if we have fallback results
          if (result.results.length === 0) {
            setError(errorMessage);
          }
        }
      }
    } catch (err) {
      // Only update if this is still the current query
      if (lastQueryRef.current === query) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        setSuggestions([]);
        setShowSuggestions(false);
        setSource(null);
        setFromCache(false);
        
        console.error('Autocomplete search failed:', err);
      }
    } finally {
      // Only update loading state if this is still the current query
      if (lastQueryRef.current === query) {
        setIsLoading(false);
      }
    }
  }, [
    minQueryLength,
    showSuggestionsOnFocus,
    maxResults,
    useExternalAPI,
    fallbackToLocal,
    autocompleteOptions,
    cleanup
  ]);

  // Debounced search
  const debouncedSearch = useCallback((query: string) => {
    cleanup();
    
    debounceRef.current = setTimeout(() => {
      search(query);
    }, debounceMs);
  }, [search, debounceMs, cleanup]);

  // Select suggestion handler
  const selectSuggestion = useCallback((suggestion: EnhancedCityResult) => {
    setShowSuggestions(false);
    setSuggestions([]);
    setError(null);
    
    if (onSelect) {
      onSelect(suggestion);
    }
  }, [onSelect]);

  // Show/hide suggestions
  const showSuggestionsDropdown = useCallback(() => {
    setShowSuggestions(suggestions.length > 0);
  }, [suggestions.length]);

  const hideSuggestionsDropdown = useCallback(() => {
    setShowSuggestions(false);
  }, []);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    cleanup();
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
    setSource(null);
    setFromCache(false);
    setIsLoading(false);
    lastQueryRef.current = '';
  }, [cleanup]);

  // Convenience input handlers
  const handleInputChange = useCallback((value: string) => {
    debouncedSearch(value);
  }, [debouncedSearch]);

  const handleInputFocus = useCallback(() => {
    if (showSuggestionsOnFocus) {
      if (suggestions.length > 0) {
        setShowSuggestions(true);
      } else {
        // Trigger search for initial suggestions
        search('');
      }
    }
  }, [showSuggestionsOnFocus, suggestions.length, search]);

  const handleInputBlur = useCallback(() => {
    // Delay hiding to allow for clicks on suggestions
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    // State
    suggestions,
    isLoading,
    error,
    showSuggestions,
    
    // Metadata
    source,
    fromCache,
    
    // Actions
    search,
    selectSuggestion,
    showSuggestionsDropdown,
    hideSuggestionsDropdown,
    clearSuggestions,
    
    // Input handlers
    handleInputChange,
    handleInputFocus,
    handleInputBlur,
  };
}

// Helper function to convert errors to user-friendly messages
function getErrorMessage(error: unknown): string {
  // Type guard for AutocompleteError
  if (error && typeof error === 'object' && 'code' in error && 'retryAfter' in error) {
    const autocompleteError = error as { code: string; retryAfter?: number };
    switch (autocompleteError.code) {
      case 'RATE_LIMIT_EXCEEDED':
        return `Troppe ricerche. Riprova tra ${autocompleteError.retryAfter || 60} secondi.`;
      case 'API_RATE_LIMIT':
        return 'Servizio temporaneamente non disponibile. Usando suggerimenti locali.';
      case 'TIMEOUT':
        return 'Ricerca troppo lenta. Prova di nuovo.';
      case 'NETWORK_ERROR':
        return 'Problema di connessione. Usando suggerimenti locali.';
      default:
        return 'Errore durante la ricerca. Usando suggerimenti locali.';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Errore sconosciuto durante la ricerca.';
}

export default useCityAutocomplete;
