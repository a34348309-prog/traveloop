import { Stack } from 'expo-router';

export default function TripsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'My Trips', headerShown: true }} />
      <Stack.Screen name="create" options={{ title: 'Plan New Trip', headerShown: true, presentation: 'modal' }} />
      <Stack.Screen name="[id]/builder" options={{ title: 'Itinerary Builder', headerShown: true }} />
      <Stack.Screen name="[id]/itinerary" options={{ title: 'Itinerary', headerShown: true }} />
      <Stack.Screen name="[id]/budget" options={{ title: 'Budget', headerShown: true }} />
      <Stack.Screen name="[id]/checklist" options={{ title: 'Checklist', headerShown: true }} />
      <Stack.Screen name="[id]/notes" options={{ title: 'Notes', headerShown: true }} />
      <Stack.Screen name="[id]/city-search" options={{ title: 'Search City', headerShown: true, presentation: 'modal' }} />
      <Stack.Screen name="[id]/stops/[stopId]/activities" options={{ title: 'Activities', headerShown: true }} />
    </Stack>
  );
}
