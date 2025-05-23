import { Timestamp } from 'firebase/firestore';

export interface PredictionData {
  cropName: string;
  location: string;
  predictedYield: number;
  fieldSize: number;
  cityAverage?: number;
  totalCityAverage?: number;
}

export interface UserData {
  uid: string;
  displayName: string;
  photoURL: string;
}

export interface Auction {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhoto: string;
  cropName: string;
  location: string;
  predictedQuantity: number;
  sellableQuantity: number;
  totalPrice: number;
  sellingQuantity: number;
  createdAt: Timestamp;
  status: string;
} 