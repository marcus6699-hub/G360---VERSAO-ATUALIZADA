/**
 * Google Maps Platform - Places API Utility
 * Provides utilities for searching, autocompleting, and validating business profiles via Google Places API (New).
 */

export interface GooglePlaceResult {
  placeId: string;
  name: string;
  formattedAddress?: string;
  category?: string;
  rating?: number;
  userRatingCount?: number;
  phone?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  city?: string;
  photos?: string[];
  isOpenNow?: boolean;
  weekdayDescriptions?: string[];
}

export function getMapsApiKey(): string {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
}

/**
 * Searches places via Places API Text Search (New) or fallback endpoint
 */
export async function searchPlacesText(
  query: string,
  apiKey: string = getMapsApiKey()
): Promise<GooglePlaceResult[]> {
  if (!query || query.trim().length < 2) return [];

  // If running in browser and google.maps.places is loaded
  if (typeof window !== "undefined" && window.google?.maps?.places?.Place) {
    try {
      const { Place } = window.google.maps.places;
      const request = {
        textQuery: query,
        fields: [
          "id",
          "displayName",
          "formattedAddress",
          "rating",
          "userRatingCount",
          "nationalPhoneNumber",
          "websiteURI",
          "googleMapsURI",
          "photos",
          "primaryTypeDisplayName",
          "regularOpeningHours",
        ],
        language: "pt-BR",
        maxResultCount: 5,
      };
      const { places } = await (Place as any).searchByText(request);
      if (places && Array.isArray(places)) {
        return places.map((p: any) => ({
          placeId: p.id || "",
          name: p.displayName || "",
          formattedAddress: p.formattedAddress || "",
          category: p.primaryTypeDisplayName || "Empresa Local",
          rating: p.rating || 5.0,
          userRatingCount: p.userRatingCount || 0,
          phone: p.nationalPhoneNumber || "",
          websiteUri: p.websiteURI || "",
          googleMapsUri: p.googleMapsURI || "",
          city: extractCityFromAddress(p.formattedAddress || ""),
          photos: (p.photos || []).map((ph: any) =>
            typeof ph.getURI === "function" ? ph.getURI({ maxWidth: 800 }) : ""
          ).filter(Boolean),
          isOpenNow: p.regularOpeningHours?.isOpen?.() ?? true,
          weekdayDescriptions: p.regularOpeningHours?.weekdayDescriptions || [],
        }));
      }
    } catch (err) {
      console.warn("Places API JS client search failed, falling back to direct endpoint:", err);
    }
  }

  // Fallback direct HTTP POST to Places API (New) textSearch
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.primaryTypeDisplayName,places.regularOpeningHours",
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: "pt-BR",
        pageSize: 5,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.places && Array.isArray(data.places)) {
        return data.places.map((p: any) => ({
          placeId: p.id || "",
          name: p.displayName?.text || "",
          formattedAddress: p.formattedAddress || "",
          category: p.primaryTypeDisplayName?.text || "Comércio Local",
          rating: p.rating || 5.0,
          userRatingCount: p.userRatingCount || 0,
          phone: p.nationalPhoneNumber || "",
          websiteUri: p.websiteUri || "",
          googleMapsUri: p.googleMapsUri || "",
          city: extractCityFromAddress(p.formattedAddress || ""),
          photos: [],
          isOpenNow: p.regularOpeningHours?.openNow ?? true,
          weekdayDescriptions: p.regularOpeningHours?.weekdayDescriptions || [],
        }));
      }
    }
  } catch (netErr) {
    console.warn("Direct Places searchText fetch error:", netErr);
  }

  return [];
}

/**
 * Validates and fetches detailed data for a specific Google Place ID
 */
export async function validatePlaceDetails(
  placeId: string,
  apiKey: string = getMapsApiKey()
): Promise<GooglePlaceResult | null> {
  if (!placeId) return null;

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "id,displayName,formattedAddress,rating,userRatingCount,nationalPhoneNumber,websiteUri,googleMapsUri,primaryTypeDisplayName,regularOpeningHours",
      },
    });

    if (res.ok) {
      const p = await res.json();
      return {
        placeId: p.id || placeId,
        name: p.displayName?.text || "",
        formattedAddress: p.formattedAddress || "",
        category: p.primaryTypeDisplayName?.text || "Negócio Local",
        rating: p.rating || 5.0,
        userRatingCount: p.userRatingCount || 0,
        phone: p.nationalPhoneNumber || "",
        websiteUri: p.websiteUri || "",
        googleMapsUri: p.googleMapsUri || "",
        city: extractCityFromAddress(p.formattedAddress || ""),
        photos: [],
        isOpenNow: p.regularOpeningHours?.openNow ?? true,
        weekdayDescriptions: p.regularOpeningHours?.weekdayDescriptions || [],
      };
    }
  } catch (e) {
    console.error("Failed to validate place ID:", e);
  }

  return null;
}

function extractCityFromAddress(address: string): string {
  if (!address) return "Anápolis";
  // Brazilian address usually ends with "City - UF, CEP, Brasil"
  const parts = address.split("-");
  if (parts.length > 1) {
    const cityPart = parts[parts.length - 1].split(",")[0].trim();
    if (cityPart.length > 2) return cityPart;
  }
  return "Anápolis";
}
