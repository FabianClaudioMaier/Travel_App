export interface FlightSegment {
  distance: number;
  airline: string;
  to: string;
  from: string;
  duration: number;
}

export interface Flight {
  path: FlightSegment[];
  total_distance: number;
  stops: number;
  stops_duration: number[];
  encoded_polyline: string;
  price: number;
}

export type PlaneRoutes = Flight[]; 