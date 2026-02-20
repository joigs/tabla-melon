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

const headerStyle = {
    font: { bold: true },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
} as any;

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

    const v = (m: 1 | 2 | 3 | 4, med: 1 | 2 | 3, p: 1 | 2 | 3 | 4) =>
        (opts.points[`${m}-${med}-${p}`] ?? '').trim();

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

    // Columnas más anchas para que no se corte "X° punto"
    ws['!cols'] = [
        { wch: 14 }, // B
        ...Array.from({ length: 12 }).map(() => ({ wch: 16 })), // C..N
    ];

    // Altura de filas (B2..N7 => filas 2..7)
    ws['!rows'] = [
        {}, // fila 1
        { hpt: 22 }, // fila 2 (B2..N2)
        { hpt: 26 }, // fila 3 (B3..N3)
        { hpt: 20 },
        { hpt: 20 },
        { hpt: 20 },
        { hpt: 20 },
    ];

    // Estilos header (B2..N3)
    const styleCell = (r: number, c: number, s: any) => {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (!ws[addr]) ws[addr] = { t: 's', v: '' };
        ws[addr].s = { ...(ws[addr].s || {}), ...s };
    };

    // r/c son 0-based
    // B2..N2 => r=1, c=1..13
    for (let c = 1; c <= 13; c++) styleCell(1, c, headerStyle);
    // B3..N3 => r=2
    for (let c = 1; c <= 13; c++) styleCell(2, c, headerStyle);

    // Colorear C4..N7 (datos)
    for (let i = 2; i <= 5; i++) {      // filas aoa mantos
        for (let j = 1; j <= 12; j++) { // cols aoa valores (C..N)
            const r = 1 + i; // origen B2 => r base 1
            const c = 1 + j;

            const addr = XLSX.utils.encode_cell({ r, c });
            const cell = ws[addr];
            if (!cell) continue;

            const n = parseValorToNumber(cell.v);
            if (n === null) continue;

            cell.s = {
                ...(cell.s || {}),
                fill: { patternType: 'solid', fgColor: { rgb: n < 2.0 ? RED : GREEN } },
            };
        }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mediciones');

    const b64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64', cellStyles: true });
    await FileSystem.writeAsStringAsync(uri, b64, { encoding: 'base64' as any });

    return uri;
}