import React from 'react';
import { Pressable, Text, ViewStyle } from 'react-native';

type Variant = 'primary' | 'outline' | 'danger';
type Size = 'md' | 'sm';

export default function PillButton({
                                       title,
                                       onPress,
                                       variant = 'primary',
                                       size = 'md',
                                       style,
                                       disabled = false,
                                   }: {
    title: string;
    onPress: () => void;
    variant?: Variant;
    size?: Size;
    style?: ViewStyle;
    disabled?: boolean;
}) {
    const base: ViewStyle = {
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: size === 'sm' ? 12 : 16,
        paddingVertical: size === 'sm' ? 8 : 10,
        opacity: disabled ? 0.6 : 1,
    };

    const bg =
        variant === 'primary'
            ? { backgroundColor: '#0A84FF' }
            : variant === 'danger'
                ? { backgroundColor: '#ff3b30' }
                : { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#0A84FF' };

    const textStyle = {
        color: variant === 'outline' ? '#0A84FF' : '#fff',
        fontWeight: '700' as const,
        fontSize: size === 'sm' ? 13 : 14,
    };

    return (
        <Pressable
            disabled={disabled}
            onPress={onPress}
            android_ripple={{ color: variant === 'outline' ? '#cfe5ff' : '#247fff', borderless: false }}
            style={[base, bg, style]}
        >
            <Text style={textStyle}>{title}</Text>
        </Pressable>
    );
}
