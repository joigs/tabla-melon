import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, Keyboard, TextInput } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../../App';
import { TabView, TabBar } from 'react-native-tab-view';
import ItemRow from '../components/ItemRow';
import { getInspeccion, listPuntosByInspeccion } from '../db';

type R = RouteProp<RootStackParamList, 'Inspection'>;
type PointKey = string;

function isFilled(v: string | undefined) {
    return (v ?? '').trim() !== '';
}

export default function InspectionScreen() {
    const route = useRoute<R>();
    const { width } = useWindowDimensions();

    const [inspeccionNombre, setInspeccionNombre] = useState<string>('');
    const [map, setMap] = useState<Record<PointKey, string>>({});

    useEffect(() => {
        const load = async () => {
            const insp = await getInspeccion(route.params.inspeccionId);
            setInspeccionNombre(insp ? `${insp.numero} - ${insp.nombre}` : 'No encontrado');

            const puntos = await listPuntosByInspeccion(route.params.inspeccionId);
            const next: Record<string, string> = {};
            for (const p of puntos) {
                next[`${p.manto}-${p.medicion}-${p.punto}`] = p.valor_texto ?? '';
            }
            setMap(next);
        };
        load().catch(() => {});
    }, [route.params.inspeccionId]);

    const routes = useMemo(
        () => [
            { key: 'm1', title: 'Manto 1' },
            { key: 'm2', title: 'Manto 2' },
            { key: 'm3', title: 'Manto 3' },
            { key: 'm4', title: 'Manto 4' },
        ],
        [],
    );
    const [index, setIndex] = useState(0);

    const completedByTabKey = useMemo(() => {
        const out: Record<string, boolean> = {};
        for (let m = 1; m <= 4; m++) {
            let filled = 0;
            for (let med = 1; med <= 3; med++) {
                for (let p = 1; p <= 4; p++) {
                    const k = `${m}-${med}-${p}`;
                    if (isFilled(map[k])) filled += 1;
                }
            }
            out[`m${m}`] = filled === 12;
        }
        return out;
    }, [map]);

    const renderScene = ({ route: r }: any) => {
        const manto: 1 | 2 | 3 | 4 =
            r.key === 'm1' ? 1 : r.key === 'm2' ? 2 : r.key === 'm3' ? 3 : 4;

        const refs: Array<TextInput | null> = [];
        const setRef = (i: number) => (ref: TextInput | null) => {
            refs[i] = ref;
        };
        const focusNext = (i: number) => {
            const next = refs[i + 1];
            if (next) next.focus();
            else Keyboard.dismiss();
        };

        const Row = (medicion: 1 | 2 | 3, punto: 1 | 2 | 3 | 4, idx: number) => {
            const k = `${manto}-${medicion}-${punto}`;
            return (
                <ItemRow
                    key={k}
                    inspeccionId={route.params.inspeccionId}
                    manto={manto}
                    medicion={medicion}
                    punto={punto}
                    value={map[k] ?? ''}
                    onValueChange={next => setMap(prev => ({ ...prev, [k]: next }))}
                    inputRef={setRef(idx)}
                    onSubmitNext={() => focusNext(idx)}
                    isLast={idx === 11}
                />
            );
        };

        let idx = 0;

        return (
            <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 24 }}>

                <Text style={styles.header}>{inspeccionNombre}</Text>

                {[1, 2, 3].map(med => (
                    <View key={med} style={styles.block}>
                        <Text style={styles.blockTitle}>Medición {med}</Text>
                        {Row(med as 1 | 2 | 3, 1, idx++)}
                        {Row(med as 1 | 2 | 3, 2, idx++)}
                        {Row(med as 1 | 2 | 3, 3, idx++)}
                        {Row(med as 1 | 2 | 3, 4, idx++)}
                    </View>
                ))}
            </ScrollView>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width }}
                renderTabBar={(props: any) => (
                    <TabBar
                        {...props}
                        scrollEnabled
                        indicatorStyle={{ backgroundColor: 'black' }}
                        style={{ backgroundColor: 'white' }}
                        inactiveColor="#666"
                        activeColor="black"
                        renderLabel={({ route: rr, focused, color }: any) => {
                            const complete = !!completedByTabKey[rr.key];
                            return (
                                <Text
                                    style={{
                                        color: complete ? 'green' : color,
                                        fontWeight: focused ? '700' : '600',
                                    }}
                                >
                                    {rr.title}
                                </Text>
                            );
                        }}
                    />
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    header: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
    block: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
    },
    blockTitle: { fontWeight: '800', marginBottom: 8 },
});