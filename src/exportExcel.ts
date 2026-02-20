// src/exportExcel.ts
import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx-js-style';
import { Buffer } from 'buffer';
import type { PointsMap } from './db';

(global as any).Buffer = (global as any).Buffer || Buffer;

function slugify(s: string) {
    return s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
}

async function ensureDir(path: string) {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) await FileSystem.makeDirectoryAsync(path, { intermediates: true });
}

function parseValorToNumber(raw: unknown): number | null {
    const s = String(raw ?? '').trim();
    if (!s) return null;

    const normalized = s.replace(',', '.');

    const n = Number(normalized);
    if (!Number.isFinite(n)) return null;
    return n;
}

const GREEN = 'FF00B050';
const RED = 'FFFF0000';

export async function writeInspeccionExcel(opts: {
    numero: number;
    nombre: string;
    points: PointsMap;
}) {
    const docDir = FileSystem.documentDirectory || '';
    const baseDir = `${docDir}betonera`;
    const excelDir = `${baseDir}/excels`;

    await ensureDir(baseDir);
    await ensureDir(excelDir);

    const filename = `${opts.numero}-${slugify(opts.nombre)}.xlsx`;
    const uri = `${excelDir}/${filename}`;

    // B2..N7
    const row2 = [
        '', '1° Medición', '', '', '',
        '2° Medición', '', '', '',
        '3° Medición', '', '', '',
    ];
    const row3 = [
        'Medición',
        '1° punto', '2° punto', '3° punto', '4° punto',
        '1° punto', '2° punto', '3° punto', '4° punto',
        '1° punto', '2° punto', '3° punto', '4° punto',
    ];

    const v = (m: 1 | 2 | 3 | 4, med: 1 | 2 | 3, p: 1 | 2 | 3 | 4) => {
        let val = (opts.points[`${m}-${med}-${p}`] ?? '').trim();
        // Agregamos ,0 si no hay ninguna coma
        if (val && !val.includes(',')) {
            val += ',0';
        }
        return val;
    };

    const mantoRow = (m: 1 | 2 | 3 | 4) => ([
        `Manto ${m}`,
        v(m, 1, 1), v(m, 1, 2), v(m, 1, 3), v(m, 1, 4),
        v(m, 2, 1), v(m, 2, 2), v(m, 2, 3), v(m, 2, 4),
        v(m, 3, 1), v(m, 3, 2), v(m, 3, 3), v(m, 3, 4),
    ]);

    const aoa = [
        row2,
        row3,
        mantoRow(1),
        mantoRow(2),
        mantoRow(3),
        mantoRow(4),
    ];

    const ws: XLSX.WorkSheet = {};
    XLSX.utils.sheet_add_aoa(ws, aoa, { origin: 'B2' });

    ws['!merges'] = [
        { s: { r: 1, c: 2 }, e: { r: 1, c: 5 } },   // C2:F2
        { s: { r: 1, c: 6 }, e: { r: 1, c: 9 } },   // G2:J2
        { s: { r: 1, c: 10 }, e: { r: 1, c: 13 } }, // K2:N2
    ];

    ws['!cols'] = [
        { wch: 12 }, // B
        ...Array.from({ length: 12 }).map(() => ({ wch: 14 })),
    ];

    for (let i = 2; i <= 5; i++) {
        for (let j = 1; j <= 12; j++) {
            const r = 1 + i;
            const c = 1 + j;
            const addr = XLSX.utils.encode_cell({ r, c });

            const cell = ws[addr];
            if (!cell || cell.v == null || cell.v === '') continue;

            const n = parseValorToNumber(cell.v);
            if (n === null) continue;

            cell.s = {
                ...(cell.s || {}),
                fill: { patternType: 'solid', fgColor: { rgb: n < 2.0 ? RED : GREEN } },
                alignment: { horizontal: 'center', vertical: 'center' }
            };
        }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mediciones');

    const b64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    await FileSystem.writeAsStringAsync(uri, b64, { encoding: 'base64' as any });

    return uri;
}