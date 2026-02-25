import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NiceAlertHost, NiceAlertRegistrar } from './src/components/NiceAlert';
import InspectionListScreen from './src/screens/ProjectListScreen';
import InspectionScreen from './src/screens/InspectionScreen';
import ConfigScreen from './src/screens/ConfigScreen';
import { initDb } from './src/db';

export type RootStackParamList = {
    Inspections: undefined;
    Inspection: { inspeccionId: number };
    Config: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
    const insets = useSafeAreaInsets();

    return (
        <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
            <NavigationContainer>
                <Stack.Navigator>
                    <Stack.Screen
                        name="Inspections"
                        component={InspectionListScreen}
                        options={({ navigation }) => ({
                            title: 'Inspecciones Melón',
                            headerRight: () => (
                                <TouchableOpacity onPress={() => navigation.navigate('Config')} style={{ marginRight: 5 }}>
                                    <Text style={{ fontSize: 24 }}>⚙️</Text>
                                </TouchableOpacity>
                            ),
                        })}
                    />
                    <Stack.Screen
                        name="Inspection"
                        component={InspectionScreen}
                        options={{ title: 'Inspección' }}
                    />
                    <Stack.Screen
                        name="Config"
                        component={ConfigScreen}
                        options={{ title: 'Configuración' }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </View>
    );
}

export default function App() {
    useEffect(() => {
        initDb().catch(() => {});
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