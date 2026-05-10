import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/colors';

export function SkeletonBox({ width, height, borderRadius = 8, style }: { width: any; height: number; borderRadius?: number; style?: any }) {
  const shimmer = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return (
    <Animated.View style={[{ width, height, borderRadius, backgroundColor: Colors.border, opacity }, style]} />
  );
}

export function TripCardSkeleton() {
  return (
    <View style={styles.tripSkeleton}>
      <SkeletonBox width="100%" height={240} borderRadius={20} />
    </View>
  );
}

export function CityCardSkeleton() {
  return (
    <View style={styles.cityCard}>
      <SkeletonBox width="100%" height={120} borderRadius={16} />
      <View style={{ padding: 12 }}>
        <SkeletonBox width="60%" height={16} borderRadius={6} style={{ marginBottom: 8 }} />
        <SkeletonBox width="40%" height={12} borderRadius={6} />
      </View>
    </View>
  );
}

export function ListItemSkeleton() {
  return (
    <View style={styles.listItem}>
      <SkeletonBox width={56} height={56} borderRadius={14} style={{ marginRight: 14 }} />
      <View style={{ flex: 1 }}>
        <SkeletonBox width="70%" height={14} borderRadius={6} style={{ marginBottom: 10 }} />
        <SkeletonBox width="45%" height={11} borderRadius={6} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tripSkeleton: { marginBottom: 20 },
  cityCard: { width: 180, marginRight: 16, backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: Colors.surface, borderRadius: 16, marginBottom: 12 },
});
