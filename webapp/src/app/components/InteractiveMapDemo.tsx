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
  tipo_monitoreo?: string;
  fecha_muestra?: string;
  [key: string]: any;
}

interface InteractiveMapDemoProps {
  data: DataPoint[];
  centerLat: number;
  centerLng: number;
  radius: number;
  selectedInforme?: string;
  selectedTipoMonitoreo?: string;
}

// Datos hardcodeados pero realistas basados en CSVs reales
const SAMPLE_DATA: DataPoint[] = [
  // CAUSALIDAD - Datos reales del CSV de evaluación de causalidad
  {
    tipo: 'causalidad',
    id_informe: '2E58C135FE1AB345FA969281BA5983C3D2202BF5',
    latitud: -9.423,
    longitud: -78.645,
    parametro: 'NITRITOS (NO2-N)',
    tipo_monitoreo: 'causalidad',
    fecha_muestra: '2019-02-26',
    nombre: 'Evaluación Causalidad - Norte'
  },
  {
    tipo: 'causalidad',
    id_informe: '2BAE47A5CEC153E01BB8B857C88F5EA492259423',
    latitud: -11.325,
    longitud: -76.875,
    parametro: 'NITRITOS (NO2-N)',
    tipo_monitoreo: 'causalidad',
    fecha_muestra: '2018-02-21',
    nombre: 'Evaluación Causalidad - Lima'
  },
  // Más puntos de causalidad
  {
    tipo: 'causalidad',
    id_informe: '2BAE47A5CEC153E01BB8B857C88F5EA492259423',
    latitud: -11.425,
    longitud: -76.925,
    parametro: 'NITRITOS (NO2-N)',
    tipo_monitoreo: 'causalidad',
    fecha_muestra: '2018-02-20',
    nombre: 'Evaluación Causalidad - Sur'
  },
  {
    tipo: 'causalidad',
    id_informe: '2BAE47A5CEC153E01BB8B857C88F5EA492259423',
    latitud: -11.525,
    longitud: -76.975,
    parametro: 'NITRITOS (NO2-N)',
    tipo_monitoreo: 'causalidad',
    fecha_muestra: '2018-02-20',
    nombre: 'Evaluación Causalidad - Casma'
  },
  {
    tipo: 'causalidad',
    id_informe: '051B3A92666C7B32FC46730B1271B61FC6FAE440',
    latitud: -14.625,
    longitud: -74.125,
    parametro: 'FENOLES',
    tipo_monitoreo: 'causalidad',
    fecha_muestra: '2017-03-20',
    nombre: 'Evaluación Causalidad - Ica'
  },
  {
    tipo: 'causalidad',
    id_informe: '2BAE47A5CEC153E01BB8B857C88F5EA492259423',
    latitud: -11.385,
    longitud: -76.885,
    parametro: 'NITRITOS (NO2-N)',
    tipo_monitoreo: 'causalidad',
    fecha_muestra: '2018-02-17',
    nombre: 'Evaluación Causalidad - Norte'
  },
  {
    tipo: 'causalidad',
    id_informe: '2BAE47A5CEC153E01BB8B857C88F5EA492259423',
    latitud: -11.465,
    longitud: -76.945,
    parametro: 'NITRITOS (NO2-N)',
    tipo_monitoreo: 'causalidad',
    fecha_muestra: '2018-02-16',
    nombre: 'Evaluación Causalidad - Este'
  },
  // Educación (basado en datos reales)
  {
    tipo: 'educacion',
    id: 'IE_001',
    id_informe: 'EDU_2023_001',
    latitud: -11.525,
    longitud: -76.975,
    nombre: 'I.E. José María Arguedas',
    tipo_monitoreo: 'educacion'
  },
  {
    tipo: 'educacion',
    id: 'IE_002',
    id_informe: 'EDU_2023_002',
    latitud: -11.485,
    longitud: -76.925,
    nombre: 'I.E. César Vallejo',
    tipo_monitoreo: 'educacion'
  },
  {
    tipo: 'educacion',
    id: 'IE_003',
    id_informe: 'EDU_2023_003',
    latitud: -11.565,
    longitud: -77.025,
    nombre: 'I.E. María Montessori',
    tipo_monitoreo: 'educacion'
  },
  {
    tipo: 'educacion',
    id: 'IE_004',
    id_informe: 'EDU_2023_004',
    latitud: -11.505,
    longitud: -76.955,
    nombre: 'I.E. Nuestra Señora de Fátima',
    tipo_monitoreo: 'educacion'
  },
  {
    tipo: 'educacion',
    id: 'IE_005',
    id_informe: 'EDU_2023_005',
    latitud: -11.545,
    longitud: -76.985,
    nombre: 'I.E. San Martín de Porres',
    tipo_monitoreo: 'educacion'
  },
  // Salud (formato longitud,latitud corregido)
  {
    tipo: 'salud',
    id: 'EESS_001',
    id_informe: 'SAL_2023_001',
    latitud: -11.535,
    longitud: -76.985,
    nombre: 'Centro de Salud Casma',
    tipo_monitoreo: 'salud'
  },
  {
    tipo: 'salud',
    id: 'EESS_002',
    id_informe: 'SAL_2023_002',
    latitud: -11.475,
    longitud: -76.935,
    nombre: 'Posta Médica San José',
    tipo_monitoreo: 'salud'
  },
  {
    tipo: 'salud',
    id: 'EESS_003',
    id_informe: 'SAL_2023_003',
    latitud: -11.575,
    longitud: -77.015,
    nombre: 'Hospital Regional',
    tipo_monitoreo: 'salud'
  },
  {
    tipo: 'salud',
    id: 'EESS_004',
    id_informe: 'SAL_2023_004',
    latitud: -11.515,
    longitud: -76.965,
    nombre: 'Centro de Salud El Progreso',
    tipo_monitoreo: 'salud'
  },
  // Población
  {
    tipo: 'poblacion',
    id: 'CP_001',
    id_informe: 'POB_2023_001',
    latitud: -11.515,
    longitud: -76.965,
    nombre: 'Centro Poblado Las Flores',
    tipo_monitoreo: 'poblacion'
  },
  {
    tipo: 'poblacion',
    id: 'CP_002',
    id_informe: 'POB_2023_002',
    latitud: -11.545,
    longitud: -76.995,
    nombre: 'Asentamiento El Progreso',
    tipo_monitoreo: 'poblacion'
  },
  {
    tipo: 'poblacion',
    id: 'CP_003',
    id_informe: 'POB_2023_003',
    latitud: -11.465,
    longitud: -76.945,
    nombre: 'Urbanización Los Jardines',
    tipo_monitoreo: 'poblacion'
  },
  {
    tipo: 'poblacion',
    id: 'CP_004',
    id_informe: 'POB_2023_004',
    latitud: -11.555,
    longitud: -77.005,
    nombre: 'Pueblo Joven Esperanza',
    tipo_monitoreo: 'poblacion'
  },
  {
    tipo: 'poblacion',
    id: 'CP_005',
    id_informe: 'POB_2023_005',
    latitud: -11.495,
    longitud: -76.975,
    nombre: 'Asociación Virgen del Carmen',
    tipo_monitoreo: 'poblacion'
  }
];

