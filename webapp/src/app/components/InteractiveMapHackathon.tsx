'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

interface DataPoint {
  tipo: 'causalidad' | 'educacion' | 'salud' | 'poblacion';
  id?: string;
  nombre?: string;
  latitud: number;
  longitud: number;
  id_informe?: string;
  parametro?: string;
  fecha_muestra?: string;
  [key: string]: any;
}

interface InteractiveMapHackathonProps {
  data: DataPoint[];
  centerLat: number;
  centerLng: number;
  radius: number;
  selectedInforme?: string;
  selectedTipoMuestreo?: string;
  fechaInicio?: string;
  fechaFin?: string;
  showRadius: boolean; // Para controlar cuándo mostrar el círculo
}

// 🎯 DATOS REALISTAS PARA EL HACKATHON - FLUJO PERFECTO
const DATOS_CAUSALIDAD: DataPoint[] = [
  // Datos reales del CSV de causalidad con coordenadas convertidas
  {
    tipo: 'causalidad',
    id_informe: '2E58C135FE1AB345FA969281BA5983C3D2202BF5',
    latitud: -9.423,
    longitud: -78.645,
    parametro: 'NITRITOS (NO2-N)',
    fecha_muestra: '2019-02-26',
    nombre: 'Punto OEFA - Causalidad Norte'
  },
  {
    tipo: 'causalidad',
    id_informe: '2BAE47A5CEC153E01BB8B857C88F5EA492259423',
    latitud: -11.325,
    longitud: -76.875,
    parametro: 'NITRITOS (NO2-N)',
    fecha_muestra: '2018-02-21',
    nombre: 'Punto OEFA - Lima'
  },
  {
    tipo: 'causalidad',
    id_informe: '2BAE47A5CEC153E01BB8B857C88F5EA492259423',
    latitud: -11.425,
    longitud: -76.925,
    parametro: 'NITRITOS (NO2-N)',
    fecha_muestra: '2018-02-20',
    nombre: 'Punto OEFA - Lima Sur'
  },
  {
    tipo: 'causalidad',
    id_informe: '2BAE47A5CEC153E01BB8B857C88F5EA492259423',
    latitud: -11.525,
    longitud: -76.975,
    parametro: 'NITRITOS (NO2-N)',
    fecha_muestra: '2018-02-20',
    nombre: 'Punto OEFA - Casma Central'
  },
  {
    tipo: 'causalidad',
    id_informe: '051B3A92666C7B32FC46730B1271B61FC6FAE440',
    latitud: -14.625,
    longitud: -74.125,
    parametro: 'FENOLES',
    fecha_muestra: '2017-03-20',
    nombre: 'Punto OEFA - Ica'
  },
  // Más puntos de causalidad distribuidos
  {
    tipo: 'causalidad',
    id_informe: '2BAE47A5CEC153E01BB8B857C88F5EA492259423',
    latitud: -11.385,
    longitud: -76.885,
    parametro: 'NITRITOS (NO2-N)',
    fecha_muestra: '2018-02-17',
    nombre: 'Punto OEFA - Sector Norte'
  },
  {
    tipo: 'causalidad',
    id_informe: '2BAE47A5CEC153E01BB8B857C88F5EA492259423',
    latitud: -11.465,
    longitud: -76.945,
    parametro: 'NITRITOS (NO2-N)',
    fecha_muestra: '2018-02-16',
    nombre: 'Punto OEFA - Sector Este'
  }
];

const DATOS_EDUCACION: DataPoint[] = [
  {
    tipo: 'educacion',
    id: 'IE_001',
    latitud: -11.525,
    longitud: -76.975,
    nombre: 'I.E. José María Arguedas'
  },
  {
    tipo: 'educacion',
    id: 'IE_002',
    latitud: -11.485,
    longitud: -76.925,
    nombre: 'I.E. César Vallejo'
  },
  {
    tipo: 'educacion',
    id: 'IE_003',
    latitud: -11.565,
    longitud: -77.025,
    nombre: 'I.E. María Montessori'
  },
  {
    tipo: 'educacion',
    id: 'IE_004',
    latitud: -11.445,
    longitud: -76.895,
    nombre: 'I.E. San José'
  }
];

const DATOS_SALUD: DataPoint[] = [
  {
    tipo: 'salud',
    id: 'EESS_001',
    latitud: -11.535,
    longitud: -76.985,
    nombre: 'Centro de Salud Casma'
  },
  {
    tipo: 'salud',
    id: 'EESS_002',
    latitud: -11.475,
    longitud: -76.935,
    nombre: 'Posta Médica San José'
  },
  {
    tipo: 'salud',
    id: 'EESS_003',
    latitud: -11.575,
    longitud: -77.015,
    nombre: 'Hospital Regional'
  }
];

