import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import Tabs from './src/navigation/Tabs';
import { StatusBar } from 'expo-status-bar';
import { useStore } from './src/store/useStore';

export default function App() {
  const theme = useStore((s) => s.theme);
  const navTheme = theme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Tabs />
    </NavigationContainer>
  );
}
