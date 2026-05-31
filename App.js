import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { getUserProfile } from './src/services/storageService';

import SetupScreen from './src/screens/SetupScreen';
import HomeScreen from './src/screens/HomeScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProgressScreen from './src/screens/ProgressScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const profile = await getUserProfile();
    setInitialRoute(profile ? 'Home' : 'Setup');
  };

  if (!initialRoute) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Setup" component={SetupScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Workout" component={WorkoutScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Progress" component={ProgressScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}