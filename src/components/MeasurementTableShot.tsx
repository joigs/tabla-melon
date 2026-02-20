// src/components/MeasurementTableShot.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PointsMap } from '../db';

export default function MeasurementTableShot({
                                                 points,
                                             }: {
    points: PointsMap;
}) {
    const v = (m: 1 | 2 | 3 | 4, med: 1 | 2 | 3, p: 1 | 2 | 3 | 4) =>
        (points[`${m}-${med}-${p}`] ?? '').trim();

    return (
        <View style={styles.table}>
            <View style={styles.row}>
                <Cell text="" w={W_LEFT} bold />
                <Cell text="1° Medición" w={W_CELL * 4} bold center />
                <Cell text="2° Medición" w={W_CELL * 4} bold center />
                <Cell text="3° Medición" w={W_CELL * 4} bold center />
            </View>

            <View style={styles.row}>
                <Cell text="Medición" w={W_LEFT} bold />
                {[1, 2, 3].flatMap(() => [1, 2, 3, 4]).map((p, i) => (
                    <Cell key={i} text={`${p}° punto`} w={W_CELL} bold />
                ))}
            </View>

            {/* Filas 4..7 */}
            {[1, 2, 3, 4].map(m => (
                <View key={m} style={styles.row}>
                    <Cell text={`Manto ${m}`} w={W_LEFT} />
                    <Cell text={v(m as 1|2|3|4, 1, 1)} w={W_CELL} />
                    <Cell text={v(m as 1|2|3|4, 1, 2)} w={W_CELL} />
                    <Cell text={v(m as 1|2|3|4, 1, 3)} w={W_CELL} />
                    <Cell text={v(m as 1|2|3|4, 1, 4)} w={W_CELL} />

                    <Cell text={v(m as 1|2|3|4, 2, 1)} w={W_CELL} />
                    <Cell text={v(m as 1|2|3|4, 2, 2)} w={W_CELL} />
                    <Cell text={v(m as 1|2|3|4, 2, 3)} w={W_CELL} />
                    <Cell text={v(m as 1|2|3|4, 2, 4)} w={W_CELL} />

                    <Cell text={v(m as 1|2|3|4, 3, 1)} w={W_CELL} />
                    <Cell text={v(m as 1|2|3|4, 3, 2)} w={W_CELL} />
                    <Cell text={v(m as 1|2|3|4, 3, 3)} w={W_CELL} />
                    <Cell text={v(m as 1|2|3|4, 3, 4)} w={W_CELL} />
                </View>
            ))}
        </View>
    );
}

const W_LEFT = 92;
const W_CELL = 54;

function Cell({
                  text,
                  w,
                  bold,
                  center,
              }: {
    text: string;
    w: number;
    bold?: boolean;
    center?: boolean;
}) {
    return (
        <View style={[styles.cell, { width: w }, center ? styles.center : null]}>
            <Text numberOfLines={1} style={[styles.cellText, bold ? styles.bold : null]}>
                {text}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    table: {
        borderWidth: 2,
        borderColor: '#000',
        backgroundColor: '#fff',
        alignSelf: 'flex-start',
    },
    row: { flexDirection: 'row' },
    cell: {
        borderWidth: 1,
        borderColor: '#000',
        paddingHorizontal: 6,
        paddingVertical: 6,
        justifyContent: 'center',
    },
    center: { alignItems: 'center' },
    cellText: { fontSize: 12, color: '#000' },
    bold: { fontWeight: '800' },
});