// src/navigation/Tabs.tsx
import React from 'react';
import { View, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SavedScreen from '../screens/SavedScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../theme';
import { RootStackParamList } from '../types';
import HomeScreen from '../screens/HomeScreen';
import ArticleScreen from '../screens/ArticleScreen';
import AskScreen from '../screens/AskScreen';
import { useQueueAutoFlush } from '../hooks/useQueueAutoFlush';
import { useConnectivity } from '../hooks/useConnectivity';
import { useSubmissionQueue } from '../hooks/useSubmissionQueue';
import { ToastProvider } from '../components/Toast'; // ← добавлено

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

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
  useQueueAutoFlush();

  const { isOffline } = useConnectivity();
  const isOnline = !isOffline;
  const { pending } = useSubmissionQueue(isOnline);
  const pendingCount = pending.length;

  return (
    <ToastProvider>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: c.text,
          tabBarInactiveTintColor: c.subtext,
          tabBarStyle: {
            backgroundColor: c.surface,
            borderTopColor: c.border,
          },
          tabBarLabelStyle: { fontSize: 12 },
          tabBarIcon: ({ color, size, focused }) => {
            let name: keyof typeof Ionicons.glyphMap = 'home-outline';
            if (route.name === 'HomeStack') name = focused ? 'home' : 'home-outline';
            if (route.name === 'Ask') name = focused ? 'help-circle' : 'help-circle-outline';
            if (route.name === 'Saved') name = focused ? 'bookmark' : 'bookmark-outline';
            if (route.name === 'Settings') name = focused ? 'settings' : 'settings-outline';

            const showBadge = route.name === 'Ask' && pendingCount > 0;
            const badgeTop = Platform.OS === 'ios' ? 2 : 1;
            const badgeRight = -3;

            return (
              <View
                style={{
                  width: size + 10,
                  height: size + 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={name} size={size} color={color} />
                {showBadge && (
                  <View
                    style={{
                      position: 'absolute',
                      right: badgeRight,
                      top: badgeTop,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      paddingHorizontal: 3,
                      backgroundColor: c.ctaBg,
                      borderWidth: 2,
                      borderColor: c.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: c.ctaText, fontSize: 10, fontWeight: '700' }}>
                      {pendingCount}
                    </Text>
                  </View>
                )}
              </View>
            );
          },
        })}
      >
        <Tab.Screen name="HomeStack" component={HomeStack} options={{ title: 'Home' }} />
        <Tab.Screen name="Saved" component={SavedScreen} />
        <Tab.Screen name="Ask" component={AskScreen} options={{ title: 'Ask' }} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </ToastProvider>
  );
}