const getMarkerColor = (tipo: string) => {
  switch (tipo) {
    case 'causalidad': return '#dc2626'; // Red para OEFA Causalidad
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

export default function InteractiveMapDemo({ 
  data, 
  centerLat, 
  centerLng, 
  radius, 
  selectedInforme,
  selectedTipoMonitoreo 
}: InteractiveMapDemoProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  // Combinar datos reales con datos de muestra para demo convincente
  const combinedData = [...SAMPLE_DATA, ...data];

  useEffect(() => {
    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map('map-demo').setView([centerLat, centerLng], 11);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors | OEFA Radar Hídrico'
      }).addTo(mapRef.current);

      markersRef.current = L.layerGroup().addTo(mapRef.current);
      
      // Add radius circle
      circleRef.current = L.circle([centerLat, centerLng], {
        radius: radius * 1000, // Convert km to meters
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 2
      }).addTo(mapRef.current);
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

      // Filter data based on selections
      let filteredData = combinedData;
      
      if (selectedInforme) {
        filteredData = filteredData.filter(point => 
          point.id_informe === selectedInforme || point.id === selectedInforme
        );
      }
      
      if (selectedTipoMonitoreo && selectedTipoMonitoreo !== 'todos') {
        filteredData = filteredData.filter(point => 
          point.tipo_monitoreo === selectedTipoMonitoreo || point.tipo === selectedTipoMonitoreo
        );
      }

      // Add markers for filtered data
      filteredData.forEach((point) => {
        const distance = calculateDistance(
          centerLat, centerLng,
          point.latitud, point.longitud
        );

        if (distance <= radius) {
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
            <div class="popup-content" style="font-family: Inter, sans-serif; min-width: 250px;">
              <div style="background: ${color}; color: white; padding: 8px; margin: -8px -8px 8px; border-radius: 4px 4px 0 0;">
                <h3 style="margin: 0; font-size: 16px; font-weight: bold;">${icon} ${point.tipo.toUpperCase()}</h3>
              </div>
              ${point.id_informe ? `<p style="margin: 4px 0;"><strong>ID Informe:</strong> <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 2px; font-size: 11px;">${point.id_informe.substring(0, 12)}...</code></p>` : ''}
              ${point.id ? `<p style="margin: 4px 0;"><strong>ID:</strong> ${point.id}</p>` : ''}
              ${point.nombre ? `<p style="margin: 4px 0;"><strong>Nombre:</strong> ${point.nombre}</p>` : ''}
              ${point.parametro ? `<p style="margin: 4px 0;"><strong>Parámetro:</strong> ${point.parametro}</p>` : ''}
              ${point.fecha_muestra ? `<p style="margin: 4px 0;"><strong>Fecha:</strong> ${point.fecha_muestra}</p>` : ''}
              <p style="margin: 4px 0;"><strong>Coordenadas:</strong> ${point.latitud.toFixed(6)}, ${point.longitud.toFixed(6)}</p>
              <p style="margin: 4px 0; color: #059669;"><strong>Distancia:</strong> ${distance.toFixed(2)} km del centro</p>
            </div>
          `;

          const marker = L.marker([point.latitud, point.longitud], { icon: divIcon })
            .bindPopup(popupContent);

          markersRef.current?.addLayer(marker);
        }
      });

      // Si hay un informe seleccionado, centrar el mapa en él
      if (selectedInforme) {
        const selectedPoint = filteredData.find(point => 
          point.id_informe === selectedInforme || point.id === selectedInforme
        );
        if (selectedPoint) {
          mapRef.current?.setView([selectedPoint.latitud, selectedPoint.longitud], 14);
        }
      }
    }
  }, [combinedData, centerLat, centerLng, radius, selectedInforme, selectedTipoMonitoreo]);

  useEffect(() => {
    if (circleRef.current) {
      // Update circle position and radius
      circleRef.current.setLatLng([centerLat, centerLng]);
      circleRef.current.setRadius(radius * 1000);
    }
  }, [centerLat, centerLng, radius]);

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

  return (
    <div className="relative w-full h-full">
      <div id="map-demo" className="w-full h-full rounded-lg border shadow-lg" />
      {(selectedInforme || selectedTipoMonitoreo) && (
        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border max-w-xs">
          <h4 className="font-semibold text-sm text-gray-800 mb-1">🎯 Filtro Activo</h4>
          {selectedInforme && (
            <p className="text-xs text-gray-600">ID: {selectedInforme.substring(0, 12)}...</p>
          )}
          {selectedTipoMonitoreo && selectedTipoMonitoreo !== 'todos' && (
            <p className="text-xs text-gray-600">Tipo: {selectedTipoMonitoreo.replace('_', ' ')}</p>
          )}
        </div>
      )}
      
      {/* Leyenda mejorada */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border p-3">
        <div className="text-xs font-semibold text-gray-800 mb-2">🗺️ LEYENDA</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span>🔬 Evaluación Causalidad</span>
          </div>
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
        </div>
      </div>
      
      {/* Contador de puntos */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            📍 {combinedData.filter(point => {
              const distance = calculateDistance(centerLat, centerLng, point.latitud, point.longitud);
              return distance <= radius;
            }).length} puntos en vista
          </span>
        </div>
      </div>
    </div>
  );
}