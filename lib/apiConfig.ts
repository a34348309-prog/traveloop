import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Dynamically get the host IP from Expo Constants so it works on physical devices and emulators
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost ? debuggerHost.split(':')[0] : (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

export const API_BASE_URL = `http://${localhost}:3000/api`;
