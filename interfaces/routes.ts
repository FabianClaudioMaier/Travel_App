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

export interface TransitStop {
  name: string;
  location: {
    latLng: {
      latitude: number;
      longitude: number;
    }
  }
}

export interface TransitDetails {
  stopDetails: {
    arrivalStop: TransitStop;
    departureStop: TransitStop;
    arrivalTime: string;
    departureTime: string;
  };
  localizedValues: {
    arrivalTime: {
      time: {
        text: string;
      };
      timeZone: string;
    };
    departureTime: {
      time: {
        text: string;
      };
      timeZone: string;
    };
  };
  headsign: string;
  transitLine: {
    agencies: {
      name: string;
      uri?: string;
      phoneNumber?: string;
    }[];
    name: string;
    color: string;
    nameShort: string;
    textColor: string;
    vehicle: {
      name: {
        text: string;
      };
      type: string;
      iconUri: string;
    }
  };
  stopCount: number;
}

export interface TransitStep {
  transitDetails: TransitDetails;
}

export interface TransitLeg {
  steps: TransitStep[];
}

export interface TransitRoute {
  legs: TransitLeg[];
  distanceMeters: number;
  duration: string;
  polyline: {
    encodedPolyline: string;
  }
}

export type BusRoutes = TransitRoute[];
export type TrainRoutes = TransitRoute[];


