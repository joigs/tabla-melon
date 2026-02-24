export type Inspeccion = {
    id: number;
    numero: number;
    nombre: string;
    tiene_manto_4: number;
};

export type PuntoMedicion = {
    id: number;
    inspeccion_id: number;
    manto: number;
    medicion: number;
    punto: number;
    valor_texto: string | null;
};