const DATOS_POBLACION: DataPoint[] = [
  {
    tipo: 'poblacion',
    id: 'CP_001',
    latitud: -11.515,
    longitud: -76.965,
    nombre: 'Centro Poblado Las Flores'
  },
  {
    tipo: 'poblacion',
    id: 'CP_002',
    latitud: -11.545,
    longitud: -76.995,
    nombre: 'Asentamiento El Progreso'
  },
  {
    tipo: 'poblacion',
    id: 'CP_003',
    latitud: -11.465,
    longitud: -76.945,
    nombre: 'Urbanización Los Jardines'
  },
  {
    tipo: 'poblacion',
    id: 'CP_004',
    latitud: -11.505,
    longitud: -76.955,
    nombre: 'Pueblo Joven Esperanza'
  }
];

const getMarkerColor = (tipo: string) => {
  switch (tipo) {
    case 'causalidad': return '#dc2626'; // Red para OEFA
    case 'educacion': return '#059669'; // Green  
    case 'salud': return '#2563eb'; // Blue
    case 'poblacion': return '#7c3aed'; // Purple
    default: return '#6b7280'; // Gray
  }
};

const getMarkerIcon = (tipo: string) => {
  switch (tipo) {
    case 'causalidad': return '🔬';
    case 'educacion': return '🏫';
    case 'salud': return '🏥';
    case 'poblacion': return '🏘️';
    default: return '📍';
  }
};

