import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../../App';
import { loadProjects, saveProjects } from '../storage';
import { Project, TabKey } from '../types';
import { itemsByTab } from '../items';
import ItemRow from '../components/ItemRow';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import PillButton from '../components/PillButton';

type R = RouteProp<RootStackParamList, 'Inspection'>;

export default function InspectionScreen() {
    const route = useRoute<R>();
    const [project, setProject] = useState<Project | null>(null);

    useFocusEffect(
        React.useCallback(() => {
            const load = async () => {
                const all = await loadProjects();
                const p = all.find(x => x.number === route.params.projectNumber) || null;
                setProject(p);
            };
            load();
        }, [route.params.projectNumber]),
    );

    const persist = async (p: Project) => {
        const all = await loadProjects();
        const idx = all.findIndex(x => x.number === p.number);
        if (idx >= 0) all[idx] = p;
        await saveProjects(all);
        setProject(p);
        return p;
    };

    const setMachineRoom = async (choice: 'yes' | 'no') => {
        if (!project) return;
        if (project.machineRoom === choice) return;
        const updated = { ...project, machineRoom: choice };
        await persist(updated);
    };

    const [index, setIndex] = useState(0);
    const routes = useMemo(() => {
        const tabs: { key: TabKey; title: string }[] = [
            { key: 'general_sellos', title: 'General/Sellos' },
            { key: 'cabina', title: 'Cabina' },
            { key: 'sobre_cabina', title: 'Sobre cabina' },
            { key: 'pozo', title: 'Pozo' },
        ];
        if (project?.machineRoom === 'yes') {
            tabs.splice(1, 0, { key: 'mr_yes', title: 'Sala de máquinas' });
        } else if (project?.machineRoom === 'no') {
            tabs.splice(1, 0, { key: 'mr_no', title: 'Sin sala máquinas' });
        } else {
            tabs.splice(
                1,
                0,
                { key: 'mr_yes', title: 'Sala de máquinas' },
                { key: 'mr_no', title: 'Sin sala máquinas' },
            );
        }
        return tabs;
    }, [project?.machineRoom]);

    if (!project) {
        return (
            <View style={{ flex: 1, padding: 16 }}>
                <Text>No encontrado</Text>
            </View>
        );
    }

    const machineRoomWidget = (() => {
        const isYes = project.machineRoom === 'yes';
        const isNo = project.machineRoom === 'no';

        return (
            <View style={styles.radioRow}>
                <Text style={{ fontWeight: '600' }}>¿Tiene sala de máquinas?</Text>
                <View style={styles.radioBtns}>
                    <PillButton
                        title="Sí"
                        onPress={() => setMachineRoom('yes')}
                        variant={isYes ? 'primary' : 'outline'}
                    />
                    <PillButton
                        title="No"
                        onPress={() => setMachineRoom('no')}
                        variant={isNo ? 'primary' : 'outline'}
                    />
                </View>
                <Text style={styles.hint}>

                </Text>
            </View>
        );
    })();

    const renderList = (tab: TabKey) => {
        const items = itemsByTab(tab);
        if (tab !== 'mr_no') {
            return (
                <View>
                    {items.map(it => (
                        <ItemRow key={it.id} item={it} project={project} />
                    ))}
                </View>
            );
        }
        const groups = [...new Set(items.map(i => i.group || ''))];
        return (
            <View>
                {groups.map(g => (
                    <View key={g}>
                        {!!g && <Text style={styles.groupTitle}>{g}</Text>}
                        {items
                            .filter(i => i.group === g)
                            .map(it => (
                                <ItemRow key={it.id} item={it} project={project} />
                            ))}
                    </View>
                ))}
            </View>
        );
    };

    const GeneralTab = () => (
        <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
            <View style={{ padding: 8 }}>
                <Text style={styles.sectionTitle}>General y Sellos</Text>
            </View>
            {renderList('general_sellos')}
            <View style={{ height: 16 }} />
            {machineRoomWidget}
        </ScrollView>
    );

    const TabFactory = (key: TabKey) => () => (
        <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
            {renderList(key)}
        </ScrollView>
    );

    const scenes = SceneMap({
        general_sellos: GeneralTab,
        mr_yes: TabFactory('mr_yes'),
        mr_no: TabFactory('mr_no'),
        cabina: TabFactory('cabina'),
        sobre_cabina: TabFactory('sobre_cabina'),
        pozo: TabFactory('pozo'),
    });

    return (
        <View style={{ flex: 1 }}>
            <TabView
                navigationState={{ index, routes }}
                renderScene={scenes}
                onIndexChange={setIndex}
                initialLayout={{ width: 360 }}
                renderTabBar={props => (
                    <TabBar
                        {...props}
                        scrollEnabled
                        indicatorStyle={{ backgroundColor: 'black' }}
                        style={{ backgroundColor: 'white' }}
                        inactiveColor="#666"
                        activeColor="black"
                    />
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    sectionTitle: { fontSize: 16, fontWeight: '700', paddingHorizontal: 12 },
    radioRow: { padding: 12, gap: 8, borderTopWidth: 1, borderColor: '#eee' },
    radioBtns: { flexDirection: 'row', gap: 8 },
    hint: { fontSize: 12, color: '#666' },
    groupTitle: { paddingHorizontal: 12, paddingTop: 12, fontWeight: '700' },
});
