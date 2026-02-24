import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import PillButton from '../components/PillButton';
import { getConfig, setConfig } from '../db';

function DraggableConfigList({ order, onOrderChange }: { order: string[], onOrderChange: (newOrder: string[]) => void }) {
    const [items, setItems] = useState(order);
    const itemHeight = 60;
    const positions = useRef(items.map((_, i) => new Animated.Value(i * itemHeight))).current;

    useEffect(() => {
        setItems(order);
    }, [order]);

    const panResponders = useRef(
        items.map((_, index) =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onPanResponderMove: (_, gestureState) => {
                    const newY = index * itemHeight + gestureState.dy;
                    positions[index].setValue(newY);

                    const currentPos = Math.round(newY / itemHeight);
                    if (currentPos !== index && currentPos >= 0 && currentPos < items.length) {
                        const newItems = [...items];
                        const temp = newItems[index];
                        newItems[index] = newItems[currentPos];
                        newItems[currentPos] = temp;

                        Animated.spring(positions[currentPos], {
                            toValue: index * itemHeight,
                            useNativeDriver: false,
                        }).start();

                        setItems(newItems);
                        onOrderChange(newItems);

                        const tempResponder = panResponders[index];
                        panResponders[index] = panResponders[currentPos];
                        panResponders[currentPos] = tempResponder;

                        const tempPos = positions[index];
                        positions[index] = positions[currentPos];
                        positions[currentPos] = tempPos;
                    }
                },
                onPanResponderRelease: () => {
                    Animated.spring(positions[index], {
                        toValue: index * itemHeight,
                        useNativeDriver: false,
                    }).start();
                }
            })
        )
    ).current;

    const names: Record<string, string> = {
        mediciones: 'Mediciones',
        mantos: 'Mantos',
        puntos: 'Puntos'
    };

    return (
        <View style={{ height: items.length * itemHeight, position: 'relative', marginTop: 10 }}>
            {items.map((item, index) => (
                <Animated.View
                    key={item}
                    {...panResponders[index].panHandlers}
                    style={[
                        styles.dragItem,
                        { top: positions[index] }
                    ]}
                >
                    <Text style={styles.dragText}>{names[item]}</Text>
                    <Text style={styles.dragIcon}>↕️</Text>
                </Animated.View>
            ))}
        </View>
    );
}

export default function ConfigScreen() {
    const nav = useNavigation();
    const [configOrder, setConfigOrder] = useState<string[]>(['mediciones', 'mantos', 'puntos']);

    useEffect(() => {
        const load = async () => {
            const savedOrder = await getConfig('estructura_inspeccion', 'mediciones,mantos,puntos');
            setConfigOrder(savedOrder.split(','));
        };
        load().catch(() => {});
    }, []);

    const saveConfigOrder = async () => {
        await setConfig('estructura_inspeccion', configOrder.join(','));
        nav.goBack();
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }} edges={['top', 'bottom']}>
            <View style={{ padding: 20, flex: 1 }}>
                <Text style={styles.configTitle}>Estructura de Inspección</Text>
                <Text style={styles.configSub}>Personaliza como se divide la inspección.</Text>

                <DraggableConfigList order={configOrder} onOrderChange={setConfigOrder} />

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 'auto', marginBottom: 20 }}>
                    <PillButton title="Cancelar" variant="outline" onPress={() => nav.goBack()} />
                    <PillButton title="Guardar orden" onPress={saveConfigOrder} />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    configTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 10,
    },
    configSub: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    dragItem: {
        position: 'absolute',
        width: '100%',
        height: 50,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        zIndex: 1,
    },
    dragText: {
        fontSize: 16,
        fontWeight: '600',
        textTransform: 'capitalize'
    },
    dragIcon: {
        fontSize: 20,
        color: '#999'
    }
});