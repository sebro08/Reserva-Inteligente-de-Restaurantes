export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Restaurant {
  id: number;
  name: string;
  location_id: number;
}

export interface Plate {
  id: number;
  name: string;
  price: number;
}

export interface Order {
  id: number;
  user_id: number;
  restaurant_id: number;
  location_id: number;
}

export interface OrderItem {
  order_id: number;
  plate_id: number;
}

export interface Location {
  id: number;
  name: string;
  district_id: number;
  latitude: number | null;
  longitude: number | null;
}