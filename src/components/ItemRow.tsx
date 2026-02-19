import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Item, Project } from '../types';
import { countPhotosForItem } from '../media';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PillButton from './PillButton';

type Props = { project: Project; item: Item };

export default function ItemRow({ project, item }: Props) {
    const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [count, setCount] = useState<number>(0);

    const refresh = async () => {
        try {
            const c = await countPhotosForItem(project, item);
            setCount(c);
        } catch {}
    };

    useEffect(() => {
        refresh();
    }, [project.number]);

    const ok = count > 0;

    return (
        <View style={styles.row}>
            <View style={styles.statusBox}>
                <Text style={[styles.status, ok ? styles.ok : styles.nok]}>
                    {ok ? '✓' : '✗'}
                </Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.meta}>Fotos guardadas: {count}</Text>
            </View>
            <PillButton
                title="Tomar foto"
                onPress={() =>
                    nav.navigate('Camera', {
                        projectNumber: project.number,
                        itemId: item.id,
                        itemName: item.name,
                    })
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#ddd' },
    title: { fontSize: 16, fontWeight: '600' },
    meta: { fontSize: 12, color: '#666', marginTop: 4 },
    statusBox: { width: 28, alignItems: 'center', marginRight: 10 },
    status: { fontSize: 18, fontWeight: '800' },
    ok: { color: 'green' },
    nok: { color: 'red' },
});
