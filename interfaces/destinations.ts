export interface PriceRange {
  max: number;
  min: number;
}

export interface TransportPrices {
  plane?: PriceRange;
  train?: PriceRange;
  bus?: PriceRange;
}

export interface City {
  region_id: string;
  country: string;
  price: TransportPrices;
  IATA: string;
  city_name: string;
  id: string;
}

export type Cities = City[];

export interface Region {
  id: string;
  name: string;
  continent: string;
}

export type Regions = Region[];