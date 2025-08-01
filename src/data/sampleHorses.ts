import { Horse } from '@/types/horse';
import sampleHorse1 from '@/assets/sample-horse-1.jpg';
import sampleHorse2 from '@/assets/sample-horse-2.jpg';
import sampleHorse3 from '@/assets/sample-horse-3.jpg';

export const sampleHorses: Horse[] = [
  {
    id: '1',
    name: 'Thunder Bay',
    breed: 'Thoroughbred',
    age: 6,
    color: 'Chestnut',
    gender: 'Stallion',
    height: '16.2 hands',
    weight: 1200,
    price: 85000,
    status: 'Available',
    description: 'Thunder Bay is a magnificent thoroughbred stallion with exceptional conformation and a gentle temperament. He has shown great promise in dressage and jumping disciplines. His bloodlines trace back to champion lineage, making him an excellent choice for both competition and breeding.',
    pedigree: {
      sire: 'Lightning Strike',
      dam: 'Bay Princess'
    },
    health: {
      vaccinations: true,
      coggins: true,
      lastVetCheck: '2024-07-15'
    },
    training: {
      level: 'Advanced',
      disciplines: ['Dressage', 'Show Jumping', 'Cross Country']
    },
    images: [
      {
        id: '1-1',
        url: sampleHorse1,
        caption: 'Thunder Bay showing his excellent conformation',
        isPrimary: true
      }
    ],
    location: 'Kentucky, USA',
    dateAdded: '2024-06-01'
  },
  {
    id: '2',
    name: 'Midnight Star',
    breed: 'Arabian',
    age: 4,
    color: 'Black',
    gender: 'Mare',
    height: '15.1 hands',
    weight: 950,
    price: 45000,
    status: 'Available',
    description: 'Midnight Star is a stunning Arabian mare with classic dished face and high tail carriage. She moves with exceptional grace and has a spirited yet trainable disposition. Perfect for endurance riding or as a broodmare.',
    pedigree: {
      sire: 'Desert Wind',
      dam: 'Starlight Beauty'
    },
    health: {
      vaccinations: true,
      coggins: true,
      lastVetCheck: '2024-07-20'
    },
    training: {
      level: 'Intermediate',
      disciplines: ['Endurance', 'Western Pleasure', 'Trail']
    },
    images: [
      {
        id: '2-1',
        url: sampleHorse2,
        caption: 'Midnight Star displaying her Arabian elegance',
        isPrimary: true
      }
    ],
    location: 'California, USA',
    dateAdded: '2024-05-15'
  },
  {
    id: '3',
    name: 'Golden Sunset',
    breed: 'Quarter Horse',
    age: 8,
    color: 'Palomino',
    gender: 'Gelding',
    height: '15.3 hands',
    weight: 1100,
    price: 32000,
    status: 'Available',
    description: 'Golden Sunset is a well-trained quarter horse gelding with a calm and reliable temperament. He excels in western disciplines and is perfect for both experienced riders and those looking for a trustworthy mount. His golden coat and gentle nature make him a favorite.',
    pedigree: {
      sire: 'Golden Thunder',
      dam: 'Sunset Dream'
    },
    health: {
      vaccinations: true,
      coggins: true,
      lastVetCheck: '2024-07-25'
    },
    training: {
      level: 'Intermediate',
      disciplines: ['Western Pleasure', 'Reining', 'Trail', 'Ranch Work']
    },
    images: [
      {
        id: '3-1',
        url: sampleHorse3,
        caption: 'Golden Sunset showing his beautiful palomino coloring',
        isPrimary: true
      }
    ],
    location: 'Texas, USA',
    dateAdded: '2024-04-20'
  }
];