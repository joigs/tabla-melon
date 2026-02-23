import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Modal,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Platform,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import * as IntentLauncher from 'expo-intent-launcher';
import PillButton from '../components/PillButton';
import { niceAlert, niceConfirm } from '../components/NiceAlert';
import {
    createInspeccion,
    deleteInspeccion,
    updateInspeccion,
    listInspeccionesConProgreso,
    TOTAL_PUNTOS,
    getPointsMapByInspeccion,
    setExportMeta,
    type PointsMap,
} from '../db';

import { writeInspeccionExcel } from '../exportExcel';
import ViewShot from 'react-native-view-shot';
import MeasurementTableShot from '../components/MeasurementTableShot';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Row = {
    id: number;
    numero: number;
    nombre: string;
    completados: number;
    export_count?: number;
    last_image_uri?: string | null;
};

const APP_ALBUM_NAME = 'Tabla Melón';

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function slugify(s: string) {
    return s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
}

function normalizeSearch(s: string) {
    return s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

async function ensureDir(path: string) {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) await FileSystem.makeDirectoryAsync(path, { intermediates: true });
}

async function addToAlbum(asset: MediaLibrary.Asset) {
    const album = await MediaLibrary.getAlbumAsync(APP_ALBUM_NAME);
    if (!album) {
        await MediaLibrary.createAlbumAsync(APP_ALBUM_NAME, asset, false);
    } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    }
}

async function openImageExternally(uri: string) {
    try {
        if (Platform.OS === 'ios') {
            await Linking.openURL('photos-redirect://');
            return;
        }

        let contentUri = uri;

        if (uri.startsWith('file://')) {
            contentUri = await FileSystem.getContentUriAsync(uri);
        }

        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1,
            type: 'image/*',
        });

    } catch (e: any) {
        console.log('Error abriendo imagen:', e);
        const errorMsg = e instanceof Error ? e.message : JSON.stringify(e);
        niceAlert('Error al abrir', `Detalle:\n${errorMsg}`);
    }
}

function CaptureModal({
                          visible,
                          points,
                          onDone,
                      }: {
    visible: boolean;
    points: PointsMap | null;
    onDone: (uri: string | null) => void;
}) {
    const ref = useRef<ViewShot | null>(null);

    useEffect(() => {
        if (!visible || !points) return;

        const run = async () => {
            await sleep(80);
            try {
                const uri = await ref.current?.capture?.();
                onDone(uri ?? null);
            } catch {
                onDone(null);
            }
        };

        run().catch(() => onDone(null));
    }, [visible, points, onDone]);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={() => onDone(null)}>
            <View style={styles.captureBackdrop}>
                <ViewShot
                    ref={ref}
                    style={styles.captureBox}
                    options={{ format: 'png', quality: 1 }}
                >
                    {points ? <MeasurementTableShot points={points} /> : null}
                </ViewShot>
            </View>
        </Modal>
    );
}

