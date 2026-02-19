import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { Item, Project } from './types';

export function slugify(s: string) {
    return s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
}

function projectAlbumTitle(project: Project) {
    return `${project.number} ${project.name}`.trim();
}


const APP_ROOT_DIR = `${FileSystem.documentDirectory || ''}camara-vertical`;

async function ensureDir(path: string) {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
        await FileSystem.makeDirectoryAsync(path, { intermediates: true });
    }
}

export async function ensureAppRootDir() {
    if (!APP_ROOT_DIR) return;
    await ensureDir(APP_ROOT_DIR);
}

function projectDirName(project: Project) {
    return `${project.number}-${slugify(project.name)}`;
}

async function ensureProjectDir(project: Project) {
    await ensureAppRootDir();
    const dir = `${APP_ROOT_DIR}/${projectDirName(project)}`;
    await ensureDir(dir);
    return dir;
}

async function listProjectFiles(project: Project): Promise<string[]> {
    await ensureAppRootDir();
    const dir = `${APP_ROOT_DIR}/${projectDirName(project)}`;
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists || !info.isDirectory) return [];
    const entries = await FileSystem.readDirectoryAsync(dir);
    return entries.filter(name =>
        name.toLowerCase().match(/\.(jpg|jpeg|png)$/),
    );
}


export async function findAssetsForItem(project: Project, item: Item): Promise<string[]> {
    const files = await listProjectFiles(project);
    const prefix = `${item.id}_${slugify(item.name)}_`;
    return files.filter(name => name.startsWith(prefix));
}

export async function nextImageIndex(project: Project, item: Item): Promise<number> {
    const files = await findAssetsForItem(project, item);
    if (files.length === 0) return 1;
    const nums = files
        .map(name => {
            const m = name.match(/_(\d+)\.(jpg|jpeg|png)$/i);
            return m ? parseInt(m[1], 10) : 0;
        })
        .filter(n => n > 0);
    return (nums.length ? Math.max(...nums) : 0) + 1;
}


export async function savePhotoWithName(project: Project, item: Item, tmpUri: string): Promise<void> {
    const index = await nextImageIndex(project, item);
    const filename = `${item.id}_${slugify(item.name)}_${index}.jpg`;
    const projectDir = await ensureProjectDir(project);
    const dest = `${projectDir}/${filename}`;

    await FileSystem.moveAsync({ from: tmpUri, to: dest });

    try {
        const perm = await MediaLibrary.getPermissionsAsync();
        if (!perm.granted) {
            return;
        }

        const asset = await MediaLibrary.createAssetAsync(dest);

        const albumTitle = projectAlbumTitle(project);
        const existingAlbum = await MediaLibrary.getAlbumAsync(albumTitle);

        if (!existingAlbum) {
            await MediaLibrary.createAlbumAsync(albumTitle, asset, true);
        } else {
            await MediaLibrary.addAssetsToAlbumAsync([asset], existingAlbum, true);
        }

    } catch {
    }
}

export async function deleteSectionAssets(project: Project, itemIds: number[]) {
    const dir = `${APP_ROOT_DIR}/${projectDirName(project)}`;
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists || !info.isDirectory) return;

    const entries = await FileSystem.readDirectoryAsync(dir);
    const idSet = new Set(itemIds);

    for (const name of entries) {
        const m = name.match(/^(\d+)_/);
        if (m && idSet.has(parseInt(m[1], 10))) {
            try {
                await FileSystem.deleteAsync(`${dir}/${name}`, { idempotent: true });
            } catch {

            }
        }
    }
}

export async function countProgress(project: Project, expectedItems: Item[]) {
    const files = await listProjectFiles(project);
    const takenByItem = new Set<number>();

    for (const name of files) {
        const m = name.match(/^(\d+)_/);
        if (m) takenByItem.add(parseInt(m[1], 10));
    }

    const expectedIds = new Set(expectedItems.map(i => i.id));
    let taken = 0;
    expectedIds.forEach(id => {
        if (takenByItem.has(id)) taken += 1;
    });

    return { taken, total: expectedItems.length };
}

export async function countPhotosForItem(project: Project, item: Item) {
    const list = await findAssetsForItem(project, item);
    return list.length;
}
