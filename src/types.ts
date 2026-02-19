export type MachineRoomChoice = 'yes' | 'no' | null;

export type Project = {
    number: number;
    name: string;
    machineRoom: MachineRoomChoice;
};

export type Item = {
    id: number;
    name: string;
    tab: TabKey;
    group?: string;
};

export type TabKey =
    | 'general_sellos'
    | 'mr_yes'
    | 'mr_no'
    | 'cabina'
    | 'sobre_cabina'
    | 'pozo';
