import React, { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { loadProjects } from '../storage';
import { Item } from '../types';
import { ALL_ITEMS } from '../items';
import { savePhotoWithName } from '../media';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PillButton from '../components/PillButton';
import { niceAlert } from '../components/NiceAlert';

type R = RouteProp<RootStackParamList, 'Camera'>;

export default function CameraScreen() {
    const route = useRoute<R>();
    const nav = useNavigation();
    const cameraRef = useRef<CameraView>(null);

    const [camPerm, requestCamPerm] = useCameraPermissions();
    const [project, setProject] = useState<any>(null);
    const [initialized, setInitialized] = useState(false);

    const item: Item | undefined = ALL_ITEMS.find(
        i => i.id === route.params.itemId,
    );

    const insets = useSafeAreaInsets();

    useEffect(() => {
        const init = async () => {
            if (!camPerm?.granted) {
                const res = await requestCamPerm();
                if (!res.granted) {
                    setInitialized(true);
                    return;
                }
            }

            try {
                await MediaLibrary.requestPermissionsAsync(
                    { accessPrivileges: 'addOnly' } as any,
                );
            } catch {
            }

            const all = await loadProjects();
            const p = all.find(x => x.number === route.params.projectNumber);
            setProject(p || null);

            setInitialized(true);
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const takePhoto = async () => {
        if (!cameraRef.current || !project || !item) return;
        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 1, shutterSound: false });
            await savePhotoWithName(project, item, photo.uri);
            niceAlert('Guardado', 'Foto guardada para este ítem');
            // @ts-ignore
            nav.goBack();
        } catch (e: any) {
            niceAlert('Error', e?.message || 'No se pudo guardar');
        }
    };

    if (!initialized || !camPerm) {
        return <View style={{ flex: 1 }} />;
    }

    if (!camPerm.granted) {
        return (
            <View style={{ flex: 1, padding: 16, paddingBottom: insets.bottom }}>
                <Text>Se requiere permiso de cámara para tomar fotos.</Text>
                <View style={{ height: 12 }} />
                <PillButton title="Dar permiso de cámara" onPress={requestCamPerm} />
            </View>
        );
    }

    if (!item || !project) {
        return (
            <View style={{ flex: 1, padding: 16, paddingBottom: insets.bottom }}>
                <Text>Datos no válidos</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, paddingBottom: insets.bottom }}>
            <CameraView
                ref={cameraRef}
                style={{ flex: 1 }}
                facing="back"
                mode="picture"
            />
            <View style={{ padding: 12 }}>
                <Text>
                    {project.number} - {project.name}
                </Text>
                <Text>Ítem: {item.name}</Text>
                <View style={{ marginTop: 8 }}>
                    <PillButton title="Tomar foto" onPress={takePhoto} />
                </View>
            </View>
        </View>
    );
}