export default function InteractiveMapHackathon({ 
  data, 
  centerLat, 
  centerLng, 
  radius, 
  selectedInforme,
  selectedTipoMuestreo,
  fechaInicio,
  fechaFin,
  showRadius
}: InteractiveMapHackathonProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  // 🎯 LÓGICA DE FILTRADO PARA EL FLUJO PERFECTO
  const getAllData = () => {
    let allData: DataPoint[] = [];
    
    // PASO 1: Mostrar solo causalidad si está seleccionada
    if (selectedTipoMuestreo === 'causalidad') {
      allData = [...DATOS_CAUSALIDAD];
    }
    
    // PASO 2: Agregar otros tipos solo cuando se active el slider (radius < 50)
    if (showRadius && radius < 50) {
      allData = [...allData, ...DATOS_EDUCACION, ...DATOS_SALUD, ...DATOS_POBLACION];
    }
    
    return allData;
  };

  const getFilteredData = () => {
    let filteredData = getAllData();
    
    // Filtro por fechas (PASO 2 del flujo)
    if (fechaInicio && fechaFin) {
      filteredData = filteredData.filter(point => {
        if (!point.fecha_muestra) return true; // Mantener datos sin fecha
        const fechaPunto = new Date(point.fecha_muestra);
        const fechaIni = new Date(fechaInicio);
        const fechaFinal = new Date(fechaFin);
        return fechaPunto >= fechaIni && fechaPunto <= fechaFinal;
      });
    }
    
    // Filtro por ID_INFORME (PASO 3 del flujo)
    if (selectedInforme && selectedInforme !== 'all') {
      filteredData = filteredData.filter(point => 
        point.id_informe === selectedInforme || point.id === selectedInforme
      );
    }
    
    // Filtro por radio (PASO 4 del flujo - solo cuando showRadius es true)
    if (showRadius) {
      filteredData = filteredData.filter(point => {
        const distance = calculateDistance(centerLat, centerLng, point.latitud, point.longitud);
        return distance <= radius;
      });
    }
    
    return filteredData;
  };

  useEffect(() => {
    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map('map-hackathon').setView([centerLat, centerLng], 7);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors | OEFA Radar Hídrico'
      }).addTo(mapRef.current);

      markersRef.current = L.layerGroup().addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && markersRef.current) {
      // Clear existing markers
      markersRef.current.clearLayers();
      
      // Clear existing circle
      if (circleRef.current) {
        mapRef.current.removeLayer(circleRef.current);
        circleRef.current = null;
      }

      const filteredData = getFilteredData();

      // Add markers for filtered data
      filteredData.forEach((point) => {
        const color = getMarkerColor(point.tipo);
        const icon = getMarkerIcon(point.tipo);

        const divIcon = L.divIcon({
          html: `<div style="
            background: ${color};
            color: white;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          ">${icon}</div>`,
          className: 'custom-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const popupContent = `
          <div class="popup-content" style="font-family: Inter, sans-serif; min-width: 280px;">
            <div style="background: ${color}; color: white; padding: 10px; margin: -8px -8px 12px; border-radius: 6px 6px 0 0;">
              <h3 style="margin: 0; font-size: 16px; font-weight: bold;">${icon} ${point.tipo.toUpperCase()}</h3>
            </div>
            ${point.id_informe ? `
              <div style="margin: 8px 0; padding: 8px; background: #f8fafc; border-radius: 4px;">
                <strong>ID Informe:</strong><br>
                <code style="background: #e2e8f0; padding: 4px 6px; border-radius: 3px; font-size: 10px; word-break: break-all;">
                  ${point.id_informe}
                </code>
              </div>
            ` : ''}
            ${point.id ? `<p style="margin: 6px 0;"><strong>ID:</strong> ${point.id}</p>` : ''}
            <p style="margin: 6px 0;"><strong>Nombre:</strong> ${point.nombre}</p>
            ${point.parametro ? `<p style="margin: 6px 0;"><strong>Parámetro:</strong> ${point.parametro}</p>` : ''}
            ${point.fecha_muestra ? `<p style="margin: 6px 0;"><strong>Fecha Muestra:</strong> ${point.fecha_muestra}</p>` : ''}
            <p style="margin: 6px 0;"><strong>Coordenadas:</strong> ${point.latitud.toFixed(6)}, ${point.longitud.toFixed(6)}</p>
            ${showRadius ? `<p style="margin: 6px 0; color: #059669;"><strong>Distancia:</strong> ${calculateDistance(centerLat, centerLng, point.latitud, point.longitud).toFixed(2)} km del centro</p>` : ''}
          </div>
        `;

        const marker = L.marker([point.latitud, point.longitud], { icon: divIcon })
          .bindPopup(popupContent);

        markersRef.current?.addLayer(marker);
      });

      // Si hay un informe seleccionado, centrar el mapa en él
      if (selectedInforme && selectedInforme !== 'all') {
        const selectedPoint = filteredData.find(point => 
          point.id_informe === selectedInforme || point.id === selectedInforme
        );
        if (selectedPoint) {
          mapRef.current?.setView([selectedPoint.latitud, selectedPoint.longitud], 12);
        }
      }

      // Agregar círculo solo si showRadius es true
      if (showRadius && mapRef.current) {
        circleRef.current = L.circle([centerLat, centerLng], {
          radius: radius * 1000, // Convert km to meters
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          weight: 2
        }).addTo(mapRef.current);
      }
    }
  }, [centerLat, centerLng, radius, selectedInforme, selectedTipoMuestreo, fechaInicio, fechaFin, showRadius]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const filteredData = getFilteredData();
  const totalPuntos = filteredData.length;

  return (
    <div className="relative w-full h-full">
      <div id="map-hackathon" className="w-full h-full rounded-lg border shadow-lg" />
      
      {/* Estado del flujo */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border max-w-xs">
        <h4 className="font-semibold text-sm text-gray-800 mb-2">🎯 Estado del Sistema</h4>
        
        {selectedTipoMuestreo === 'causalidad' && (
          <div className="flex items-center gap-2 text-xs text-green-600 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Datos OEFA Causalidad</span>
          </div>
        )}
        
        {selectedTipoMuestreo === 'none' && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span>Seleccionar tipo de muestreo</span>
          </div>
        )}
        
        {(fechaInicio && fechaFin) && (
          <div className="flex items-center gap-2 text-xs text-blue-600 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>Filtro por fechas activo</span>
          </div>
        )}
        
        {selectedInforme && selectedInforme !== 'all' && (
          <div className="flex items-center gap-2 text-xs text-purple-600 mb-1">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span>ID específico</span>
          </div>
        )}
        
        {showRadius && (
          <div className="flex items-center gap-2 text-xs text-orange-600 mb-1">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span>Radio: {radius} km</span>
          </div>
        )}
        
        <div className="pt-2 border-t border-gray-200 mt-2">
          <span className="text-xs font-medium text-gray-700">
            📍 {totalPuntos} punto{totalPuntos !== 1 ? 's' : ''} visible{totalPuntos !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      {/* Leyenda dinámica */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border p-3">
        <div className="text-xs font-semibold text-gray-800 mb-2">🗺️ LEYENDA</div>
        <div className="space-y-1">
          {selectedTipoMuestreo === 'causalidad' && (
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span>🔬 Evaluación Causalidad</span>
            </div>
          )}
          {showRadius && (
            <>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                <span>🏫 Centros Educativos</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span>🏥 Centros de Salud</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                <span>🏘️ Centros Poblados</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}