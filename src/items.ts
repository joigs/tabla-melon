import { Item, TabKey, Project } from './types';

export const TABS: { key: TabKey; title: string }[] = [
    { key: 'general_sellos', title: 'General/Sellos' },
    { key: 'mr_yes', title: 'Sala de máquinas' },
    { key: 'mr_no', title: 'Sin sala máquinas' },
    { key: 'cabina', title: 'Cabina' },
    { key: 'sobre_cabina', title: 'Sobre cabina' },
    { key: 'pozo', title: 'Pozo' },
];

export const ALL_ITEMS: Item[] = [
    // General y Sellos
    { id: 101, name: 'Fotografia general de los ascensores', tab: 'general_sellos' },
    { id: 111, name: 'Fotografia de sellos', tab: 'general_sellos' },
    { id: 199, name: 'Otros_General_y_Sellos', tab: 'general_sellos' },

    // Sala de máquinas = sí
    { id: 201, name: 'Acceso sala de maquinas', tab: 'mr_yes' },
    { id: 202, name: 'Luz emergencia', tab: 'mr_yes' },
    { id: 203, name: 'Luz general', tab: 'mr_yes' },
    { id: 204, name: 'Placa de la maquina', tab: 'mr_yes' },
    { id: 205, name: 'Placa limitador', tab: 'mr_yes' },
    { id: 206, name: 'Material ajeno', tab: 'mr_yes' },
    { id: 207, name: 'Marcas de piso', tab: 'mr_yes' },
    { id: 208, name: 'Stop Cercano a la maquina', tab: 'mr_yes' },
    { id: 209, name: 'Pasa Cables', tab: 'mr_yes' },
    { id: 210, name: 'Proteccion en elementos moviles', tab: 'mr_yes' },
    { id: 291, name: 'Otros_Sala_Maquinas_SI', tab: 'mr_yes' },

    // Sala de máquinas = no
    { id: 211, name: 'Armario maniobras', tab: 'mr_no', group: 'Armario de maniobras' },
    { id: 212, name: 'Rotulos', tab: 'mr_no', group: 'Armario de maniobras' },
    { id: 213, name: 'Placa ascensor', tab: 'mr_no', group: 'Armario de maniobras' },
    { id: 214, name: 'Conexion electrica', tab: 'mr_no', group: 'Armario de maniobras' },
    { id: 215, name: 'Maniobra rescate', tab: 'mr_no', group: 'Armario de maniobras' },

    { id: 221, name: 'Placa de maquina', tab: 'mr_no', group: 'Máquina' },
    { id: 222, name: 'Placa Limitador', tab: 'mr_no', group: 'Máquina' },
    { id: 223, name: 'Stop cercano a la maquina', tab: 'mr_no', group: 'Máquina' },
    { id: 224, name: 'Proteccion poleas', tab: 'mr_no', group: 'Máquina' },
    { id: 225, name: 'Resortes', tab: 'mr_no', group: 'Máquina' },
    { id: 292, name: 'Otros_Sala_Maquinas_NO', tab: 'mr_no', group: 'Máquina' },

    // Cabina
    { id: 301, name: 'Plano general cabina', tab: 'cabina' },
    { id: 302, name: 'Espejo cabina', tab: 'cabina' },
    { id: 303, name: 'Piso cabina', tab: 'cabina' },
    { id: 304, name: 'Datos cabina', tab: 'cabina' },
    { id: 305, name: 'Capacidad', tab: 'cabina' },
    { id: 399, name: 'Otros_Cabina', tab: 'cabina' },

    // Sobre cabina
    { id: 401, name: 'Plano general', tab: 'sobre_cabina' },
    { id: 402, name: 'Conmutador', tab: 'sobre_cabina' },
    { id: 403, name: 'Enchufe', tab: 'sobre_cabina' },
    { id: 404, name: 'Iluminacion sobre cabina', tab: 'sobre_cabina' },
    { id: 405, name: 'Iluminacion caja', tab: 'sobre_cabina' },
    { id: 406, name: 'Demarcacion de ascensor', tab: 'sobre_cabina' },
    { id: 407, name: 'Rodapie', tab: 'sobre_cabina' },
    { id: 408, name: 'Medida cables', tab: 'sobre_cabina' },
    { id: 409, name: 'Ganchos de izaje', tab: 'sobre_cabina' },
    { id: 499, name: 'Otros_Sobre_Cabina', tab: 'sobre_cabina' },

    // Pozo
    { id: 501, name: 'Stop', tab: 'pozo' },
    { id: 502, name: 'Enchufe', tab: 'pozo' },
    { id: 503, name: 'Reja divisora', tab: 'pozo' },
    { id: 504, name: 'Iluminacion', tab: 'pozo' },
    { id: 599, name: 'Otros_Pozo', tab: 'pozo' },
];

export const itemsByTab = (tab: TabKey) => ALL_ITEMS.filter(i => i.tab === tab);

export function expectedItemsFor(project: Project) {
    const base = itemsByTab('general_sellos')
        .concat(itemsByTab('cabina'))
        .concat(itemsByTab('sobre_cabina'))
        .concat(itemsByTab('pozo'));
    if (project.machineRoom === 'yes') return base.concat(itemsByTab('mr_yes'));
    if (project.machineRoom === 'no') return base.concat(itemsByTab('mr_no'));
    return base;
}

export const PROJECT_ALBUM_NAME = (p: Project) => `${p.number} ${p.name}`.trim();
