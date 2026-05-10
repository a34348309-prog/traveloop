import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { getDB } from '../db/schema';

type TripState = {
  trips: any[];
  currentTrip: any | null;
  loading: boolean;
};

type Action = 
  | { type: 'SET_TRIPS'; payload: any[] }
  | { type: 'SET_CURRENT_TRIP'; payload: any }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: TripState = {
  trips: [],
  currentTrip: null,
  loading: true,
};

function tripReducer(state: TripState, action: Action): TripState {
  switch (action.type) {
    case 'SET_TRIPS':
      return { ...state, trips: action.payload, loading: false };
    case 'SET_CURRENT_TRIP':
      return { ...state, currentTrip: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

type TripContextType = {
  state: TripState;
  dispatch: React.Dispatch<Action>;
  loadTrips: (userId: number) => Promise<void>;
};

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(tripReducer, initialState);

  const loadTrips = async (userId: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const db = getDB();
      const userTrips = await db.getAllAsync('SELECT * FROM trips WHERE user_id = ? ORDER BY start_date DESC', [userId]);
      dispatch({ type: 'SET_TRIPS', payload: userTrips });
    } catch (error) {
      console.error('Error loading trips:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <TripContext.Provider value={{ state, dispatch, loadTrips }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => {
  const context = useContext(TripContext);
  if (!context) throw new Error('useTrip must be used within a TripProvider');
  return context;
};
