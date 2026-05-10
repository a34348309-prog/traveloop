import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// ─── Trips ───────────────────────────────────────────────────────────────────
export function useTrips() {
  const profile = useAuthStore(s => s.profile);
  return useQuery({
    queryKey: ['trips', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', profile!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useTrip(id: string) {
  return useQuery({
    queryKey: ['trip', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('trips').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateTrip() {
  const qc = useQueryClient();
  const profile = useAuthStore(s => s.profile);
  return useMutation({
    mutationFn: async (trip: { name: string; place: string; lat?: number; lng?: number; start_date?: string; end_date?: string; status?: string }) => {
      const { data, error } = await supabase
        .from('trips')
        .insert({ ...trip, user_id: profile!.id, status: trip.status ?? 'upcoming' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips'] }),
  });
}

export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('trips').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips'] }),
  });
}

// ─── Itinerary Items ─────────────────────────────────────────────────────────
export function useItineraryItems(tripId: string) {
  return useQuery({
    queryKey: ['itinerary', tripId],
    enabled: !!tripId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('itinerary_items')
        .select('*')
        .eq('trip_id', tripId)
        .order('day_number', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddItineraryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: {
      trip_id: string; day_number: number; activity_name: string;
      category?: string; budget?: number; expense?: number; notes?: string;
    }) => {
      const { data, error } = await supabase.from('itinerary_items').insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['itinerary', v.trip_id] }),
  });
}

export function useUpdateItineraryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tripId, ...updates }: { id: string; tripId: string; [k: string]: any }) => {
      const { error } = await supabase.from('itinerary_items').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['itinerary', v.tripId] }),
  });
}

export function useDeleteItineraryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tripId }: { id: string; tripId: string }) => {
      const { error } = await supabase.from('itinerary_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['itinerary', v.tripId] }),
  });
}

// ─── Expenses ─────────────────────────────────────────────────────────────────
export function useExpenses(tripId: string) {
  return useQuery({
    queryKey: ['expenses', tripId],
    enabled: !!tripId,
    queryFn: async () => {
      const { data, error } = await supabase.from('expenses').select('*').eq('trip_id', tripId).order('created_at');
      if (error) throw error;
      return data;
    },
  });
}

export function useAddExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (expense: { trip_id: string; category: string; description: string; qty: number; unit_cost: number; amount: number }) => {
      const { data, error } = await supabase.from('expenses').insert(expense).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['expenses', v.trip_id] }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tripId }: { id: string; tripId: string }) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['expenses', v.tripId] }),
  });
}

// ─── Packing Items ───────────────────────────────────────────────────────────
export function usePackingItems(tripId: string) {
  return useQuery({
    queryKey: ['packing', tripId],
    enabled: !!tripId,
    queryFn: async () => {
      const { data, error } = await supabase.from('packing_items').select('*').eq('trip_id', tripId).order('category');
      if (error) throw error;
      return data;
    },
  });
}

export function useTogglePackingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, checked, tripId }: { id: string; checked: boolean; tripId: string }) => {
      const { error } = await supabase.from('packing_items').update({ checked }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['packing', v.tripId] }),
  });
}

export function useAddPackingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: { trip_id: string; category: string; label: string }) => {
      const { data, error } = await supabase.from('packing_items').insert({ ...item, checked: false }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['packing', v.trip_id] }),
  });
}

export function useDeletePackingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tripId }: { id: string; tripId: string }) => {
      const { error } = await supabase.from('packing_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['packing', v.tripId] }),
  });
}

// ─── Community Posts ──────────────────────────────────────────────────────────
export function useCommunityPosts() {
  return useQuery({
    queryKey: ['community'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*, users(name, avatar_url), trips(name, place)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddCommunityPost() {
  const qc = useQueryClient();
  const profile = useAuthStore(s => s.profile);
  return useMutation({
    mutationFn: async ({ content, trip_id }: { content: string; trip_id?: string }) => {
      const { data, error } = await supabase
        .from('community_posts')
        .insert({ content, trip_id: trip_id || null, user_id: profile!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community'] }),
  });
}

// ─── Trip Notes ───────────────────────────────────────────────────────────────
export function useTripNotes(tripId: string) {
  return useQuery({
    queryKey: ['notes', tripId],
    enabled: !!tripId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_notes')
        .select('*')
        .eq('trip_id', tripId)
        .order('day_number', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddTripNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (note: {
      trip_id: string; day_number: number; hotel_name: string;
      room_type: string; breakfast_included: boolean;
      date_from: string; date_to: string; content: string;
    }) => {
      const { data, error } = await supabase.from('trip_notes').insert(note).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['notes', v.trip_id] }),
  });
}

export function useDeleteTripNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tripId }: { id: string; tripId: string }) => {
      const { error } = await supabase.from('trip_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['notes', v.tripId] }),
  });
}

// ─── Admin Analytics ─────────────────────────────────────────────────────────
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersRes, tripsRes, postsRes] = await Promise.all([
        supabase.from('users').select('id, name, email, role, created_at'),
        supabase.from('trips').select('id, name, place, status, start_date, created_at, user_id'),
        supabase.from('community_posts').select('id, created_at'),
      ]);
      return {
        users: usersRes.data ?? [],
        trips: tripsRes.data ?? [],
        posts: postsRes.data ?? [],
      };
    },
  });
}
