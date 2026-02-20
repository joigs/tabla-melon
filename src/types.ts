export type Inspeccion = {
    id: number;
    numero: number;
    nombre: string;
};

export type PuntoMedicion = {
    id: number;
    inspeccion_id: number;
    manto: number;     // 1..4
    medicion: number;  // 1..3
    punto: number;     // 1..4
    valor_texto: string | null;
};