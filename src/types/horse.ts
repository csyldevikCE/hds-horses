export interface Horse {
  id: string;
  name: string;
  breed: string;
  age: number;
  color: string;
  gender: 'Stallion' | 'Mare' | 'Gelding';
  height: string; // e.g., "16.2 hands"
  weight?: number;
  price?: number;
  status: 'Available' | 'Sold' | 'Reserved' | 'Not for Sale';
  description: string;
  pedigree?: {
    sire: string;
    dam: string;
  };
  health: {
    vaccinations: boolean;
    coggins: boolean;
    lastVetCheck: string;
  };
  training: {
    level: string;
    disciplines: string[];
  };
  images: {
    id: string;
    url: string;
    caption?: string;
    isPrimary: boolean;
  }[];
  videos?: {
    id: string;
    url: string;
    caption?: string;
    thumbnail?: string;
  }[];
  location: string;
  dateAdded: string;
}