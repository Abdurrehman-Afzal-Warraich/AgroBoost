import type { Timestamp } from "firebase/firestore"

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

// City mapping for yield values
export const CITY_MAPPING = {
  Lahore: 32.745,
  Faisalabad: 33.8375,
  Rawalpindi: 16.8725,
  Gujranwala: 30.1075,
  Multan: 36.085,
  Sargodha: 25.7775,
  Sialkot: 30.24,
  Bahawalpur: 31.6925,
  Sheikhupura: 32.2625,
  Jhang: 29.74,
  "Rahim Yar Khan": 33.26,
  Kasur: 32.2625,
  Bahawalnagar: 33.26,
  Vehari: 33.26,
  Muzaffargarh: 33.26,
  Default: 30,
}

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
  cityAverage?: number // in maunds per acre
  totalCityAverage?: number // total maunds for the field
  city?: string
  soilType?: string
  predictionHistory: {
    round: number
    date: Date | Timestamp
    predictedYield: number
    actualYield?: number
    weatherConditions: string
    yieldChange: "Increased" | "Decreased" | "Stable" | "N/A"
  }[]
}
