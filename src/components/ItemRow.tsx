import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Keyboard, Platform } from 'react-native';
import { setValorPunto } from '../db';

type Props = {
    inspeccionId: number;
    manto: 1 | 2 | 3 | 4;
    medicion: 1 | 2 | 3;
    punto: 1 | 2 | 3 | 4;

    value: string; // controlado por el padre (map)
    onValueChange: (next: string) => void;

    inputRef?: (ref: TextInput | null) => void;
    onSubmitNext?: () => void; // foco al siguiente
    isLast?: boolean;          // si es el último del manto => cerrar teclado
};

function normalizeForStore(ui: string): string {
    const s = ui.trim();
    if (!s) return '';
    if (!s.includes(',')) return s;

    const [a, b = ''] = s.split(',');
    const frac = b.length ? b[0] : '0';
    return `${a},${frac}`;
}

function applyRules(prev: string, raw: string): string {
    // 1) normalizar separador y filtrar caracteres
    let s = raw.replace(/\./g, ',').replace(/[^\d,]/g, '');

    // permitir comenzar con coma => "0,"
    if (s.startsWith(',')) s = '0' + s;

    // 2) solo una coma
    const firstComma = s.indexOf(',');
    if (firstComma !== -1) {
        s = s.slice(0, firstComma + 1) + s.slice(firstComma + 1).replace(/,/g, '');
    }

    // 3) límite de largo según primer carácter
    const maxLen = s.startsWith('1') ? 4 : 3;
    if (s.length > maxLen) s = s.slice(0, maxLen);

    if (s === '') return '';

    // 4) separar entero/decimal
    const hasComma = s.includes(',');
    const parts = s.split(',');
    let intStr = parts[0] ?? '';
    let fracStr = parts[1] ?? '';

    // limpiar ceros a la izquierda (solo en entero)
    if (intStr.length > 1) {
        const n = parseInt(intStr, 10);
        if (!Number.isFinite(n)) return prev;
        intStr = String(n);
    }

    // validar entero 0..10
    const intVal = Number(intStr);
    if (!Number.isFinite(intVal) || intVal < 0 || intVal > 10) return prev;

    // decimal: máximo 1 dígito
    if (fracStr.length > 1) fracStr = fracStr.slice(0, 1);

    // si es 10, el decimal solo puede ser 0 (o vacío mientras escribe)
    if (intVal === 10 && fracStr.length > 0 && fracStr !== '0') {
        fracStr = '0';
    }

    let out = intStr;
    if (hasComma) out = `${intStr},${fracStr}`;

    // re-aplicar maxLen por si cambió el entero tras quitar ceros
    const maxLen2 = out.startsWith('1') ? 4 : 3;
    if (out.length > maxLen2) out = out.slice(0, maxLen2);

    return out;
}

export default function ItemRow({
                                    inspeccionId,
                                    manto,
                                    medicion,
                                    punto,
                                    value,
                                    onValueChange,
                                    inputRef,
                                    onSubmitNext,
                                    isLast = false,
                                }: Props) {
    const ok = value.trim().length > 0;

    // cola de guardados (evita carreras si tipeas rápido)
    const saveChainRef = useRef<Promise<void>>(Promise.resolve());
    const lastStoredRef = useRef<string>(normalizeForStore(value));

    // mantener lastStoredRef consistente si el padre cambia value (carga inicial, etc.)
    useMemo(() => {
        lastStoredRef.current = normalizeForStore(value);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const enqueueSave = (storeVal: string) => {
        if (storeVal === lastStoredRef.current) return;
        lastStoredRef.current = storeVal;

        saveChainRef.current = saveChainRef.current
            .then(() =>
                setValorPunto({
                    inspeccionId,
                    manto,
                    medicion,
                    punto,
                    valor: storeVal,
                }),
            )
            .catch(() => {});
    };

    return (
        <View style={styles.row}>
            <View style={styles.statusBox}>
                <Text style={[styles.status, ok ? styles.ok : styles.nok]}>
                    {ok ? '✓' : '✗'}
                </Text>
            </View>

            <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                    Medición {medicion} · Punto {punto}
                </Text>

                <TextInput
                    ref={inputRef}
                    value={value}
                    placeholder="0 a 10"
                    keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                    inputMode="decimal"
                    returnKeyType={isLast ? 'done' : 'next'}
                    blurOnSubmit={isLast}
                    onSubmitEditing={() => {
                        if (isLast) Keyboard.dismiss();
                        else onSubmitNext?.();
                    }}
                    onChangeText={raw => {
                        const nextUi = applyRules(value, raw);
                        if (nextUi === value) return;

                        onValueChange(nextUi);

                        const storeVal = normalizeForStore(nextUi);
                        enqueueSave(storeVal);
                    }}
                    onBlur={() => {
                        // si queda "x," => convertir a "x,0" y persistir
                        const storeVal = normalizeForStore(value);
                        if (storeVal !== value) onValueChange(storeVal);
                        enqueueSave(storeVal);
                    }}
                    style={styles.input}
                />

                <Text style={styles.meta}>Manto {manto}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 12,
        borderBottomWidth: 1,
        borderColor: '#ddd',
        gap: 10,
    },
    statusBox: { width: 28, alignItems: 'center', marginTop: 2 },
    status: { fontSize: 18, fontWeight: '800' },
    ok: { color: 'green' },
    nok: { color: 'red' },
    title: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
    meta: { fontSize: 12, color: '#666', marginTop: 6 },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
});