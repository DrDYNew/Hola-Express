import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.209:5000/api';

export interface Location {
  lat: number;
  lng: number;
}

export interface GeocodeResult {
  formattedAddress: string;
  geometry: {
    location: Location;
  };
}

export interface GeocodeResponse {
  status: string;
  results: GeocodeResult[];
}

export interface DirectionsLeg {
  distance: {
    value: number;
    text: string;
  };
  duration: {
    value: number;
    text: string;
  };
}

export interface DirectionsRoute {
  overviewPolyline: {
    points: string;
  };
  legs: DirectionsLeg[];
}

export interface DirectionsResponse {
  status: string;
  routes: DirectionsRoute[];
}

const mapsService = {
  // Geocode address to coordinates
  geocodeAddress: async (address: string): Promise<GeocodeResponse> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(
        `${API_URL}/Maps/geocode?address=${encodeURIComponent(address)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to geocode address');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Get directions between two points
  getDirections: async (
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ): Promise<DirectionsResponse> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(
        `${API_URL}/Maps/directions?originLat=${originLat}&originLng=${originLng}&destLat=${destLat}&destLng=${destLng}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Directions API error:', errorText);
        throw new Error('Failed to get directions');
      }

      return await response.json();
    } catch (error) {
      console.error('Directions error:', error);
      throw error;
    }
  },

  // Reverse geocode coordinates to address
  reverseGeocode: async (lat: number, lng: number): Promise<GeocodeResponse> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(
        `${API_URL}/Maps/reverse-geocode?lat=${lat}&lng=${lng}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Reverse geocode API error:', errorText);
        throw new Error('Failed to reverse geocode');
      }

      return await response.json();
    } catch (error) {
      console.error('Reverse geocode error:', error);
      throw error;
    }
  },
};

export default mapsService;
