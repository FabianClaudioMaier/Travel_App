import { Cities, City, Region, Regions } from '@/interfaces/destinations';
import { Posts } from '@/interfaces/forum';
import { PlaneRoutes, BusRoutes, TrainRoutes } from '@/interfaces/routes';
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
                // console.log(url);
                const response = await axios.get<Cities>(url);
                // console.log(response.data);
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
        },
        getRegionById: async (regionId: string): Promise<Region> => {
            try {
                const response = await axios.get<Region>(`${BASE_URL}/destinations/regions/${regionId}`);
                return response.data;
            } catch (error) {
                console.log('Error fetching region by id', error);
                if (axios.isAxiosError(error)) {
                    throw new Error(`Failed to fetch region by id: ${error.message}`);
                }
                throw error;
            }
        }
    },
  routes: {
    getFlights: async (origin: string, destination: string): Promise<PlaneRoutes> => {
      try {
        const response = await axios.get<PlaneRoutes>(`${BASE_URL}/routes/flights`, {
          params: {
            origin,
            destination
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
    getBusRoutes: async (origin: string, destination: string): Promise<BusRoutes> => {
      try {
        const response = await axios.get<BusRoutes>(`${BASE_URL}/routes/buses`, {
          params: {
            origin,
            destination
          }
        });
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new Error(`Failed to fetch bus routes: ${error.message}`);
        }
        throw error;
      }
    },
    getTrains: async (origin: string, destination: string): Promise<TrainRoutes> => {
      try {
        const response = await axios.get<TrainRoutes>(`${BASE_URL}/routes/trains`, {
          params: {
            origin,
            destination
          }
        });
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new Error(`Failed to fetch trains: ${error.message}`);
        }
        throw error;
      }
    }
  },
  forum: {
    getPostsByRegionId: async (regionId: string): Promise<Posts> => {
      try {
        const response = await axios.get<Posts>(`${BASE_URL}/forum/posts_by_region?region_id=${regionId}`);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new Error(`Failed to fetch posts: ${error.message}`);
        }
        throw error;
      }
    },
    uploadImages: async (images: string[]): Promise<{image_urls: string[]}> => {
      try {
        const formData = new FormData();

        images.forEach((imageUri, index) => {
          formData.append('files', {
            uri: imageUri,
            type: 'image/*',
            name: `image${index}${imageUri.substring(imageUri.lastIndexOf('.'))}`
          } as any);
        });

        const response = await axios.post<{image_urls: string[]}>(`${BASE_URL}/forum/upload_images`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new Error(`Failed to upload images: ${error.message}`);
        }
        throw error;
      }
    },
    createPost: async (
      post: {
          city_id: string,
          region_id: string,
          title: string,
          content: string,
          rating: number,
          date: string,
          author: string,
          images: string[]
        }
      ): Promise<{success: boolean, message: string}> => {
      try {
        const postData = {
          region_id: post.region_id,
          title: post.title,
          city_id: post.city_id,
          content: post.content,
          rating: post.rating,
          date: new Date(post.date).toISOString(),
          author: post.author,
          image_urls: post.images
        };

        const response = await axios.post<{success: boolean, message: string}>(
          `${BASE_URL}/forum/posts`,
          postData
        );

        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            const detail = error.response.data?.detail;
            if (detail === "Region not found") {
              return {success: false, message: 'Region not found'};
            }
            return {success: false, message: 'City not found'};
          }
          if (error.response?.status === 500) {
            return {success: false, message: 'Server error occurred'};
          }
          return {success: false, message: `Failed to create post: ${error.message}`};
        }
        return {success: false, message: 'Failed to create post'};
      }
    }
  }
};

export default api;