export default function ProjectListScreen() {
    const nav = useNavigation<Nav>();
    const [rows, setRows] = useState<Row[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState<Row | null>(null);
    const [nombre, setNombre] = useState('');
    const [numero, setNumero] = useState<number>(1);

    const [exporting, setExporting] = useState<Record<number, boolean>>({});

    const [query, setQuery] = useState('');
    const qNorm = useMemo(() => normalizeSearch(query), [query]);

    const filteredRows = useMemo(() => {
        if (!qNorm) return rows;
        return rows.filter(r => {
            const hay = normalizeSearch(`${r.numero} ${r.nombre}`);
            return hay.includes(qNorm);
        });
    }, [rows, qNorm]);

    const [capVisible, setCapVisible] = useState(false);
    const [capPoints, setCapPoints] = useState<PointsMap | null>(null);
    const capResolverRef = useRef<((uri: string | null) => void) | null>(null);

    const captureTable = (points: PointsMap) =>
        new Promise<string | null>(resolve => {
            capResolverRef.current = resolve;
            setCapPoints(points);
            setCapVisible(true);
        });

    const onCaptured = (uri: string | null) => {
        setCapVisible(false);
        const r = capResolverRef.current;
        capResolverRef.current = null;
        setCapPoints(null);
        r?.(uri);
    };

    const load = async () => {
        const list = await listInspeccionesConProgreso();
        setRows(list as Row[]);
    };

    useFocusEffect(
        useCallback(() => {
            load().catch(() => {});
        }, []),
    );

    useEffect(() => {
        load().catch(() => {});
    }, []);

    const openNew = () => {
        setEditing(null);
        setNombre('');
        setNumero(rows.length ? Math.max(...rows.map(r => r.numero)) + 1 : 1);
        setModalVisible(true);
    };

    const openEdit = (r: Row) => {
        setEditing(r);
        setNombre(r.nombre);
        setNumero(r.numero);
        setModalVisible(true);
    };

    const save = async () => {
        const nombreTrim = nombre.trim();

        if (!nombreTrim) {
            niceAlert('Nombre requerido', '');
            return;
        }
        if (!numero || Number.isNaN(numero)) {
            niceAlert('Número inválido', '');
            return;
        }

        const exists = rows.some(r => r.numero === numero && (!editing || r.id !== editing.id));
        if (exists) {
            niceAlert('El número ya existe', '');
            return;
        }

        if (editing) {
            await updateInspeccion(editing.id, numero, nombreTrim);
        } else {
            await createInspeccion(numero, nombreTrim);
        }

        setModalVisible(false);
        load().catch(() => {});
    };

    const remove = (r: Row) => {
        niceConfirm('Eliminar inspección', `¿Eliminar ${r.numero} - ${r.nombre}?`, {
            okText: 'Eliminar',
            cancelText: 'Cancelar',
            onOk: async () => {
                await deleteInspeccion(r.id);
                load().catch(() => {});
            },
        });
    };

    const handleExport = async (item: Row) => {
        if (exporting[item.id]) return;
        if (item.completados < TOTAL_PUNTOS) return;

        const started = Date.now();
        setExporting(prev => ({ ...prev, [item.id]: true }));

        try {
            const perm = await MediaLibrary.requestPermissionsAsync();
            if (!perm.granted) {
                niceAlert('Permiso requerido', 'Se necesita permiso para guardar imágenes en la galería.');
                return;
            }

            const points = await getPointsMapByInspeccion(item.id);

            await writeInspeccionExcel({
                numero: item.numero,
                nombre: item.nombre,
                points,
            });

            const shotTmp = await captureTable(points);
            if (!shotTmp) {
                niceAlert('Error', 'No se pudo generar la imagen.');
                return;
            }

            const docDir = FileSystem.documentDirectory || '';
            const baseDir = `${docDir}betonera`;
            const imgDir = `${baseDir}/images`;
            await ensureDir(baseDir);
            await ensureDir(imgDir);

            const nextCount = (item.export_count ?? 0) + 1;
            const imgName = `${item.numero}-${slugify(item.nombre)}-${nextCount}.png`;
            const finalUri = `${imgDir}/${imgName}`;

            await FileSystem.copyAsync({ from: shotTmp, to: finalUri }).catch(async () => {
                await FileSystem.moveAsync({ from: shotTmp, to: finalUri });
            });

            const asset = await MediaLibrary.createAssetAsync(finalUri);
            await addToAlbum(asset);

            await setExportMeta({
                inspeccionId: item.id,
                nextExportCount: nextCount,
                lastImageUri: finalUri,
            });

            await load();
        } catch {
            niceAlert('Error', 'No se pudo generar la imagen.');
        } finally {
            const elapsed = Date.now() - started;
            if (elapsed < 2000) await sleep(2000 - elapsed);
            setExporting(prev => ({ ...prev, [item.id]: false }));
        }
    };

    const renderItem = ({ item }: { item: Row }) => {
        const busy = !!exporting[item.id];
        const canExport = item.completados >= TOTAL_PUNTOS;

        return (
            <View style={styles.card}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.title}>
                        {item.numero} - {item.nombre}
                    </Text>
                    <Text style={styles.meta}>
                        Progreso: {item.completados} / {TOTAL_PUNTOS}
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
                        <View style={{ flex: 1 }}>
                            <PillButton
                                title={busy ? 'Generando…' : 'Generar imagen'}
                                onPress={() => handleExport(item)}
                                disabled={!canExport || busy}
                            />
                        </View>
                        {item.last_image_uri ? (
                            <View style={{ flex: 1 }}>
                                <PillButton
                                    title="Abrir última imagen"
                                    variant="outline"
                                    onPress={() => openImageExternally(item.last_image_uri as string)}
                                    disabled={busy}
                                />
                            </View>
                        ) : null}
                    </View>
                </View>

                <View style={{ width: 100, gap: 6 }}>
                    <PillButton
                        title="Abrir"
                        onPress={() => nav.navigate('Inspection', { inspeccionId: item.id })}
                        disabled={busy}
                    />
                    <PillButton title="Editar" variant="outline" onPress={() => openEdit(item)} disabled={busy} />
                    <PillButton title="Eliminar" variant="danger" onPress={() => remove(item)} disabled={busy} />
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <View style={{ flex: 1 }}>
                <View style={styles.searchWrap}>
                    <Text style={styles.searchIcon}>🔎</Text>
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Buscar..."
                        placeholderTextColor="#667085"
                        autoCorrect={false}
                        autoCapitalize="none"
                        returnKeyType="search"
                        clearButtonMode="while-editing"
                        style={styles.searchInput}
                    />
                    {!!query.trim() && (
                        <TouchableOpacity
                            onPress={() => setQuery('')}
                            style={styles.clearBtn}
                            accessibilityRole="button"
                        >
                            <Text style={styles.clearText}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {!!qNorm && (
                    <Text style={styles.searchMeta}>
                        Mostrando {filteredRows.length} de {rows.length}
                    </Text>
                )}

                <FlatList
                    data={filteredRows}
                    keyExtractor={r => String(r.id)}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <Text style={{ textAlign: 'center', marginTop: 24 }}>
                            {qNorm ? 'Sin resultados' : 'Sin inspecciones'}
                        </Text>
                    }
                    contentContainerStyle={{ paddingBottom: 80 }}
                    keyboardShouldPersistTaps="handled"
                />

                <View style={styles.footer}>
                    <PillButton title="Nueva inspección" onPress={openNew} />
                </View>
            </View>

            <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={{ padding: 16, gap: 12 }}>
                    <Text style={[styles.formLabel, { marginTop: 16 }]}>Número (único)</Text>
                    <TextInput
                        value={String(numero)}
                        onChangeText={t => setNumero(Number(t.replace(/[^\d]/g, '')) || 0)}
                        keyboardType="number-pad"
                        style={styles.input}
                    />
                    <Text style={styles.formLabel}>Nombre</Text>
                    <TextInput value={nombre} onChangeText={setNombre} style={styles.input} />
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <PillButton title="Cancelar" variant="outline" onPress={() => setModalVisible(false)} />
                        <PillButton title="Guardar" onPress={save} />
                    </View>
                </View>
            </Modal>

            <CaptureModal visible={capVisible} points={capPoints} onDone={onCaptured} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    searchWrap: {
        marginHorizontal: 12,
        marginTop: 12,
        marginBottom: 6,
        backgroundColor: '#F2F4F7',
        borderWidth: 1,
        borderColor: '#E4E7EC',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    searchIcon: { marginRight: 8, fontSize: 14 },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#111',
        paddingVertical: 0,
    },
    clearBtn: {
        marginLeft: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E4E7EC',
    },
    clearText: { fontSize: 14, fontWeight: '800', color: '#344054' },
    searchMeta: {
        marginHorizontal: 12,
        marginBottom: 6,
        color: '#667085',
        fontSize: 12,
    },

    card: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    title: { fontSize: 16, fontWeight: '600' },
    meta: { fontSize: 12, color: '#666', marginTop: 4 },
    formLabel: { fontWeight: '600' },
    input: { borderWidth: 1, borderColor: '#aaa', borderRadius: 6, padding: 10 },
    footer: {
        padding: 12,
        borderTopWidth: 1,
        borderColor: '#ddd',
        backgroundColor: 'white',
    },
    captureBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    captureBox: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 8,
    },
});