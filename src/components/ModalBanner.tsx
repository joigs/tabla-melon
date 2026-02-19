import React from 'react';
import { Modal, View, Text, Linking } from 'react-native';
import PillButton from './PillButton';
import type { Banner } from './InlineBanner';

export default function ModalBanner({
                                        banner,
                                        visible,
                                        onClose,
                                    }: {
    banner: Banner | null;
    visible: boolean;
    onClose: () => void;
}) {
    if (!banner) return null;

    const onPressLink = async () => {
        if (!banner.link_url) return;
        try {
            await Linking.openURL(banner.link_url);
        } catch {}
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    justifyContent: 'center',
                    padding: 24,
                }}
            >
                <View
                    style={{
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        padding: 16,
                    }}
                >
                    <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 10 }}>Aviso</Text>
                    <Text style={{ color: '#111' }}>{banner.message}</Text>

                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                            gap: 12,
                            marginTop: 16,
                        }}
                    >
                        <PillButton title="Cerrar" variant="outline" onPress={onClose} />
                        {banner.link_url ? (
                            <PillButton
                                title={banner.link_label || 'Abrir'}
                                onPress={onPressLink}
                            />
                        ) : null}
                    </View>
                </View>
            </View>
        </Modal>
    );
}
