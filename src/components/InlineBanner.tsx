import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';

export type Banner = {
    message: string;
    link_url?: string | null;
    link_label?: string | null;
};

export default function InlineBanner({ banner }: { banner: Banner }) {
    const onPressLink = async () => {
        const url = banner.link_url;
        if (!url) return;
        try {
            await Linking.openURL(url);
        } catch {}
    };

    return (
        <View
            style={{
                backgroundColor: '#F2F8FF',
                borderColor: '#CFE4FF',
                borderWidth: 1,
                borderRadius: 10,
                padding: 12,
                marginBottom: 12,
            }}
        >
            <Text style={{ color: '#0A3D62' }}>{banner.message}</Text>
            {!!banner.link_url && (
                <TouchableOpacity onPress={onPressLink} style={{ marginTop: 8 }}>
                    <Text style={{ color: '#0A84FF', fontWeight: '700' }}>
                        {banner.link_label || 'Ver más'}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
