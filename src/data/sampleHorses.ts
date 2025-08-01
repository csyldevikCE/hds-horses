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
    competitions: [
      {
        id: 'comp-1-1',
        event: 'Regional Dressage Championship',
        date: '2024-06-15',
        discipline: 'Dressage',
        placement: '1st Place',
        notes: 'Scored 76.8% in Grand Prix level'
      },
      {
        id: 'comp-1-2',
        event: 'Summer Classic Show Jumping',
        date: '2024-05-20',
        discipline: 'Show Jumping',
        placement: '2nd Place',
        notes: 'Clear round in 1.30m class'
      },
      {
        id: 'comp-1-3',
        event: 'Spring Cross Country Event',
        date: '2024-04-10',
        discipline: 'Cross Country',
        placement: '3rd Place',
        notes: 'Completed Preliminary level course'
      }
    ],
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
    competitions: [
      {
        id: 'comp-2-1',
        event: 'Desert Endurance Ride',
        date: '2024-05-30',
        discipline: 'Endurance',
        placement: '5th Place',
        notes: 'Completed 50-mile course in excellent condition'
      },
      {
        id: 'comp-2-2',
        event: 'Arabian Horse Show',
        date: '2024-04-15',
        discipline: 'Western Pleasure',
        placement: '1st Place',
        notes: 'Champion Arabian Western Pleasure'
      }
    ],
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
    competitions: [
      {
        id: 'comp-3-1',
        event: 'Quarter Horse Congress',
        date: '2024-03-20',
        discipline: 'Western Pleasure',
        placement: '3rd Place',
        notes: 'Amateur Western Pleasure class'
      },
      {
        id: 'comp-3-2',
        event: 'Ranch Horse Challenge',
        date: '2024-02-10',
        discipline: 'Ranch Work',
        placement: '2nd Place',
        notes: 'Excellent cattle work and trail obstacles'
      }
    ],
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