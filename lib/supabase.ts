import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          city: string | null;
          country: string | null;
          avatar_url: string | null;
          role: string;
          additional_info: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          place: string | null;
          lat: number | null;
          lng: number | null;
          start_date: string | null;
          end_date: string | null;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trips']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['trips']['Insert']>;
      };
      itinerary_items: {
        Row: {
          id: string;
          trip_id: string;
          day_number: number | null;
          activity_name: string | null;
          category: string | null;
          budget: number;
          expense: number;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['itinerary_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['itinerary_items']['Insert']>;
      };
      expenses: {
        Row: {
          id: string;
          trip_id: string;
          category: string | null;
          description: string | null;
          qty: number;
          unit_cost: number;
          amount: number;
          paid: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>;
      };
      packing_items: {
        Row: { id: string; trip_id: string; category: string | null; label: string | null; checked: boolean };
        Insert: Omit<Database['public']['Tables']['packing_items']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['packing_items']['Insert']>;
      };
      community_posts: {
        Row: { id: string; user_id: string; trip_id: string | null; content: string | null; created_at: string };
        Insert: Omit<Database['public']['Tables']['community_posts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['community_posts']['Insert']>;
      };
      trip_notes: {
        Row: {
          id: string; trip_id: string; day_number: number | null; hotel_name: string | null;
          room_type: string | null; breakfast_included: boolean; date_from: string | null;
          date_to: string | null; content: string | null; created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trip_notes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['trip_notes']['Insert']>;
      };
    };
  };
};
