import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Keyboard, Platform } from 'react-native';
import { setValorPunto } from '../db';

type Props = {
    inspeccionId: number;
    manto: 1 | 2 | 3 | 4;
    medicion: 1 | 2 | 3;
    punto: 1 | 2 | 3 | 4;

    value: string;
    onValueChange: (next: string) => void;

    inputRef?: (ref: TextInput | null) => void;
    onSubmitNext?: () => void;
    onFocus?: () => void;
    isLast?: boolean;
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
    let s = raw.replace(/\./g, ',').replace(/[^\d,]/g, '');
    if (s.startsWith(',')) s = '0' + s;

    const firstComma = s.indexOf(',');
    if (firstComma !== -1) {
        s = s.slice(0, firstComma + 1) + s.slice(firstComma + 1).replace(/,/g, '');
    }

    const maxLen = s.startsWith('1') ? 4 : 3;
    if (s.length > maxLen) s = s.slice(0, maxLen);

    if (s === '') return '';

    const hasComma = s.includes(',');
    const parts = s.split(',');
    let intStr = parts[0] ?? '';
    let fracStr = parts[1] ?? '';

    if (intStr.length > 1) {
        const n = parseInt(intStr, 10);
        if (!Number.isFinite(n)) return prev;
        intStr = String(n);
    }

    const intVal = Number(intStr);
    if (!Number.isFinite(intVal) || intVal < 0 || intVal > 10) return prev;

    if (fracStr.length > 1) fracStr = fracStr.slice(0, 1);

    if (intVal === 10 && fracStr.length > 0 && fracStr !== '0') {
        fracStr = '0';
    }

    let out = intStr;
    if (hasComma) out = `${intStr},${fracStr}`;

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
                                    onFocus,
                                    isLast = false,
                                }: Props) {
    const ok = value.trim().length > 0;

    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const saveChainRef = useRef<Promise<void>>(Promise.resolve());
    const lastStoredRef = useRef<string>(normalizeForStore(value));

    useMemo(() => {
        lastStoredRef.current = normalizeForStore(value);
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
                    value={localValue}
                    placeholder="0 a 10"
                    keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                    inputMode="decimal"
                    returnKeyType={isLast ? 'done' : 'next'}
                    blurOnSubmit={isLast}
                    onFocus={onFocus}
                    onSubmitEditing={() => {
                        if (isLast) Keyboard.dismiss();
                        else onSubmitNext?.();
                    }}
                    onChangeText={raw => {
                        const clean = applyRules(localValue, raw);

                        if (clean !== raw) {

                            setLocalValue(raw);
                            setTimeout(() => {
                                setLocalValue(clean);
                                if (clean !== value) onValueChange(clean);
                                enqueueSave(normalizeForStore(clean));
                            }, 0);
                        } else {
                            setLocalValue(clean);
                            if (clean !== value) onValueChange(clean);
                            enqueueSave(normalizeForStore(clean));
                        }
                    }}
                    onBlur={() => {
                        let storeVal = normalizeForStore(localValue);
                        if (storeVal.endsWith(',')) storeVal += '0';

                        if (storeVal !== localValue) {
                            setLocalValue(storeVal);
                            onValueChange(storeVal);
                        }
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