import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Modal,
    TextInput,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import PillButton from '../components/PillButton';
import { niceAlert, niceConfirm } from '../components/NiceAlert';
import {
    createInspeccion,
    deleteInspeccion,
    updateInspeccion,
    listInspeccionesConProgreso,
    TOTAL_PUNTOS,
} from '../db';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Row = { id: number; numero: number; nombre: string; completados: number };

export default function ProjectListScreen() {
    const nav = useNavigation<Nav>();
    const [rows, setRows] = useState<Row[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState<Row | null>(null);
    const [nombre, setNombre] = useState('');
    const [numero, setNumero] = useState<number>(1);

    const load = async () => {
        const list = await listInspeccionesConProgreso();
        setRows(list);
    };

    useFocusEffect(
        useCallback(() => {
            load();
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

        const exists = rows.some(
            r => r.numero === numero && (!editing || r.id !== editing.id),
        );
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
        load();
    };

    const remove = (r: Row) => {
        niceConfirm('Eliminar inspección', `¿Eliminar ${r.numero} - ${r.nombre}?`, {
            okText: 'Eliminar',
            cancelText: 'Cancelar',
            onOk: async () => {
                await deleteInspeccion(r.id);
                load();
            },
        });
    };

    const renderItem = ({ item }: { item: Row }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => nav.navigate('Inspection', { inspeccionId: item.id })}
        >
            <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                    {item.numero} - {item.nombre}
                </Text>
                <Text style={styles.meta}>
                    Progreso: {item.completados} / {TOTAL_PUNTOS}
                </Text>
            </View>

            <View style={{ gap: 6 }}>
                <PillButton
                    title="Abrir"
                    onPress={() => nav.navigate('Inspection', { inspeccionId: item.id })}
                />
                <PillButton title="Editar" variant="outline" onPress={() => openEdit(item)} />
                <PillButton title="Eliminar" variant="danger" onPress={() => remove(item)} />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <View style={{ flex: 1 }}>
                <FlatList
                    data={rows}
                    keyExtractor={r => String(r.id)}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <Text style={{ textAlign: 'center', marginTop: 24 }}>
                            Sin inspecciones
                        </Text>
                    }
                    contentContainerStyle={{ paddingBottom: 80 }}
                />

                <View style={styles.footer}>
                    <PillButton title="Nueva inspección" onPress={openNew} />
                </View>
            </View>

            <Modal
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={{ padding: 16, gap: 12 }}>
                    <Text style={[styles.formLabel, { marginTop: 16 }]}>
                        Número (único)
                    </Text>
                    <TextInput
                        value={String(numero)}
                        onChangeText={t => setNumero(Number(t.replace(/[^\d]/g, '')) || 0)}
                        keyboardType="number-pad"
                        style={styles.input}
                    />

                    <Text style={styles.formLabel}>Nombre</Text>
                    <TextInput value={nombre} onChangeText={setNombre} style={styles.input} />

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <PillButton
                            title="Cancelar"
                            variant="outline"
                            onPress={() => setModalVisible(false)}
                        />
                        <PillButton title="Guardar" onPress={save} />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
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
});