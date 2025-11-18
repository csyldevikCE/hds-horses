/**
 * BLUP API Service
 *
 * Service for fetching horse data from the external BLUP system.
 * Handles API requests and data transformation to match our internal horse structure.
 */

// BLUP API Configuration
// Use production API for real horse data (with www subdomain to avoid redirect)
const BLUP_API_BASE_URL = 'https://www.blup.se/api/v1';
const BLUP_API_TOKEN = '9f1a2b3c4d5e6f7890abc1234567890defabcdef1234567890abcdef12345678';

/**
 * BLUP API Response Types
 */
interface BlupGenealogy {
  father?: {
    name: string;
    url?: string;
    father?: {
      name: string;
      url?: string;
      father?: { name: string; url?: string };
      mother?: { name: string; url?: string };
    };
    mother?: {
      name: string;
      url?: string;
      father?: { name: string; url?: string };
      mother?: { name: string; url?: string };
    };
  };
  mother?: {
    name: string;
    url?: string;
    father?: {
      name: string;
      url?: string;
      father?: { name: string; url?: string };
      mother?: { name: string; url?: string };
    };
    mother?: {
      name: string;
      url?: string;
      father?: { name: string; url?: string };
      mother?: { name: string; url?: string };
    };
  };
}

interface BlupHorseResponse {
  name: string;
  sex: string; // S = Stallion, M = Mare, G = Gelding
  born_year: number;
  regno: string;
  stud_book_no?: string;
  color: string;
  chip_number?: string;
  life_no?: string;
  foreign_no?: string;
  owner?: string;
  breeder?: string;
  wffs?: number;
  rating_text?: string | null;
  url?: string;
  genealogy?: BlupGenealogy;
}

/**
 * Transformed horse data for our forms
 */
export interface BlupHorseData {
  name: string;
  breed: string;
  birthYear: number;
  color: string;
  gender: 'Stallion' | 'Mare' | 'Gelding';
  regno: string;
  chipNumber?: string;
  wffsStatus?: number;
  studBookNo?: string;
  lifeNo?: string;
  breeder?: string;
  blupUrl?: string;
  pedigree?: {
    sire?: string;
    dam?: string;
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
}

/**
 * Map BLUP sex code to our gender enum
 */
const mapSexToGender = (sex: string): 'Stallion' | 'Mare' | 'Gelding' => {
  switch (sex.toUpperCase()) {
    case 'S':
      return 'Stallion';
    case 'M':
      return 'Mare';
    case 'G':
      return 'Gelding';
    default:
      console.warn(`Unknown sex code: ${sex}, defaulting to Gelding`);
      return 'Gelding';
  }
};

/**
 * Extract breed from horse name (e.g., "My Hawk's Quaterheat (SWB)" -> "SWB")
 */
const extractBreed = (name: string): string => {
  const breedMatch = name.match(/\(([^)]+)\)$/);
  if (breedMatch) {
    return breedMatch[1];
  }
  return 'Unknown';
};

/**
 * Transform BLUP genealogy to our pedigree structure
 */
const transformGenealogy = (genealogy?: BlupGenealogy) => {
  if (!genealogy) return undefined;

  return {
    sire: genealogy.father?.name,
    dam: genealogy.mother?.name,
    sireSire: genealogy.father?.father?.name,
    sireDam: genealogy.father?.mother?.name,
    damSire: genealogy.mother?.father?.name,
    damDam: genealogy.mother?.mother?.name,
    sireSireSire: genealogy.father?.father?.father?.name,
    sireSireDam: genealogy.father?.father?.mother?.name,
    sireDamSire: genealogy.father?.mother?.father?.name,
    sireDamDam: genealogy.father?.mother?.mother?.name,
    damSireSire: genealogy.mother?.father?.father?.name,
    damSireDam: genealogy.mother?.father?.mother?.name,
    damDamSire: genealogy.mother?.mother?.father?.name,
    damDamDam: genealogy.mother?.mother?.mother?.name,
  };
};

/**
 * Fetch horse data from BLUP API by registration number
 */
export const fetchHorseFromBlup = async (regno: string): Promise<BlupHorseData> => {
  try {
    // Clean the registration number (remove spaces, hyphens, etc.)
    const cleanRegno = regno.trim().replace(/[-\s]/g, '');

    if (!cleanRegno) {
      throw new Error('Registration number is required');
    }

    // Construct API URL
    const url = `${BLUP_API_BASE_URL}/horses/${cleanRegno}?token=${BLUP_API_TOKEN}`;
    console.log('[BLUP] Fetching from URL:', url);

    // Fetch data from BLUP API
    const response = await fetch(url);
    console.log('[BLUP] Response status:', response.status, response.statusText);

    if (!response.ok) {
      // Try to get error details from response body
      let errorDetail = '';
      try {
        const errorData = await response.json();
        errorDetail = JSON.stringify(errorData);
        console.error('[BLUP] Error response data:', errorData);
      } catch {
        errorDetail = await response.text();
        console.error('[BLUP] Error response text:', errorDetail);
      }

      if (response.status === 404) {
        throw new Error(`Horse with registration number "${regno}" not found in BLUP system`);
      }
      throw new Error(`BLUP API error: ${response.status} ${response.statusText}${errorDetail ? ` - ${errorDetail}` : ''}`);
    }

    const data: BlupHorseResponse = await response.json();
    console.log('[BLUP] Successfully fetched horse data:', data.name, data.regno);

    // Transform BLUP data to our format
    const transformedData: BlupHorseData = {
      name: data.name,
      breed: extractBreed(data.name),
      birthYear: data.born_year,
      color: data.color,
      gender: mapSexToGender(data.sex),
      regno: data.regno,
      chipNumber: data.chip_number,
      wffsStatus: data.wffs,
      studBookNo: data.stud_book_no || undefined,
      lifeNo: data.life_no || undefined,
      breeder: data.breeder || undefined,
      blupUrl: data.url || undefined,
      pedigree: transformGenealogy(data.genealogy),
    };

    return transformedData;
  } catch (error) {
    console.error('[BLUP] Error fetching horse data:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch horse data from BLUP system');
  }
};

/**
 * Validate registration number format
 */
export const validateRegno = (regno: string): { valid: boolean; message?: string } => {
  const cleanRegno = regno.trim();

  if (!cleanRegno) {
    return { valid: false, message: 'Registration number is required' };
  }

  // BLUP registration numbers are typically 8 digits
  const regnoPattern = /^\d{8}$/;
  const cleanedForValidation = cleanRegno.replace(/[-\s]/g, '');

  if (!regnoPattern.test(cleanedForValidation)) {
    return {
      valid: false,
      message: 'Registration number should be 8 digits (e.g., 04201515)'
    };
  }

  return { valid: true };
};

export const blupService = {
  fetchHorseFromBlup,
  validateRegno,
};
