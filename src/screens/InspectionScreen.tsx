import React, { useEffect, useMemo, useState, useRef } from 'react';
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

const TabContent = ({
                        manto,
                        inspeccionId,
                        inspeccionNombre,
                        map,
                        setMap,
                    }: {
    manto: 1 | 2 | 3 | 4;
    inspeccionId: number;
    inspeccionNombre: string;
    map: Record<string, string>;
    setMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) => {
    const { height } = useWindowDimensions();
    const scrollRef = useRef<ScrollView>(null);
    const refs = useRef<Array<TextInput | null>>([]);

    const blockY = useRef<number[]>([0, 0, 0]);
    const itemY = useRef<number[]>([]);

    const focusNext = (i: number) => {
        const next = refs.current[i + 1];
        if (next) {
            next.focus();
        } else {
            Keyboard.dismiss();
        }
    };

    const handleFocus = (medIndex: number, itemIndex: number) => {
        const absoluteY = (blockY.current[medIndex] || 0) + (itemY.current[itemIndex] || 0);
        const targetY = Math.max(0, absoluteY - height * 0.25);
        scrollRef.current?.scrollTo({ y: targetY, animated: true });
    };

    let idx = 0;

    const Row = (medicion: 1 | 2 | 3, punto: 1 | 2 | 3 | 4, currentIndex: number) => {
        const k = `${manto}-${medicion}-${punto}`;
        const medIndex = medicion - 1;

        return (
            <View onLayout={e => { itemY.current[currentIndex] = e.nativeEvent.layout.y; }}>
                <ItemRow
                    key={k}
                    inspeccionId={inspeccionId}
                    manto={manto}
                    medicion={medicion}
                    punto={punto}
                    value={map[k] ?? ''}
                    onValueChange={next => setMap(prev => ({ ...prev, [k]: next }))}
                    inputRef={ref => { refs.current[currentIndex] = ref; }}
                    onSubmitNext={() => focusNext(currentIndex)}
                    onFocus={() => handleFocus(medIndex, currentIndex)}
                    isLast={currentIndex === 11}
                />
            </View>
        );
    };

    return (
        <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 12, paddingBottom: height * 0.6 }}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={styles.header}>{inspeccionNombre}</Text>
            {[1, 2, 3].map(med => (
                <View
                    key={med}
                    style={styles.block}
                    onLayout={e => { blockY.current[med - 1] = e.nativeEvent.layout.y; }}
                >
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

    const routes = useMemo(
        () => [
            { key: 'm1', title: `Manto 1 ${completedByTabKey['m1'] ? '✓' : '✗'}` },
            { key: 'm2', title: `Manto 2 ${completedByTabKey['m2'] ? '✓' : '✗'}` },
            { key: 'm3', title: `Manto 3 ${completedByTabKey['m3'] ? '✓' : '✗'}` },
            { key: 'm4', title: `Manto 4 ${completedByTabKey['m4'] ? '✓' : '✗'}` },
        ],
        [completedByTabKey],
    );

    const [index, setIndex] = useState(0);

    const renderScene = ({ route: r }: any) => {
        const manto: 1 | 2 | 3 | 4 = r.key === 'm1' ? 1 : r.key === 'm2' ? 2 : r.key === 'm3' ? 3 : 4;

        return (
            <TabContent
                manto={manto}
                inspeccionId={route.params.inspeccionId}
                inspeccionNombre={inspeccionNombre}
                map={map}
                setMap={setMap}
            />
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
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
                        renderLabel={({ route: rr, focused }: any) => {
                            const complete = rr.title.includes('✓');
                            return (
                                <Text
                                    style={{
                                        color: complete ? 'green' : (focused ? 'black' : '#666'),
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