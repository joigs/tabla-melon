import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb() {
    if (!dbPromise) dbPromise = SQLite.openDatabaseAsync('betonera.db');
    return dbPromise;
}

export async function initDb() {
    const db = await getDb();
    await db.execAsync('PRAGMA foreign_keys = ON;');

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS inspecciones (
                                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                    numero INTEGER NOT NULL UNIQUE,
                                                    nombre TEXT NOT NULL,
                                                    tiene_manto_4 INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS puntos (
                                              id INTEGER PRIMARY KEY AUTOINCREMENT,
                                              inspeccion_id INTEGER NOT NULL,
                                              manto INTEGER NOT NULL,
                                              medicion INTEGER NOT NULL,
                                              punto INTEGER NOT NULL,
                                              valor_texto TEXT,
                                              UNIQUE(inspeccion_id, manto, medicion, punto),
            FOREIGN KEY(inspeccion_id) REFERENCES inspecciones(id) ON DELETE CASCADE
            );
    `);

    await db.execAsync(`ALTER TABLE inspecciones ADD COLUMN export_count INTEGER NOT NULL DEFAULT 0;`).catch(() => {});
    await db.execAsync(`ALTER TABLE inspecciones ADD COLUMN last_image_uri TEXT;`).catch(() => {});
    await db.execAsync(`ALTER TABLE inspecciones ADD COLUMN tiene_manto_4 INTEGER NOT NULL DEFAULT 1;`).catch(() => {});
}

export type InspeccionRow = {
    id: number;
    numero: number;
    nombre: string;
    tiene_manto_4: number;
    export_count?: number;
    last_image_uri?: string | null;
};

export type PuntoRow = {
    id: number;
    inspeccion_id: number;
    manto: number;
    medicion: number;
    punto: number;
    valor_texto: string | null;
};

export async function listInspecciones(): Promise<InspeccionRow[]> {
    const db = await getDb();
    return db.getAllAsync<InspeccionRow>('SELECT * FROM inspecciones ORDER BY numero DESC;');
}

export async function getInspeccion(id: number): Promise<InspeccionRow | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<InspeccionRow>('SELECT * FROM inspecciones WHERE id = ? LIMIT 1;', id);
    return row ?? null;
}

export async function createInspeccion(numero: number, nombre: string, tieneManto4: number): Promise<number> {
    const db = await getDb();
    const res = await db.runAsync(
        'INSERT INTO inspecciones (numero, nombre, tiene_manto_4) VALUES (?, ?, ?);',
        numero,
        nombre,
        tieneManto4
    );
    const id = Number(res.lastInsertRowId);
    await ensure48Puntos(db, id);
    return id;
}

export async function updateInspeccion(id: number, numero: number, nombre: string, tieneManto4: number) {
    const db = await getDb();
    await db.runAsync(
        'UPDATE inspecciones SET numero = ?, nombre = ?, tiene_manto_4 = ? WHERE id = ?;',
        numero, nombre, tieneManto4, id
    );
}

export async function deleteInspeccion(id: number) {
    const db = await getDb();
    await db.runAsync('DELETE FROM inspecciones WHERE id = ?;', id);
}

async function ensure48Puntos(db: SQLite.SQLiteDatabase, inspeccionId: number) {
    for (let m = 1; m <= 4; m++) {
        for (let med = 1; med <= 3; med++) {
            for (let p = 1; p <= 4; p++) {
                await db.runAsync(
                    `INSERT OR IGNORE INTO puntos (inspeccion_id, manto, medicion, punto, valor_texto)
                     VALUES (?, ?, ?, ?, ?);`,
                    inspeccionId, m, med, p, ''
                );
            }
        }
    }
}

export async function listPuntosByInspeccion(inspeccionId: number): Promise<PuntoRow[]> {
    const db = await getDb();
    return db.getAllAsync<PuntoRow>(
        `SELECT * FROM puntos
         WHERE inspeccion_id = ?
         ORDER BY manto, medicion, punto;`,
        inspeccionId
    );
}

export async function setValorPunto(opts: {
    inspeccionId: number;
    manto: number;
    medicion: number;
    punto: number;
    valor: string;
}) {
    const db = await getDb();
    await db.runAsync(
        `UPDATE puntos
         SET valor_texto = ?
         WHERE inspeccion_id = ? AND manto = ? AND medicion = ? AND punto = ?;`,
        opts.valor, opts.inspeccionId, opts.manto, opts.medicion, opts.punto
    );
}

export type InspeccionConProgreso = InspeccionRow & { completados: number; puntos_totales: number; };

export async function listInspeccionesConProgreso(): Promise<InspeccionConProgreso[]> {
    const db = await getDb();
    return db.getAllAsync<InspeccionConProgreso>(`
        SELECT
            i.id,
            i.numero,
            i.nombre,
            i.tiene_manto_4,
            COALESCE(i.export_count, 0) AS export_count,
            i.last_image_uri AS last_image_uri,
            CASE WHEN i.tiene_manto_4 = 1 THEN 48 ELSE 36 END AS puntos_totales,
            COALESCE(
                    SUM(
                            CASE
                                WHEN TRIM(COALESCE(p.valor_texto, '')) <> '' AND (i.tiene_manto_4 = 1 OR p.manto < 4) THEN 1
                                ELSE 0
                                END
                    ),
                    0
            ) AS completados
        FROM inspecciones i
                 LEFT JOIN puntos p ON p.inspeccion_id = i.id
        GROUP BY i.id, i.numero, i.nombre, i.tiene_manto_4, i.export_count, i.last_image_uri
        ORDER BY i.numero DESC;
    `);
}

export type PointsMap = Record<string, string>;

export async function getPointsMapByInspeccion(inspeccionId: number): Promise<PointsMap> {
    const puntos = await listPuntosByInspeccion(inspeccionId);
    const out: PointsMap = {};
    for (const p of puntos) out[`${p.manto}-${p.medicion}-${p.punto}`] = p.valor_texto ?? '';
    return out;
}

export async function setExportMeta(opts: {
    inspeccionId: number;
    nextExportCount: number;
    lastImageUri: string;
}) {
    const db = await getDb();
    await db.runAsync(
        `UPDATE inspecciones
         SET export_count = ?, last_image_uri = ?
         WHERE id = ?;`,
        opts.nextExportCount, opts.lastImageUri, opts.inspeccionId
    );
}