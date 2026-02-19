import React, {
    createContext,
    useCallback,
    useContext,
    useState,
} from 'react';
import {
    Modal,
    View,
    Text,
    TouchableWithoutFeedback,
} from 'react-native';
import PillButton from './PillButton';

type ShowFn = (
    title: string,
    message: string,
    okText?: string,
    onOk?: () => void | Promise<void>,
) => void;

type ConfirmOptions = {
    okText?: string;
    cancelText?: string;
    onOk?: () => void | Promise<void>;
    onCancel?: () => void | Promise<void>;
};

type ConfirmFn = (
    title: string,
    message: string,
    options?: ConfirmOptions,
) => void;

type AlertMode = 'alert' | 'confirm';

type AlertState = {
    visible: boolean;
    mode: AlertMode;
    title?: string;
    message?: string;
    okText?: string;
    cancelText?: string;
    onOk?: () => void | Promise<void>;
    onCancel?: () => void | Promise<void>;
};

type AlertContext = {
    alert: ShowFn;
    confirm: ConfirmFn;
};

const defaultState: AlertState = {
    visible: false,
    mode: 'alert',
};

const Ctx = createContext<AlertContext | null>(null);

export function NiceAlertHost({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AlertState>(defaultState);

    const alert: ShowFn = useCallback((title, message, okText = 'OK', onOk) => {
        setState({
            visible: true,
            mode: 'alert',
            title,
            message,
            okText,
            onOk,
        });
    }, []);

    const confirm: ConfirmFn = useCallback((title, message, options) => {
        setState({
            visible: true,
            mode: 'confirm',
            title,
            message,
            okText: options?.okText || 'Aceptar',
            cancelText: options?.cancelText || 'Cancelar',
            onOk: options?.onOk,
            onCancel: options?.onCancel,
        });
    }, []);

    const handleOk = () => {
        const cb = state.onOk;
        setState(defaultState);
        cb?.();
    };

    const handleCancel = () => {
        const cb = state.onCancel;
        setState(defaultState);
        cb?.();
    };

    const handleRequestClose = () => {
        if (!state.visible) return;
        if (state.mode === 'confirm') handleCancel();
        else handleOk();
    };

    return (
        <Ctx.Provider value={{ alert, confirm }}>
            {children}
            <Modal
                visible={state.visible}
                transparent
                animationType="fade"
                onRequestClose={handleRequestClose}
            >
                {/* Tocar fuera del cuadro => handleRequestClose */}
                <TouchableWithoutFeedback onPress={handleRequestClose}>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: 'rgba(0,0,0,0.25)',
                            justifyContent: 'center',
                            padding: 24,
                        }}
                    >
                        {/* Tocar dentro del cuadro NO cierra el modal */}
                        <TouchableWithoutFeedback>
                            <View
                                style={{
                                    backgroundColor: '#fff',
                                    borderRadius: 12,
                                    padding: 16,
                                }}
                            >
                                {!!state.title && (
                                    <Text
                                        style={{
                                            fontWeight: '700',
                                            fontSize: 16,
                                            marginBottom: 6,
                                        }}
                                    >
                                        {state.title}
                                    </Text>
                                )}
                                {!!state.message && (
                                    <Text
                                        style={{
                                            color: '#333',
                                            marginBottom: 14,
                                        }}
                                    >
                                        {state.message}
                                    </Text>
                                )}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'flex-end',
                                        marginTop: 4,
                                    }}
                                >
                                    {state.mode === 'confirm' && (
                                        <PillButton
                                            title={state.cancelText || 'Cancelar'}
                                            variant="outline"
                                            onPress={handleCancel}
                                            style={{ marginRight: 8 }}
                                        />
                                    )}
                                    <PillButton
                                        title={state.okText || 'OK'}
                                        onPress={handleOk}
                                    />
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </Ctx.Provider>
    );
}

export function useNiceAlert(): ShowFn {
    const ctx = useContext(Ctx);
    if (!ctx) {
        throw new Error('NiceAlert context not found. Mount <NiceAlertHost /> near the root.');
    }
    return ctx.alert;
}

export function useNiceConfirm(): ConfirmFn {
    const ctx = useContext(Ctx);
    if (!ctx) {
        throw new Error('NiceAlert context not found. Mount <NiceAlertHost /> near the root.');
    }
    return ctx.confirm;
}

let extShow: ShowFn | null = null;
let extConfirm: ConfirmFn | null = null;

export function NiceAlertRegistrar() {
    const ctx = useContext(Ctx);
    if (!ctx) {
        throw new Error('NiceAlert context not found. Mount <NiceAlertHost /> near the root.');
    }
    extShow = ctx.alert;
    extConfirm = ctx.confirm;
    return null;
}

export function niceAlert(
    title: string,
    message: string,
    okText?: string,
    onOk?: () => void | Promise<void>,
) {
    if (extShow) extShow(title, message, okText, onOk);
}

export function niceConfirm(
    title: string,
    message: string,
    options?: ConfirmOptions,
) {
    if (extConfirm) extConfirm(title, message, options);
}
