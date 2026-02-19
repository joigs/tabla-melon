import React, { useEffect, useState, useCallback } from 'react';
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
import { Project } from '../types';
import {
    deleteProject,
    loadProjects,
    nextDefaultNumber,
    saveProjects,
    upsertProject,
} from '../storage';
import { expectedItemsFor, PROJECT_ALBUM_NAME } from '../items';
import { countProgress } from '../media';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import PillButton from '../components/PillButton';
import { niceAlert, niceConfirm } from '../components/NiceAlert';

export default function ProjectListScreen() {
    const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [projects, setProjects] = useState<Project[]>([]);
    const [progressMap, setProgressMap] = useState<
        Record<number, { taken: number; total: number } | null>
    >({});
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState<Project | null>(null);
    const [name, setName] = useState('');
    const [number, setNumber] = useState<number>(1);

    const load = async () => {
        const list = await loadProjects();
        // Ordenar de mayor a menor número
        const sorted = [...list].sort((a, b) => b.number - a.number);
        setProjects(sorted);
    };

    useFocusEffect(
        useCallback(() => {
            load();
        }, []),
    );

    useEffect(() => {
        const run = async () => {
            const map: Record<number, any> = {};
            for (const p of projects) {
                const exp = expectedItemsFor(p);
                if (exp.length === 0) {
                    map[p.number] = null;
                    continue;
                }
                try {
                    const pr = await countProgress(p, exp);
                    map[p.number] = pr;
                } catch {
                    map[p.number] = null;
                }
            }
            setProgressMap(map);
        };
        if (projects.length) run();
    }, [projects]);

    const openNew = () => {
        setEditing(null);
        setName('');
        setNumber(nextDefaultNumber(projects));
        setModalVisible(true);
    };

    const openEdit = (p: Project) => {
        setEditing(p);
        setName(p.name);
        setNumber(p.number);
        setModalVisible(true);
    };

    const save = async () => {
        if (!name.trim()) {
            niceAlert('Nombre requerido', '');
            return;
        }
        const exists = projects.some(
            p => p.number === number && (!editing || p.number !== editing.number),
        );
        if (exists) {
            niceAlert('El número ya existe', '');
            return;
        }
        const toSave: Project = {
            number,
            name: name.trim(),
            machineRoom: editing?.machineRoom ?? null,
        };
        if (editing && editing.number !== number) {
            const rest = projects.filter(p => p.number !== editing.number);
            // En almacenamiento sigue ascendente, la UI lo invierte en load()
            await saveProjects(rest.concat([toSave]).sort((a, b) => a.number - b.number));
        } else {
            await upsertProject(toSave);
        }
        setModalVisible(false);
        load();
    };

    const remove = (p: Project) => {
        niceConfirm(
            'Eliminar proyecto',
            `¿Eliminar ${PROJECT_ALBUM_NAME(p)}? No se borran fotos.`,
            {
                okText: 'Eliminar',
                cancelText: 'Cancelar',
                onOk: async () => {
                    await deleteProject(p.number);
                    load();
                },
            },
        );
    };

    const renderItem = ({ item }: { item: Project }) => {
        const pr = progressMap[item.number];
        const label = pr ? `${pr.taken} / ${pr.total}` : '—';
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => nav.navigate('Inspection', { projectNumber: item.number })}
            >
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>
                        {item.number} - {item.name}
                    </Text>
                    <Text style={styles.meta}>Progreso: {label}</Text>
                </View>
                <View style={{ gap: 6 }}>
                    <PillButton
                        title="Inspeccionar"
                        onPress={() =>
                            nav.navigate('Inspection', { projectNumber: item.number })
                        }
                    />
                    <PillButton
                        title="Editar"
                        variant="outline"
                        onPress={() => openEdit(item)}
                    />
                    <PillButton
                        title="Eliminar"
                        variant="danger"
                        onPress={() => remove(item)}
                    />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <View style={{ flex: 1 }}>
                <FlatList
                    data={projects}
                    keyExtractor={p => String(p.number)}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <Text style={{ textAlign: 'center', marginTop: 24 }}>Sin proyectos</Text>
                    }
                    contentContainerStyle={{ paddingBottom: 80 }}
                />

                <View style={styles.footer}>
                    <PillButton title="Nuevo proyecto" onPress={openNew} />
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
                        value={String(number)}
                        onChangeText={t => setNumber(Number(t.replace(/[^\d]/g, '')) || 0)}
                        keyboardType="number-pad"
                        style={styles.input}
                    />
                    <Text style={styles.formLabel}>Nombre</Text>
                    <TextInput value={name} onChangeText={setName} style={styles.input} />
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
