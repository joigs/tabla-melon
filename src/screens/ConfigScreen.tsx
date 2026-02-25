import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import PillButton from '../components/PillButton';
import { getConfig, setConfig } from '../db';

export default function ConfigScreen() {
    const nav = useNavigation();
    const [configOrder, setConfigOrder] = useState<string[]>(['mediciones', 'mantos', 'puntos']);

    useEffect(() => {
        getConfig('estructura_inspeccion', 'mediciones,mantos,puntos').then(savedOrder => {
            setConfigOrder(savedOrder.split(','));
        });
    }, []);

    const saveConfigOrder = async () => {
        await setConfig('estructura_inspeccion', configOrder.join(','));
        nav.goBack();
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newOrder = [...configOrder];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        setConfigOrder(newOrder);
    };

    const moveDown = (index: number) => {
        if (index === configOrder.length - 1) return;
        const newOrder = [...configOrder];
        [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
        setConfigOrder(newOrder);
    };

    const names: Record<string, string> = {
        mediciones: 'Mediciones',
        mantos: 'Mantos',
        puntos: 'Puntos'
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Estructura de Inspección</Text>
            <Text style={styles.sub}>
                Usa las flechas para cambiar el como se divide la inspección (Pestañas {'->'} Bloques {'->'} Filas).
            </Text>

            <View style={styles.list}>
                {configOrder.map((item, index) => (
                    <View key={item} style={styles.itemBox}>
                        <Text style={styles.itemText}>{names[item]}</Text>
                        <View style={styles.arrowGroup}>
                            {index > 0 ? (
                                <TouchableOpacity onPress={() => moveUp(index)} style={styles.btn}>
                                    <Text style={styles.icon}>⬆️</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.placeholder} />
                            )}

                            {index < configOrder.length - 1 ? (
                                <TouchableOpacity onPress={() => moveDown(index)} style={styles.btn}>
                                    <Text style={styles.icon}>⬇️</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.placeholder} />
                            )}
                        </View>
                    </View>
                ))}
            </View>

            <View style={styles.footer}>
                <PillButton title="Cancelar" variant="outline" onPress={() => nav.goBack()} />
                <PillButton title="Guardar orden" onPress={saveConfigOrder} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
        backgroundColor: '#fff'
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 10
    },
    sub: {
        fontSize: 14,
        color: '#666',
        marginBottom: 32
    },
    list: {
        flex: 1,
        gap: 16
    },
    itemBox: {
        height: 80,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20
    },
    itemText: {
        fontSize: 18,
        fontWeight: '600'
    },
    arrowGroup: {
        flexDirection: 'row',
        gap: 16
    },
    btn: {
        width: 54,
        height: 54,
        backgroundColor: '#e9ecef',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ced4da',
        justifyContent: 'center',
        alignItems: 'center'
    },
    placeholder: {
        width: 54,
        height: 54
    },
    icon: {
        fontSize: 24
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 'auto',
        marginBottom: 20
    }
});