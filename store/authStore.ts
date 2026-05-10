import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { API_BASE_URL } from '../lib/apiConfig';

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
  role: string;
  additional_info: string | null;
}

interface AuthState {
  session: { token: string; user: Profile } | null;
  user: any | null; // For compatibility
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  setProfile: (profile: Profile) => void;
}

interface SignUpData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  city?: string;
  country?: string;
  additional_info?: string;
}


export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('traveloop_token');
      const profileStr = await AsyncStorage.getItem('traveloop_profile');
      
      if (token && profileStr) {
        const profile = JSON.parse(profileStr);
        set({ 
          session: { token, user: profile }, 
          user: profile, 
          profile, 
          isLoading: false 
        });
      } else {
        set({ session: null, user: null, profile: null, isLoading: false });
      }
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // MOCK LOGIN to bypass DB constraints
      const mockUser = {
        id: 'mock-user-123',
        name: 'Traveler',
        email,
        phone: null,
        city: null,
        country: 'India',
        avatar_url: null,
        role: 'user',
        additional_info: null
      };
      
      await AsyncStorage.setItem('traveloop_token', 'mock-token-xyz');
      await AsyncStorage.setItem('traveloop_profile', JSON.stringify(mockUser));
      
      set({ 
        session: { token: 'mock-token-xyz', user: mockUser },
        user: mockUser,
        profile: mockUser,
        isLoading: false 
      });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  signUp: async (data) => {
    set({ isLoading: true, error: null });
    try {
      // MOCK REGISTER to bypass DB constraints
      const mockUser = {
        id: 'mock-user-123',
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        city: data.city || null,
        country: data.country || 'India',
        avatar_url: null,
        role: 'user',
        additional_info: data.additional_info || null
      };
      
      await AsyncStorage.setItem('traveloop_token', 'mock-token-xyz');
      await AsyncStorage.setItem('traveloop_profile', JSON.stringify(mockUser));
      
      set({ 
        session: { token: 'mock-token-xyz', user: mockUser },
        user: mockUser,
        profile: mockUser,
        isLoading: false 
      });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  signOut: async () => {
    await AsyncStorage.removeItem('traveloop_token');
    await AsyncStorage.removeItem('traveloop_profile');
    set({ session: null, user: null, profile: null });
    router.replace('/(auth)/login');
  },

  updateProfile: async (updates) => {
    const { profile } = get();
    if (!profile) return;
    set({ isLoading: true, error: null });
    // In a real app we would hit the backend PUT /api/users/:id here
    const updatedProfile = { ...profile, ...updates };
    await AsyncStorage.setItem('traveloop_profile', JSON.stringify(updatedProfile));
    set({ profile: updatedProfile, user: updatedProfile, isLoading: false });
  },

  setProfile: (profile) => set({ profile }),
}));
