import { useState, useCallback, useRef } from "react";
import { searchPlacesText, validatePlaceDetails, GooglePlaceResult, getMapsApiKey } from "@/lib/googleMapsPlaces";

export interface UseGooglePlacesOptions {
  debounceMs?: number;
  apiKey?: string;
}

export function useGooglePlaces(options: UseGooglePlacesOptions = {}) {
  const { debounceMs = 350, apiKey = getMapsApiKey() } = options;
  const [results, setResults] = useState<GooglePlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<GooglePlaceResult | null>(null);
  const [validating, setValidating] = useState(false);
  const timerRef = useRef<any>(null);

  const search = useCallback(
    (query: string) => {
      clearTimeout(timerRef.current);
      if (!query || query.trim().length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      timerRef.current = setTimeout(async () => {
        try {
          const places = await searchPlacesText(query, apiKey);
          setResults(places);
        } catch (err) {
          console.warn("Google Places search error:", err);
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, debounceMs);
    },
    [apiKey, debounceMs]
  );

  const validateAndSelect = useCallback(
    async (placeId: string, initialData?: Partial<GooglePlaceResult>) => {
      setValidating(true);
      try {
        const details = await validatePlaceDetails(placeId, apiKey);
        if (details) {
          setSelectedPlace(details);
          return details;
        } else if (initialData) {
          const fallback = {
            placeId,
            name: initialData.name || "",
            category: initialData.category || "Negócio Local",
            city: initialData.city || "Anápolis",
            rating: initialData.rating || 5.0,
            ...initialData,
          } as GooglePlaceResult;
          setSelectedPlace(fallback);
          return fallback;
        }
        return null;
      } finally {
        setValidating(false);
      }
    },
    [apiKey]
  );

  const clear = useCallback(() => {
    setResults([]);
    setSelectedPlace(null);
    setLoading(false);
    setValidating(false);
  }, []);

  return {
    results,
    loading,
    selectedPlace,
    validating,
    search,
    validateAndSelect,
    clear,
    apiKey,
  };
}
