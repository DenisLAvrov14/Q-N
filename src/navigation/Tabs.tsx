import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ArticleScreen from '../screens/ArticleScreen';
import SavedScreen from '../screens/SavedScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Article" component={ArticleScreen} options={{ title: 'Article' }} />
    </Stack.Navigator>
  );
}

export default function Tabs() {
  const c = useThemeColors();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: c.text,        // светлый в тёмной теме
        tabBarInactiveTintColor: c.subtext,   // чуть тусклее
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
        },
        tabBarLabelStyle: { fontSize: 12 },
        tabBarIcon: ({ color, size, focused }) => {
          let name: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'HomeStack') name = focused ? 'home' : 'home-outline';
          if (route.name === 'Saved')     name = focused ? 'bookmark' : 'bookmark-outline';
          if (route.name === 'Settings')  name = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeStack" component={HomeStack} options={{ title: 'Home' }} />
      <Tab.Screen name="Saved" component={SavedScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
