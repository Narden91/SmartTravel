// components/CityAutocomplete.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useCityAutocomplete, UseCityAutocompleteOptions } from '../hooks/useCityAutocomplete';
import { EnhancedCityResult } from '../services/cityAutocompleteService';
import { sanitizeDestinationInput, formatDestinationName } from '../security.config';

// Icons (reusing existing ones from your codebase)
import { MapIcon, CheckIcon, SparklesIcon } from './icons';

// Create a simple alert icon component
const AlertIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
  </svg>
);

export interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (city: EnhancedCityResult) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  required?: boolean;
  autoFocus?: boolean;
  options?: UseCityAutocompleteOptions;
}

const CityAutocomplete: React.FC<CityAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = "Es. Roma, Italia",
  disabled = false,
  className = "",
  label,
  required = false,
  autoFocus = false,
  options = {}
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize autocomplete hook
  const {
    suggestions,
    isLoading,
    error,
    showSuggestions,
    source,
    fromCache,
    selectSuggestion,
    handleInputChange,
    handleInputFocus,
    handleInputBlur,
  } = useCityAutocomplete(
    (city) => {
      const formattedName = formatDestinationName(city.displayName);
      setInputValue(formattedName);
      onChange(formattedName);
      if (onSelect) {
        onSelect(city);
      }
    },
    {
      showSuggestionsOnFocus: true,
      debounceMs: 300,
      maxResults: 8,
      useExternalAPI: true,
      fallbackToLocal: true,
      ...options
    }
  );

  // Sync external value changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value, inputValue]);

  // Handle input changes with security sanitization
  const handleInputChangeInternal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const sanitizedValue = sanitizeDestinationInput(rawValue);
    
    setInputValue(sanitizedValue);
    onChange(sanitizedValue);
    handleInputChange(sanitizedValue);
  };

  // Handle input focus
  const handleInputFocusInternal = () => {
    setIsFocused(true);
    handleInputFocus();
  };

  // Handle input blur
  const handleInputBlurInternal = () => {
    setIsFocused(false);
    
    // Format the destination when user finishes typing
    if (inputValue.trim().length > 0) {
      const formattedValue = formatDestinationName(inputValue);
      if (formattedValue !== inputValue) {
        setInputValue(formattedValue);
        onChange(formattedValue);
      }
    }
    
    handleInputBlur();
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: EnhancedCityResult) => {
    selectSuggestion(suggestion);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        // Focus first suggestion
        const firstButton = dropdownRef.current?.querySelector('button');
        firstButton?.focus();
        break;
      case 'Escape':
        e.preventDefault();
        inputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion keyboard navigation
  const handleSuggestionKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    suggestion: EnhancedCityResult,
    index: number
  ) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleSuggestionClick(suggestion);
        break;
      case 'ArrowDown':
        e.preventDefault();
        const nextButton = dropdownRef.current?.children[index + 1]?.querySelector('button');
        if (nextButton) {
          nextButton.focus();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (index === 0) {
          inputRef.current?.focus();
        } else {
          const prevButton = dropdownRef.current?.children[index - 1]?.querySelector('button');
          if (prevButton) {
            prevButton.focus();
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        inputRef.current?.focus();
        break;
    }
  };

  // Get input border color based on state
  const getBorderColor = () => {
    if (error) return 'border-red-300 focus:border-red-500 focus:ring-red-200';
    if (isFocused) return 'border-blue-500 focus:border-blue-500 focus:ring-blue-200';
    return 'border-gray-200 focus:border-blue-500 focus:ring-blue-200';
  };

  // Get source indicator (removed for cleaner UI)
  const getSourceIndicator = () => {
    return null; // Transparent implementation - users don't need technical details
  };

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block body-sm font-semibold mb-2" style={{ color: '#374151' }}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChangeInternal}
          onFocus={handleInputFocusInternal}
          onBlur={handleInputBlurInternal}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`w-full px-4 py-3 pr-12 rounded-lg border ${getBorderColor()} transition-all duration-200 ${
            disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
          }`}
          aria-expanded={showSuggestions}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck="false"
        />

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Success indicator for valid selection */}
        {!isLoading && !error && inputValue && !showSuggestions && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <CheckIcon className="w-5 h-5 text-green-500" />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 flex items-start gap-2 text-red-600">
          <AlertIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Loading indicator only (removed source indicators) */}
      {isLoading && (
        <div className="mt-1 flex items-center justify-end">
          <span className="text-xs text-gray-500">Cercando...</span>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.name}-${suggestion.country}-${index}`}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              onKeyDown={(e) => handleSuggestionKeyDown(e, suggestion, index)}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors duration-150 flex items-center gap-3"
              role="option"
              aria-selected="false"
              tabIndex={-1}
            >
              {/* Type indicator */}
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                suggestion.type === 'city' ? 'bg-blue-500' : 
                suggestion.type === 'country' ? 'bg-purple-500' : 'bg-green-500'
              }`}></div>
              
              {/* City info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">
                  {suggestion.displayName}
                </div>
                <div className="text-xs text-gray-500">
                  {suggestion.type === 'city' ? 'Città' : 
                   suggestion.type === 'country' ? 'Paese' : 'Regione'}
                </div>
              </div>

              {/* Popularity indicator */}
              {suggestion.popularity && suggestion.popularity >= 8 && (
                <div className="flex-shrink-0" title="Destinazione popolare">
                  <SparklesIcon className="w-4 h-4 text-yellow-500" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && suggestions.length === 0 && !isLoading && inputValue.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-4 text-center text-gray-500">
          <MapIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm">Nessuna destinazione trovata</p>
          <p className="text-xs text-gray-400 mt-1">Prova con un nome diverso</p>
        </div>
      )}
    </div>
  );
};

export default CityAutocomplete;
