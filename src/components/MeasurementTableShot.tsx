import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PointsMap } from '../db';

const GREEN = '#bbf7d0';
const RED = '#fecaca';

export default function MeasurementTableShot({ points }: { points: PointsMap }) {
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
                <Text key={p} style={styles.pointHeader}>{p}° punto</Text>
            ))}
        </View>
    );

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

            {[1, 2, 3, 4].map(manto => (
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
                                        <Text style={styles.cellText}>{val}</Text>
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
        borderColor: '#999'
    },
    row: {
        flexDirection: 'row'
    },
    colTitle: {
        width: 80,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#999',
        backgroundColor: '#f3f4f6'
    },
    colGroup: {
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#999'
    },
    colGroupValues: {
        flexDirection: 'row',
        borderRightWidth: 1,
        borderColor: '#999'
    },
    medHeader: {
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 12,
        paddingVertical: 6,
        backgroundColor: '#f3f4f6'
    },
    headerRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderColor: '#999'
    },
    pointHeader: {
        width: 65,
        textAlign: 'center',
        fontSize: 11,
        paddingVertical: 6,
        borderRightWidth: 1,
        borderColor: '#e5e7eb'
    },
    mantoTitle: {
        fontWeight: 'bold',
        fontSize: 13
    },
    cellBox: {
        width: 65,
        height: 35,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#e5e7eb'
    },
    cellText: {
        fontSize: 13,
        fontWeight: '600'
    }
});