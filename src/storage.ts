import AsyncStorage from '@react-native-async-storage/async-storage';
import { Project } from './types';

const KEY = 'projects:v1';

export async function loadProjects(): Promise<Project[]> {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    try { return JSON.parse(raw) as Project[]; } catch { return []; }
}

export async function saveProjects(projects: Project[]) {
    await AsyncStorage.setItem(KEY, JSON.stringify(projects));
}

export async function upsertProject(p: Project) {
    const all = await loadProjects();
    const idx = all.findIndex(x => x.number === p.number);
    if (idx >= 0) all[idx] = p; else all.push(p);
    await saveProjects(all.sort((a,b)=>a.number-b.number));
}

export async function deleteProject(number: number) {
    const all = await loadProjects();
    const filtered = all.filter(p => p.number !== number);
    await saveProjects(filtered);
}

export function nextDefaultNumber(projects: Project[]): number {
    if (projects.length === 0) return 1;
    return Math.max(...projects.map(p => p.number)) + 1;
}
