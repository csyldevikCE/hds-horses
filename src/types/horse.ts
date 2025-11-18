export interface Horse {
  id: string;
  name: string;
  breed: string;
  age: number; // Calculated from birthYear
  birthYear: number; // Year of birth (e.g., 2018)
  color: string;
  gender: 'Stallion' | 'Mare' | 'Gelding';
  height: string; // e.g., "165 cm"
  weight?: number;
  price?: number;
  status: 'Available' | 'Sold' | 'Reserved' | 'Not for Sale';
  description: string;
  pedigree?: {
    sire: string;
    dam: string;
    sireSire?: string;
    sireDam?: string;
    damSire?: string;
    damDam?: string;
    sireSireSire?: string;
    sireSireDam?: string;
    sireDamSire?: string;
    sireDamDam?: string;
    damSireSire?: string;
    damSireDam?: string;
    damDamSire?: string;
    damDamDam?: string;
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
  competitions?: {
    id: string;
    event: string;
    date: string;
    discipline: string;
    placement: string;
    notes?: string;
    equipeLink?: string;
  }[];
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
  // BLUP integration fields
  regno?: string;
  chipNumber?: string;
  wffsStatus?: number;
  studBookNo?: string;
  lifeNo?: string;
  foreignNo?: string;
  owner?: string;
  breeder?: string;
  blupUrl?: string;
  lastBlupSync?: string;
}