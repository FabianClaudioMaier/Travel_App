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
  region_name: string;
  country: string;
  price: TransportPrices;
  IATA: string;
  city_name: string;
  id: string;
  image_url: string;
}

export type Cities = City[];

export interface Region {
  id: string;
  name: string;
  continent: string;
  description: string;
  image_url: string;
}

export type Regions = Region[];