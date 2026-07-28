import type { LocationRef } from '@/types/inquiry'

/** Small offline reference set so operators can type a code and move on. */
export const AIRPORTS: LocationRef[] = [
  { code: 'LHR', name: 'London Heathrow', countryCode: 'GB' },
  { code: 'LGG', name: 'Liège', countryCode: 'BE' },
  { code: 'AMS', name: 'Amsterdam Schiphol', countryCode: 'NL' },
  { code: 'FRA', name: 'Frankfurt', countryCode: 'DE' },
  { code: 'CDG', name: 'Paris Charles de Gaulle', countryCode: 'FR' },
  { code: 'MAD', name: 'Madrid Barajas', countryCode: 'ES' },
  { code: 'IST', name: 'Istanbul', countryCode: 'TR' },
  { code: 'DXB', name: 'Dubai International', countryCode: 'AE' },
  { code: 'DOH', name: 'Doha Hamad', countryCode: 'QA' },
  { code: 'BOM', name: 'Mumbai', countryCode: 'IN' },
  { code: 'DEL', name: 'Delhi', countryCode: 'IN' },
  { code: 'BLR', name: 'Bengaluru', countryCode: 'IN' },
  { code: 'SIN', name: 'Singapore Changi', countryCode: 'SG' },
  { code: 'HKG', name: 'Hong Kong', countryCode: 'HK' },
  { code: 'PVG', name: 'Shanghai Pudong', countryCode: 'CN' },
  { code: 'CAN', name: 'Guangzhou', countryCode: 'CN' },
  { code: 'NRT', name: 'Tokyo Narita', countryCode: 'JP' },
  { code: 'ICN', name: 'Seoul Incheon', countryCode: 'KR' },
  { code: 'SYD', name: 'Sydney', countryCode: 'AU' },
  { code: 'JFK', name: 'New York JFK', countryCode: 'US' },
  { code: 'ORD', name: 'Chicago O’Hare', countryCode: 'US' },
  { code: 'LAX', name: 'Los Angeles', countryCode: 'US' },
  { code: 'MIA', name: 'Miami', countryCode: 'US' },
  { code: 'ATL', name: 'Atlanta', countryCode: 'US' },
  { code: 'YYZ', name: 'Toronto Pearson', countryCode: 'CA' },
  { code: 'GRU', name: 'São Paulo Guarulhos', countryCode: 'BR' },
  { code: 'JNB', name: 'Johannesburg', countryCode: 'ZA' },
  { code: 'NBO', name: 'Nairobi', countryCode: 'KE' },
]

export function findLocation(code: string): LocationRef | undefined {
  const normalized = code.trim().toUpperCase()
  return AIRPORTS.find((airport) => airport.code === normalized)
}

export interface LaneTemplate {
  id: string
  label: string
  origin: string
  destination: string
  direction: 'import' | 'export'
  cargoSummary: string
}

/** One tap replaces six fields — the fastest path to a saved inquiry. */
export const LANE_TEMPLATES: LaneTemplate[] = [
  {
    id: 'lhr-jfk',
    label: 'LHR → JFK',
    origin: 'LHR',
    destination: 'JFK',
    direction: 'export',
    cargoSummary: 'General cargo — 4 pallets, 900 kg, stackable',
  },
  {
    id: 'hkg-lax',
    label: 'HKG → LAX',
    origin: 'HKG',
    destination: 'LAX',
    direction: 'import',
    cargoSummary: 'Consumer electronics — 12 cartons, 320 kg',
  },
  {
    id: 'fra-sin',
    label: 'FRA → SIN',
    origin: 'FRA',
    destination: 'SIN',
    direction: 'export',
    cargoSummary: 'Machinery parts — 2 crates, 610 kg',
  },
  {
    id: 'bom-dxb',
    label: 'BOM → DXB',
    origin: 'BOM',
    destination: 'DXB',
    direction: 'export',
    cargoSummary: 'Textiles — 20 cartons, 480 kg',
  },
]
