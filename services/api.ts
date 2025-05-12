
import { Cities, City, Regions } from '@/interfaces/destinations';
import { PlaneRoutes } from '@/interfaces/routes';
import axios from 'axios';

const BASE_URL = 'https://hci-backend-541730464130.europe-central2.run.app';

// Create axios instance with default config
const api = {
    destinations: {
        getAllCities: async (): Promise<Cities> => {
            try {
                const response = await axios.get<Cities>(`${BASE_URL}/destinations/cities`);
                return response.data;
            } catch (error) {
                console.log('Error fetching cities', error);
                if (axios.isAxiosError(error)) {
                    throw new Error(`Failed to fetch cities: ${error.message}`);
                }
                throw error;
            }
        },
        getCitiesByRegion: async (regionId: string): Promise<Cities> => {
            try {
                console.log('Fetching cities by region', regionId);
                const url = `${BASE_URL}/destinations/cities_by_region?region=${regionId}`;
                console.log(url);
                const response = await axios.get<Cities>(url);
                console.log(response.data);
                return response.data;
            } catch (error) {
                console.log('Error fetching cities by region', error);
                if (axios.isAxiosError(error)) {
                    throw new Error(`Failed to fetch cities by region: ${error.message}`);
                }
                throw error;
            }
        },
        getCityById: async (cityId: string): Promise<City> => {
            try {
                const response = await axios.get<City>(`${BASE_URL}/destinations/cities/${cityId}`);
                return response.data;
            } catch (error) {
                console.log('Error fetching city by id', error);
                if (axios.isAxiosError(error)) {
                    throw new Error(`Failed to fetch city by id: ${error.message}`);
                }
                throw error;
            }
        },
        getAllRegions: async (): Promise<Regions> => {
            try {
                const response = await axios.get<Regions>(`${BASE_URL}/destinations/regions`);
                return response.data;
            } catch (error) {
                console.log('Error fetching regions', error);
                if (axios.isAxiosError(error)) {
                    throw new Error(`Failed to fetch regions: ${error.message}`);
                }
                throw error;
            }
        }
    },
  routes: {
    getFlights: async (): Promise<PlaneRoutes> => {
      try {
        const response = await axios.get<PlaneRoutes>(`${BASE_URL}/routes/flights`, {
          params: {
          }
        });
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new Error(`Failed to fetch flights: ${error.message}`);
        }
        throw error;
      }
    },
  }
};

export default api;