import { Timestamp } from "firebase/firestore"

// First, let's add a mapping for rounds to months (September to April, 2 rounds per month)
export const ROUND_TO_MONTH_MAPPING = [
  { month: "Sep", round: 1 },
  { month: "Sep", round: 2 },
  { month: "Oct", round: 3 },
  { month: "Oct", round: 4 },
  { month: "Nov", round: 5 },
  { month: "Nov", round: 6 },
  { month: "Dec", round: 7 },
  { month: "Dec", round: 8 },
  { month: "Jan", round: 9 },
  { month: "Jan", round: 10 },
  { month: "Feb", round: 11 },
  { month: "Feb", round: 12 },
  { month: "Mar", round: 13 },
  { month: "Mar", round: 14 },
  { month: "Apr", round: 15 },
  { month: "Apr", round: 16 },
]

export type CityType = 'Lahore' | 'Faisalabad' | 'Rawalpindi' | 'Gujranwala' | 'Multan' | 'Sargodha' | 'Sialkot' | 'Bahawalpur' | 'Sheikhupura' | 'Jhang' | 'Rahim Yar Khan';

export const CITY_MAPPING: Record<CityType, number> = {
  'Lahore': 45,
  'Faisalabad': 42,
  'Rawalpindi': 38,
  'Gujranwala': 40,
  'Multan': 43,
  'Sargodha': 41,
  'Sialkot': 39,
  'Bahawalpur': 44,
  'Sheikhupura': 40,
  'Jhang': 41,
  'Rahim Yar Khan': 42
};

export interface YieldPredictionData {
  fieldId: string
  fieldSize: number
  cropType: string
  sowingDate: Date | Timestamp
  latitude: number
  longitude: number
  daysRemaining: number
  currentRound: number
  predictedYield: number // in maunds
  actualYield?: number // in maunds
  cityAverage: number
  totalCityAverage: number
  city: CityType
  soilType: string
  predictionHistory: Array<{
    round: number
    date: Date | Timestamp
    predictedYield: number
    actualYield?: number
    weatherConditions: string
    yieldChange: 'Increased' | 'Decreased' | 'Stable' | 'N/A'
  }>
}

export interface BackendPredictionRequest {
  latitude: number;
  longitude: number;
  city: CityType;
  interval_number: number;
  soil_type: string;
  sowing_date: string;
  timestamp: string;
  days_since_sowing: number;
}

export interface BackendPredictionResponse {
  predicted_yield: number;
  input_data: {
    City: string;
    Sowing_Date: string;
    Timestamp: string;
    Interval_Number: number;
    Days_Since_Sowing: number;
    Longitude: number;
    Latitude: number;
    NDVI: number;
    EVI: number;
    SAVI: number;
    NDWI: number;
    Red_Band: number;
    Green_Band: number;
    Blue_Band: number;
    NIR_Band: number;
    SWIR1_Band: number;
    SWIR2_Band: number;
    LST: number;
    Precipitation: number;
    Cloud_Cover: number;
    Soil_Type: string;
  };
  satellite_data_date: string | null;
  message: string | null;
}

// Helper function to ensure a city string is a valid CityType
export const ensureCityType = (city: string | null | undefined): CityType => {
  if (!city) return 'Lahore';
  return Object.keys(CITY_MAPPING).includes(city) ? (city as CityType) : 'Lahore';
};

// Helper function to ensure we have a Date object
export const ensureDate = (date: Date | Timestamp): Date => {
  return date instanceof Timestamp ? date.toDate() : date;
};
