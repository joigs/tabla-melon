import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PointsMap } from '../db';

const GREEN = '#bbf7d0';
const RED = '#fecaca';

export default function MeasurementTableShot({ points, tieneManto4 }: { points: PointsMap, tieneManto4: boolean }) {
    const getCell = (m: 1 | 2 | 3 | 4, med: 1 | 2 | 3, p: 1 | 2 | 3 | 4) => {
        let val = (points[`${m}-${med}-${p}`] ?? '').trim();
        let bgColor = '#ffffff';

        if (val) {
            if (!val.includes(',')) {
                val += ',0';
            }
            const num = Number(val.replace(',', '.'));
            if (!Number.isNaN(num)) {
                bgColor = num < 2.0 ? RED : GREEN;
            }
        }
        return { val, bgColor };
    };

    const renderPointHeader = () => (
        <View style={styles.headerRow}>
            {[1, 2, 3, 4].map(p => (
                <View key={p} style={styles.pointHeaderBox}>
                    <Text style={styles.pointHeaderText}>P{p}</Text>
                </View>
            ))}
        </View>
    );

    const mantos = tieneManto4 ? [1, 2, 3, 4] : [1, 2, 3];

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <View style={styles.colTitle} />
                {[1, 2, 3].map(med => (
                    <View key={`header-med-${med}`} style={styles.colGroup}>
                        <Text style={styles.medHeader}>{med}° Medición</Text>
                        {renderPointHeader()}
                    </View>
                ))}
            </View>

            {mantos.map(manto => (
                <View key={`manto-${manto}`} style={styles.row}>
                    <View style={styles.colTitle}>
                        <Text style={styles.mantoTitle}>Manto {manto}</Text>
                    </View>
                    {[1, 2, 3].map(med => (
                        <View key={`val-med-${med}`} style={styles.colGroupValues}>
                            {[1, 2, 3, 4].map(p => {
                                const { val, bgColor } = getCell(manto as 1 | 2 | 3 | 4, med as 1 | 2 | 3, p as 1 | 2 | 3 | 4);
                                return (
                                    <View key={`p-${p}`} style={[styles.cellBox, { backgroundColor: bgColor }]}>
                                        <Text style={styles.cellText} numberOfLines={1} adjustsFontSizeToFit>{val}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#444'
    },
    row: {
        flexDirection: 'row'
    },
    colTitle: {
        width: 70,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#444',
        backgroundColor: '#f3f4f6'
    },
    colGroup: {
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#444'
    },
    colGroupValues: {
        flexDirection: 'row',
        borderRightWidth: 1,
        borderColor: '#444'
    },
    medHeader: {
        textAlign: 'center',
        fontWeight: '900',
        fontSize: 16,
        paddingVertical: 8,
        backgroundColor: '#f3f4f6',
        color: '#111'
    },
    headerRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderColor: '#444'
    },
    pointHeaderBox: {
        width: 46,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderColor: '#444'
    },
    pointHeaderText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#111'
    },
    mantoTitle: {
        fontWeight: '900',
        fontSize: 15,
        color: '#111',
        textAlign: 'center'
    },
    cellBox: {
        width: 46,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#444'
    },
    cellText: {
        fontSize: 20,
        fontWeight: '900',
        color: '#111'
    }
});