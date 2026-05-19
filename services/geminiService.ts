
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini AI
// Note: In a real production app, ensure the key is secure.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLocationDetails = async (locationName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Provide a comprehensive tourism and cultural guide for ${locationName}, India.
      
      Include detailed:
      1. Weather: Current typical temperature, condition, and alerts.
      2. Deep History: 
         - Ancient history & origins.
         - Specific "Kings & Dynasties" who ruled.
         - "Battles" or wars fought there.
         - "Architecture" style (e.g., Dravidian, Mughal).
         - "Old Name vs New Name" facts.
      3. Deep Culture & Village Festivals: 
         - Traditional Clothing.
         - "Dance & Music" forms.
         - "Tribal Culture".
         - "Rituals" (Wedding traditions, religious customs).
         - "Folk Tales".
         - IMPORTANT: For "Festivals", provide the name, "History" (origin), "Why" it is celebrated (significance), and "How" it is celebrated (rituals).
      4. Temples: For each temple include "Aarti Timings", "Mythology/Story", "Architecture", "Parking", "Entry Rules" in 'extras'.
      5. Tourist Spots: Forts, nature, etc.
      6. Markets: Famous local products and price ranges.
      7. Hotels: Popular stay options.

      Focus on accuracy, specific names, and cultural depth.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            summary: { type: Type.STRING },
            weather: {
              type: Type.OBJECT,
              properties: {
                temp: { type: Type.STRING },
                condition: { type: Type.STRING },
                alert: { type: Type.STRING }
              }
            },
            history: {
              type: Type.OBJECT,
              properties: {
                ancient: { type: Type.STRING },
                kings: { type: Type.ARRAY, items: { type: Type.STRING } },
                battles: { type: Type.ARRAY, items: { type: Type.STRING } },
                architecture: { type: Type.STRING },
                languages: { type: Type.ARRAY, items: { type: Type.STRING } },
                beliefs: { type: Type.STRING },
                name_history: { type: Type.STRING },
                modern: { type: Type.STRING },
                events: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            culture: {
              type: Type.OBJECT,
              properties: {
                clothing: { type: Type.STRING },
                food: { type: Type.ARRAY, items: { type: Type.STRING } },
                dance: { type: Type.STRING },
                stories: { type: Type.STRING },
                rituals: { type: Type.STRING },
                tribes: { type: Type.STRING },
                festivals: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      history: { type: Type.STRING },
                      why: { type: Type.STRING },
                      how: { type: Type.STRING }
                    }
                  } 
                },
                traditions: { type: Type.STRING }
              }
            },
            temples: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  type: { type: Type.STRING },
                  rating: { type: Type.NUMBER },
                  extras: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        key: { type: Type.STRING },
                        value: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            },
            touristSpots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  type: { type: Type.STRING },
                  rating: { type: Type.NUMBER },
                  extras: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        key: { type: Type.STRING },
                        value: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            },
            markets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  type: { type: Type.STRING },
                  extras: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        key: { type: Type.STRING },
                        value: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            },
            hotels: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  type: { type: Type.STRING },
                  rating: { type: Type.NUMBER },
                  extras: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        key: { type: Type.STRING },
                        value: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Error fetching location details:", error);
    throw error;
  }
};

export const searchNearbyPlaces = async (lat: number, lng: number, query: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find ${query} near the location provided.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      }
    });
    
    // Extract grounding chunks for maps
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // Extract both Web and Map chunks
    const places = chunks.map((c: any) => {
        if (c.web) {
            return { title: c.web.title, uri: c.web.uri, source: 'web' };
        }
        if (c.maps) {
            return { 
                title: c.maps.title || "Map Location", 
                uri: c.maps.googleMapsUri || c.maps.uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.maps.title || query)}`,
                source: 'map' 
            };
        }
        return null;
    }).filter((p: any) => p && p.title && p.uri);

    // Deduplicate
    const uniquePlaces = places.filter((v: any, i: number, a: any[]) => a.findIndex((v2: any) => (v2.uri === v.uri)) === i);

    return { text: response.text, places: uniquePlaces };
  } catch (error) {
    console.error("Error searching nearby:", error);
    return { text: "Could not fetch nearby places.", places: [] };
  }
};

export const getPlaceDetails = async (placeName: string) => {
  try {
     const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Provide a short, attractive summary (max 50 words) for the place "${placeName}" in India. 
      Also provide a rating (1-5) and a visual description for a placeholder image.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            type: { type: Type.STRING },
            rating: { type: Type.NUMBER },
            imagePrompt: { type: Type.STRING }
          }
        }
      }
    });
    
    if (response.text) {
      return JSON.parse(response.text);
    }
    return { description: "Details unavailable", type: "Unknown", rating: 0 };
  } catch (error) {
    console.error("Error getting place details", error);
    return null;
  }
};

export const getEmergencyInfo = async (locationName: string) => {
   try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `List important emergency contacts for a tourist in ${locationName}, India. 
      Include Police, Ambulance, Fire, and any specific tourist helpline. 
      Return as a simple list suitable for display.`,
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching emergency info:", error);
    return "Unable to fetch emergency info. Please dial 112 for All-India Emergency.";
  }
};

export const generateTripItinerary = async (destination: string, days: number, type: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a ${days}-day ${type} itinerary for ${destination}, India.
      Provide a daily breakdown with themes and morning/afternoon/evening activities.
      Ensure the activities are realistic and geographically logical.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            destination: { type: Type.STRING },
            duration: { type: Type.NUMBER },
            type: { type: Type.STRING },
            itinerary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.NUMBER },
                  theme: { type: Type.STRING },
                  activities: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        time: { type: Type.STRING },
                        activity: { type: Type.STRING },
                        location: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No itinerary generated");
  } catch (error) {
    console.error("Error generating trip:", error);
    throw error;
  }
};
