import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, Keyboard, TextInput } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../../App';
import { TabView, TabBar } from 'react-native-tab-view';
import ItemRow from '../components/ItemRow';
import { getInspeccion, listPuntosByInspeccion, getConfig } from '../db';

type R = RouteProp<RootStackParamList, 'Inspection'>;
type PointKey = string;
type EntityKey = 'mantos' | 'mediciones' | 'puntos';

function isFilled(v: string | undefined) {
    return (v ?? '').trim() !== '';
}

const TabContent = ({
                        tabEntityKey,
                        tabEntityVal,
                        blockEntityKey,
                        rowEntityKey,
                        entitiesDef,
                        inspeccionId,
                        inspeccionNombre,
                        map,
                        setMap,
                    }: {
    tabEntityKey: EntityKey;
    tabEntityVal: number;
    blockEntityKey: EntityKey;
    rowEntityKey: EntityKey;
    entitiesDef: any;
    inspeccionId: number;
    inspeccionNombre: string;
    map: Record<string, string>;
    setMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) => {
    const { height } = useWindowDimensions();
    const scrollRef = useRef<ScrollView>(null);
    const refs = useRef<Array<TextInput | null>>([]);

    const blockY = useRef<number[]>([]);
    const itemY = useRef<number[]>([]);

    const totalRows = entitiesDef[blockEntityKey].items.length * entitiesDef[rowEntityKey].items.length;

    const focusNext = (i: number) => {
        const next = refs.current[i + 1];
        if (next) {
            next.focus();
        } else {
            Keyboard.dismiss();
        }
    };

    const handleFocus = (blockIndex: number, itemIndex: number) => {
        const absoluteY = (blockY.current[blockIndex] || 0) + (itemY.current[itemIndex] || 0);
        const targetY = Math.max(0, absoluteY - height * 0.25);
        scrollRef.current?.scrollTo({ y: targetY, animated: true });
    };

    let globalRowIdx = 0;

    return (
        <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 12, paddingBottom: height * 0.6 }}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={styles.header}>{inspeccionNombre}</Text>
            {entitiesDef[blockEntityKey].items.map((bVal: number, bIdx: number) => (
                <View
                    key={bVal}
                    style={styles.block}
                    onLayout={e => { blockY.current[bIdx] = e.nativeEvent.layout.y; }}
                >
                    <Text style={styles.blockTitle}>{entitiesDef[blockEntityKey].name} {bVal}</Text>
                    {entitiesDef[rowEntityKey].items.map((rVal: number) => {
                        const m = tabEntityKey === 'mantos' ? tabEntityVal : (blockEntityKey === 'mantos' ? bVal : rVal);
                        const med = tabEntityKey === 'mediciones' ? tabEntityVal : (blockEntityKey === 'mediciones' ? bVal : rVal);
                        const p = tabEntityKey === 'puntos' ? tabEntityVal : (blockEntityKey === 'puntos' ? bVal : rVal);
                        const k = `${m}-${med}-${p}`;

                        const currentIdx = globalRowIdx++;

                        return (
                            <View key={k} onLayout={e => { itemY.current[currentIdx] = e.nativeEvent.layout.y; }}>
                                <ItemRow
                                    inspeccionId={inspeccionId}
                                    manto={m as any}
                                    medicion={med as any}
                                    punto={p as any}
                                    value={map[k] ?? ''}
                                    onValueChange={next => setMap(prev => ({ ...prev, [k]: next }))}
                                    inputRef={ref => { refs.current[currentIdx] = ref; }}
                                    onSubmitNext={() => focusNext(currentIdx)}
                                    onFocus={() => handleFocus(bIdx, currentIdx)}
                                    isLast={currentIdx === totalRows - 1}
                                    titleText={`${entitiesDef[rowEntityKey].name} ${rVal}`}
                                    metaText={`${entitiesDef[tabEntityKey].name} ${tabEntityVal} · ${entitiesDef[blockEntityKey].name} ${bVal}`}
                                />
                            </View>
                        );
                    })}
                </View>
            ))}
        </ScrollView>
    );
};

export default function InspectionScreen() {
    const route = useRoute<R>();
    const { width } = useWindowDimensions();

    const [inspeccionNombre, setInspeccionNombre] = useState<string>('');
    const [tieneManto4, setTieneManto4] = useState<boolean>(true);
    const [map, setMap] = useState<Record<PointKey, string>>({});
    const [order, setOrder] = useState<EntityKey[]>(['mediciones', 'mantos', 'puntos']);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const load = async () => {
            const insp = await getInspeccion(route.params.inspeccionId);
            setInspeccionNombre(insp ? `${insp.numero} - ${insp.nombre}` : 'No encontrado');
            setTieneManto4(insp ? insp.tiene_manto_4 === 1 : true);

            const savedOrder = await getConfig('estructura_inspeccion', 'mediciones,mantos,puntos');
            setOrder(savedOrder.split(',') as EntityKey[]);

            const puntos = await listPuntosByInspeccion(route.params.inspeccionId);
            const next: Record<string, string> = {};
            for (const p of puntos) {
                next[`${p.manto}-${p.medicion}-${p.punto}`] = p.valor_texto ?? '';
            }
            setMap(next);
            setReady(true);
        };
        load().catch(() => {});
    }, [route.params.inspeccionId]);

    const entitiesDef = useMemo(() => ({
        mantos: { items: tieneManto4 ? [1, 2, 3, 4] : [1, 2, 3], name: 'Manto' },
        mediciones: { items: [1, 2, 3], name: 'Medición' },
        puntos: { items: [1, 2, 3, 4], name: 'Punto' },
    }), [tieneManto4]);

    const tKey = order[0];
    const bKey = order[1];
    const rKey = order[2];

    const completedByTabKey = useMemo(() => {
        const out: Record<string, boolean> = {};
        for (const tVal of entitiesDef[tKey].items) {
            let complete = true;
            for (const bVal of entitiesDef[bKey].items) {
                for (const rVal of entitiesDef[rKey].items) {
                    const m = tKey === 'mantos' ? tVal : (bKey === 'mantos' ? bVal : rVal);
                    const med = tKey === 'mediciones' ? tVal : (bKey === 'mediciones' ? bVal : rVal);
                    const p = tKey === 'puntos' ? tVal : (bKey === 'puntos' ? bVal : rVal);

                    if (!isFilled(map[`${m}-${med}-${p}`])) {
                        complete = false;
                        break;
                    }
                }
                if (!complete) break;
            }
            out[`${tKey}-${tVal}`] = complete;
        }
        return out;
    }, [map, tieneManto4, order, entitiesDef, tKey, bKey, rKey]);

    const routes = useMemo(() => {
        return entitiesDef[tKey].items.map(val => ({
            key: `${tKey}-${val}`,
            val: val,
            title: `${entitiesDef[tKey].name} ${val} ${completedByTabKey[`${tKey}-${val}`] ? '✓' : '✗'}`
        }));
    }, [completedByTabKey, tKey, entitiesDef]);

    const [index, setIndex] = useState(0);

    const renderScene = ({ route: r }: any) => {
        return (
            <TabContent
                tabEntityKey={tKey}
                tabEntityVal={r.val}
                blockEntityKey={bKey}
                rowEntityKey={rKey}
                entitiesDef={entitiesDef}
                inspeccionId={route.params.inspeccionId}
                inspeccionNombre={inspeccionNombre}
                map={map}
                setMap={setMap}
            />
        );
    };

    if (!ready) return null;

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