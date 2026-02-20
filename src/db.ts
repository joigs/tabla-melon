// src/db.ts
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
                                                    nombre TEXT NOT NULL
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
}

export type InspeccionRow = { id: number; numero: number; nombre: string };
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

export async function createInspeccion(numero: number, nombre: string): Promise<number> {
    const db = await getDb();
    const res = await db.runAsync(
        'INSERT INTO inspecciones (numero, nombre) VALUES (?, ?);',
        numero,
        nombre
    );
    const id = Number(res.lastInsertRowId);
    await ensure48Puntos(db, id);
    return id;
}

export async function updateInspeccion(id: number, numero: number, nombre: string) {
    const db = await getDb();
    await db.runAsync('UPDATE inspecciones SET numero = ?, nombre = ? WHERE id = ?;', numero, nombre, id);
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


export const TOTAL_PUNTOS = 48;

export type InspeccionConProgreso = InspeccionRow & { completados: number };

export async function listInspeccionesConProgreso(): Promise<InspeccionConProgreso[]> {
    const db = await getDb();
    return db.getAllAsync<InspeccionConProgreso>(`
        SELECT
            i.id,
            i.numero,
            i.nombre,
            COALESCE(
                    SUM(
                            CASE
                                WHEN TRIM(COALESCE(p.valor_texto, '')) <> '' THEN 1
                                ELSE 0
                                END
                    ),
                    0
            ) AS completados
        FROM inspecciones i
                 LEFT JOIN puntos p ON p.inspeccion_id = i.id
        GROUP BY i.id
        ORDER BY i.numero DESC;
    `);
}