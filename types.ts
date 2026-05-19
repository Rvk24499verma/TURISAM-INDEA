
export enum SectionType {
  HISTORY = 'HISTORY',
  CULTURE = 'CULTURE',
  TEMPLES = 'TEMPLES',
  PLACES = 'PLACES',
  MARKETS = 'MARKETS',
  HOTELS = 'HOTELS',
  EMERGENCY = 'EMERGENCY',
  OWNER = 'OWNER'
}

export interface Place {
  name: string;
  description: string;
  type: string; // Temple, Fort, Market, etc.
  location?: string;
  rating?: number;
  imagePrompt?: string; // For AI image generation or placeholder
  extras?: { key: string; value: string }[]; // Flexible details: "Aarti Time", "Ticket Price", "Famous For", "Parking", "Entry Rules"
}

export interface FestivalDetail {
  name: string;
  history: string; // The origin story
  why: string; // The reason for celebration (mythological/seasonal)
  how: string; // How it is celebrated (rituals/process)
}

export interface LocationData {
  name: string;
  summary: string;
  weather?: {
    temp: string;
    condition: string;
    alert?: string;
  };
  history: {
    ancient: string;
    kings?: string[];
    battles?: string[];
    architecture?: string;
    languages?: string[];
    beliefs?: string;
    name_history?: string; // Old Name vs New Name
    modern: string;
    events: string[];
  };
  culture: {
    clothing: string;
    food: string[];
    dance?: string;
    stories?: string; // Folk tales
    rituals?: string; // Weddings / Customs
    tribes?: string;
    festivals: FestivalDetail[]; // Updated structure
    traditions: string;
  };
  temples: Place[];
  touristSpots: Place[];
  markets: Place[];
  hotels?: Place[];
}

export interface OwnerListing {
  id: string;
  name: string;
  category: 'Hotel' | 'Shop' | 'Temple' | 'Restaurant';
  description: string;
  contact: string;
  address: string;
  image?: string;
}

export interface GeoPosition {
  latitude: number;
  longitude: number;
}

export interface NearbyPlace {
  title: string;
  uri: string;
  source: 'map' | 'web';
}

export interface TripActivity {
  time: string;
  activity: string;
  location?: string;
}

export interface TripDay {
  day: number;
  theme: string;
  activities: TripActivity[];
}

export interface TripPlan {
  destination: string;
  duration: number;
  type: string;
  itinerary: TripDay[];
}
