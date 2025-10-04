// hooks/useMapaAPI.ts
import { useState, useEffect, useCallback } from 'react';

export interface PuntoMapa {
  id: string;
  tipo: 'oefa' | 'educacion' | 'salud' | 'poblacion';
  latitud: number;
  longitud: number;
  distancia_km: number;
  nombre: string;
  ubicacion: string;
  info_especifica: Record<string, any>;
}

export interface FiltrosMapa {
  centro_lat: number;
  centro_lng: number;
  radio_km: number;
  tipos: string;
  ubicacion?: string;
}

export interface RespuestaMapa {
  puntos: PuntoMapa[];
  total: number;
  tipos_count: Record<string, number>;
  filtros_aplicados: any;
}

export interface EstadisticasAPI {
  total_puntos_oefa: number;
  total_centros_educacion: number;
  total_centros_salud: number;
  total_centros_poblacion: number;
  ultimo_update: string;
}

const API_BASE_URL = 'http://localhost:8000';

export function useMapaAPI() {
  const [puntos, setPuntos] = useState<PuntoMapa[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasAPI | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener puntos del mapa
  const obtenerPuntos = useCallback(async (filtros: FiltrosMapa) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        centro_lat: filtros.centro_lat.toString(),
        centro_lng: filtros.centro_lng.toString(),
        radio_km: filtros.radio_km.toString(),
        tipos: filtros.tipos,
        limit: '200' // Reducido para mejor performance con muchos datos
      });

      if (filtros.ubicacion) {
        params.append('ubicacion', filtros.ubicacion);
      }

      const response = await fetch(`${API_BASE_URL}/api/mapa/puntos?${params}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: RespuestaMapa = await response.json();
      setPuntos(data.puntos);
      
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      console.error('Error obteniendo puntos:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para obtener estadísticas
  const obtenerEstadisticas = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stats`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: EstadisticasAPI = await response.json();
      setEstadisticas(data);
      
      return data;
    } catch (err) {
      console.error('Error obteniendo estadísticas:', err);
      return null;
    }
  }, []);

  // Función para obtener detalle de un punto
  const obtenerDetallePunto = useCallback(async (tipo: string, id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/punto/${tipo}/${id}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Error obteniendo detalle del punto:', err);
      return null;
    }
  }, []);

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    obtenerEstadisticas();
  }, [obtenerEstadisticas]);

  return {
    puntos,
    estadisticas,
    loading,
    error,
    obtenerPuntos,
    obtenerEstadisticas,
    obtenerDetallePunto
  };
}