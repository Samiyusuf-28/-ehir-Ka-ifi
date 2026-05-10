import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface CityData {
  name: string;
  country: string;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  foods: {
    name: string;
    description: string;
  }[];
  landmarks: {
    name: string;
    description: string;
    coordinates?: { lat: number; lng: number };
  }[];
  scenicSpots: {
    name: string;
    description: string;
    coordinates?: { lat: number; lng: number };
  }[];
  restaurants: {
    name: string;
    specialty: string;
    description: string;
    coordinates?: { lat: number; lng: number };
  }[];
  hotels: {
    name: string;
    stars: number;
    description: string;
    approxPrice: string;
    coordinates?: { lat: number; lng: number };
  }[];
  aestheticPrompt: string;
}

export interface ItineraryRoute {
  theme: string;
  title: string;
  description: string;
  steps: {
    locationName: string;
    description: string;
    estimatedTime: string;
    type: 'landmark' | 'food' | 'scenic';
  }[];
}

export async function getCityDetails(cityName: string): Promise<CityData> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Bir seyahat uzmanı gibi davran. "${cityName}" şehri hakkında detaylı bilgi ver. Bilgiler Türkçe olmalı. Şehir merkezinin ve listelediğin yerlerin (landmark, scenic, restaurant, hotel) koordinatlarını doğru ver. Konaklama için her yıldız kategorisinden (1, 2, 3, 4, 5 yıldız) 2'şer tane hotel öner ve yaklaşık gecelik fiyatlarını belirt.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          country: { type: Type.STRING },
          description: { type: Type.STRING },
          coordinates: {
            type: Type.OBJECT,
            properties: {
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER }
            },
            required: ["lat", "lng"]
          },
          foods: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          },
          landmarks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                coordinates: {
                  type: Type.OBJECT,
                  properties: {
                    lat: { type: Type.NUMBER },
                    lng: { type: Type.NUMBER }
                  }
                }
              }
            }
          },
          scenicSpots: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                coordinates: {
                  type: Type.OBJECT,
                  properties: {
                    lat: { type: Type.NUMBER },
                    lng: { type: Type.NUMBER }
                  }
                }
              }
            }
          },
          restaurants: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                specialty: { type: Type.STRING },
                description: { type: Type.STRING },
                coordinates: {
                  type: Type.OBJECT,
                  properties: {
                    lat: { type: Type.NUMBER },
                    lng: { type: Type.NUMBER }
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
                stars: { type: Type.NUMBER },
                description: { type: Type.STRING },
                approxPrice: { type: Type.STRING },
                coordinates: {
                  type: Type.OBJECT,
                  properties: {
                    lat: { type: Type.NUMBER },
                    lng: { type: Type.NUMBER }
                  }
                }
              },
              required: ["name", "stars", "description", "approxPrice"]
            }
          },
          aestheticPrompt: { 
            type: Type.STRING, 
            description: "A very specific English search term for Unsplash to find a cinematic, breathtaking photo of this city (e.g. 'istanbul-hagiasophia-sunset')."
          }
        },
        required: ["name", "country", "description", "coordinates", "foods", "landmarks", "scenicSpots", "restaurants", "hotels", "aestheticPrompt"]
      }
    }
  });

  return JSON.parse(response.text);
}

export interface TravelInfo {
  distKm: number;
  driving: string;
  walking: string;
  cycling: string;
  flight: string | null;
}

export async function getTravelEstimates(origin: string, destination: string): Promise<TravelInfo> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Calculate travel estimates between "${origin}" and "${destination}". 
    Return JSON format. Values should be in Turkish (e.g. "12 saat", "4 gün"). 
    If distance is very long (ocean crossing), set driving/walking/cycling to "Ulaşım mümkün değil" and provide flight estimate. 
    Otherwise, estimate all. 
    Approximate "distKm" as a number.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          distKm: { type: Type.NUMBER },
          driving: { type: Type.STRING },
          walking: { type: Type.STRING },
          cycling: { type: Type.STRING },
          flight: { type: Type.STRING }
        },
        required: ["distKm", "driving", "walking", "cycling", "flight"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function getItinerary(cityName: string, theme: string): Promise<ItineraryRoute> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `"${cityName}" şehri için "${theme}" temalı detaylı bir gezi rotası oluştur. Bilgiler Türkçe olmalı.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          theme: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                locationName: { type: Type.STRING },
                description: { type: Type.STRING },
                estimatedTime: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['landmark', 'food', 'scenic'] }
              }
            }
          }
        },
        required: ["theme", "title", "description", "steps"]
      }
    }
  });

  return JSON.parse(response.text);
}
