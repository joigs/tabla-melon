import React, { useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProjectListScreen from './src/screens/ProjectListScreen';
import InspectionScreen from './src/screens/InspectionScreen';
import CameraScreen from './src/screens/CameraScreen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NiceAlertHost, NiceAlertRegistrar } from './src/components/NiceAlert';
import { ensureAppRootDir } from './src/media';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

export type RootStackParamList = {
    Projects: undefined;
    Inspection: { projectNumber: number };
    Camera: { projectNumber: number; itemId: number; itemName: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={{
                flex: 1,
                paddingTop: insets.top,      // margen arriba
                paddingBottom: insets.bottom // margen abajo
            }}
        >
            <NavigationContainer>
                <Stack.Navigator>
                    <Stack.Screen
                        name="Projects"
                        component={ProjectListScreen}
                        options={{ title: 'Cámara Vertical' }}
                    />
                    <Stack.Screen
                        name="Inspection"
                        component={InspectionScreen}
                        options={{ title: 'Inspección' }}
                    />
                    <Stack.Screen
                        name="Camera"
                        component={CameraScreen}
                        options={{ title: 'Cámara' }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </View>
    );
}

export default function App() {
    useEffect(() => {
        ensureAppRootDir().catch(() => {});
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <NiceAlertHost>
                    <RootNavigator />
                    <NiceAlertRegistrar />
                </NiceAlertHost>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
