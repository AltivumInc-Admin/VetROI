export interface VeteranHub {
  id: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  category: 'tech' | 'defense' | 'healthcare' | 'education' | 'mixed';
  size: number; // 1-5 for visual sizing
  companies: string[];
  industries: string[];
  veteranPopulation: string;
  avgSalary: string;
  description: string;
  color?: string;
}

export const veteranHubs: VeteranHub[] = [
  {
    id: 'austin-tx',
    city: 'Austin',
    state: 'TX',
    lat: 30.2672,
    lng: -97.7431,
    category: 'tech',
    size: 5,
    companies: ['Dell Technologies', 'IBM', 'Oracle', 'Tesla', 'Apple'],
    industries: ['Software', 'Hardware', 'Semiconductors', 'Clean Energy'],
    veteranPopulation: '35,000+',
    avgSalary: '$115,000',
    description: 'Premier tech hub with strong veteran hiring programs and no state income tax.',
    color: '#00d4ff'
  },
  {
    id: 'seattle-wa',
    city: 'Seattle',
    state: 'WA',
    lat: 47.6062,
    lng: -122.3321,
    category: 'mixed',
    size: 5,
    companies: ['Amazon', 'Microsoft', 'Boeing', 'Starbucks', 'T-Mobile'],
    industries: ['Cloud Computing', 'Aerospace', 'E-commerce', 'Defense'],
    veteranPopulation: '40,000+',
    avgSalary: '$125,000',
    description: 'Tech and aerospace powerhouse with Joint Base Lewis-McChord nearby.',
    color: '#22c55e'
  },
  {
    id: 'san-diego-ca',
    city: 'San Diego',
    state: 'CA',
    lat: 32.7157,
    lng: -117.1611,
    category: 'defense',
    size: 5,
    companies: ['General Atomics', 'Northrop Grumman', 'BAE Systems', 'SPAWAR'],
    industries: ['Defense', 'Biotech', 'Telecommunications', 'Naval Systems'],
    veteranPopulation: '240,000+',
    avgSalary: '$95,000',
    description: 'Major military presence with extensive defense contractor opportunities.',
    color: '#ff9800'
  },
  {
    id: 'northern-va',
    city: 'Arlington',
    state: 'VA',
    lat: 38.8816,
    lng: -77.0910,
    category: 'defense',
    size: 5,
    companies: ['Lockheed Martin', 'Booz Allen', 'CACI', 'SAIC', 'Raytheon'],
    industries: ['Government Contracting', 'Cybersecurity', 'Intelligence', 'IT Services'],
    veteranPopulation: '150,000+',
    avgSalary: '$120,000',
    description: 'Government contracting capital with top security clearance jobs.',
    color: '#ff9800'
  },
  {
    id: 'boston-ma',
    city: 'Boston',
    state: 'MA',
    lat: 42.3601,
    lng: -71.0589,
    category: 'education',
    size: 5,
    companies: ['Mass General', 'MIT', 'Harvard', 'Raytheon', 'GE Healthcare'],
    industries: ['Healthcare', 'Education', 'Biotech', 'Medical Devices'],
    veteranPopulation: '25,000+',
    avgSalary: '$110,000',
    description: 'World-class hospitals and universities with strong veteran programs.',
    color: '#9333ea'
  },
  {
    id: 'huntsville-al',
    city: 'Huntsville',
    state: 'AL',
    lat: 34.7304,
    lng: -86.5861,
    category: 'defense',
    size: 4,
    companies: ['NASA', 'Boeing', 'Dynetics', 'Missile Defense Agency'],
    industries: ['Space', 'Missile Defense', 'Aerospace', 'Engineering'],
    veteranPopulation: '30,000+',
    avgSalary: '$98,000',
    description: 'Rocket City USA - Space and missile defense hub with low cost of living.',
    color: '#ff9800'
  },
  {
    id: 'colorado-springs-co',
    city: 'Colorado Springs',
    state: 'CO',
    lat: 38.8339,
    lng: -104.8214,
    category: 'defense',
    size: 4,
    companies: ['Space Force', 'Lockheed Martin', 'Northrop Grumman', 'MITRE'],
    industries: ['Space Operations', 'Cybersecurity', 'Defense', 'Aerospace'],
    veteranPopulation: '45,000+',
    avgSalary: '$92,000',
    description: 'Home to Space Force and NORAD with stunning mountain views.',
    color: '#ff9800'
  },
  {
    id: 'charleston-sc',
    city: 'Charleston',
    state: 'SC',
    lat: 32.7765,
    lng: -79.9311,
    category: 'mixed',
    size: 3,
    companies: ['Boeing', 'Volvo', 'Mercedes-Benz', 'Naval Information Warfare'],
    industries: ['Aerospace', 'Manufacturing', 'Naval Systems', 'Logistics'],
    veteranPopulation: '50,000+',
    avgSalary: '$85,000',
    description: 'Growing aerospace and manufacturing hub with Naval presence.',
    color: '#22c55e'
  },
  {
    id: 'phoenix-az',
    city: 'Phoenix',
    state: 'AZ',
    lat: 33.4484,
    lng: -112.0740,
    category: 'tech',
    size: 4,
    companies: ['Intel', 'TSMC', 'Honeywell', 'American Express', 'GoDaddy'],
    industries: ['Semiconductors', 'Manufacturing', 'Financial Services', 'Tech'],
    veteranPopulation: '65,000+',
    avgSalary: '$88,000',
    description: 'Emerging semiconductor capital with year-round sunshine.',
    color: '#00d4ff'
  },
  {
    id: 'raleigh-durham-nc',
    city: 'Raleigh-Durham',
    state: 'NC',
    lat: 35.7796,
    lng: -78.6382,
    category: 'tech',
    size: 4,
    companies: ['IBM', 'Cisco', 'SAS', 'Epic Games', 'MetLife'],
    industries: ['Software', 'Biotech', 'Gaming', 'Research'],
    veteranPopulation: '40,000+',
    avgSalary: '$95,000',
    description: 'Research Triangle with major universities and tech companies.',
    color: '#00d4ff'
  },
  {
    id: 'nashville-tn',
    city: 'Nashville',
    state: 'TN',
    lat: 36.1627,
    lng: -86.7816,
    category: 'healthcare',
    size: 3,
    companies: ['HCA Healthcare', 'Vanderbilt Medical', 'Asurion', 'Bridgestone'],
    industries: ['Healthcare', 'Insurance', 'Music/Entertainment', 'Logistics'],
    veteranPopulation: '35,000+',
    avgSalary: '$82,000',
    description: 'Healthcare capital with growing tech scene and no state income tax.',
    color: '#10b981'
  }
];

// Arc connections showing common veteran migration patterns
export const migrationArcs = [
  { 
    startLat: 38.8816, startLng: -77.0910, // Northern VA
    endLat: 30.2672, endLng: -97.7431, // Austin
    color: 'rgba(0, 212, 255, 0.4)'
  },
  {
    startLat: 32.7157, startLng: -117.1611, // San Diego
    endLat: 47.6062, endLng: -122.3321, // Seattle
    color: 'rgba(34, 197, 94, 0.4)'
  },
  {
    startLat: 34.7304, startLng: -86.5861, // Huntsville
    endLat: 38.8339, endLng: -104.8214, // Colorado Springs
    color: 'rgba(255, 152, 0, 0.4)'
  },
  {
    startLat: 38.8816, startLng: -77.0910, // Northern VA
    endLat: 35.7796, endLng: -78.6382, // Raleigh-Durham
    color: 'rgba(147, 51, 234, 0.4)'
  }
];