'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PuntoMapa {
  id: string;
  tipo: 'oefa' | 'educacion' | 'salud' | 'poblacion';
  latitud: number;
  longitud: number;
  distancia_km: number;
  nombre: string;
  ubicacion: string;
  info_especifica: Record<string, any>;
}

interface InteractiveMapProps {
  searchRadius: number;
  selectedLocation: string;
  puntos: PuntoMapa[];
  loading: boolean;
  error: string | null;
  centroMapa: { lat: number; lng: number };
}

// Función para obtener color según tipo de punto
const getColorByType = (tipo: string) => {
  switch (tipo) {
    case 'oefa':
      return '#dc2626'; // Rojo para puntos OEFA (monitoreo ambiental)
    case 'educacion':
      return '#2563eb'; // Azul para centros educativos
    case 'salud':
      return '#16a34a'; // Verde para centros de salud
    case 'poblacion':
      return '#7c3aed'; // Púrpura para centros poblados
    default:
      return '#6b7280'; // Gris por defecto
  }
};

// Función para obtener icono según tipo
const getIconByType = (tipo: string) => {
  switch (tipo) {
    case 'oefa':
      return '🔬'; // Icono de laboratorio para OEFA
    case 'educacion':
      return '🏫'; // Icono de escuela
    case 'salud':
      return '🏥'; // Icono de hospital
    case 'poblacion':
      return '🏘️'; // Icono de comunidad para población
    default:
      return '📍'; // Pin por defecto
  }
};

export default function InteractiveMap({ 
  searchRadius, 
  selectedLocation, 
  puntos, 
  loading, 
  error, 
  centroMapa 
}: InteractiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Inicializar mapa solo una vez
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [centroMapa.lat, centroMapa.lng],
        zoom: 11,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true
      });

      // Capa de mapa base
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(mapRef.current);

      // Grupo de marcadores
      markersRef.current = L.layerGroup().addTo(mapRef.current);
    }

    return () => {
      // Limpiar al desmontar
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [centroMapa]);

  // Actualizar círculo de radio
  useEffect(() => {
    if (!mapRef.current) return;

    // Remover círculo anterior
    if (radiusCircleRef.current) {
      mapRef.current.removeLayer(radiusCircleRef.current);
    }

    // Crear nuevo círculo
    radiusCircleRef.current = L.circle([centroMapa.lat, centroMapa.lng], {
      radius: searchRadius * 1000, // convertir km a metros
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      weight: 2,
      dashArray: '5, 5'
    }).addTo(mapRef.current);

  }, [searchRadius, centroMapa]);

  // Actualizar marcadores basados en puntos de la API
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    // Limpiar marcadores existentes
    markersRef.current.clearLayers();

    // Mostrar indicador de carga
    if (loading) {
      const loadingMarker = L.marker([centroMapa.lat, centroMapa.lng])
        .bindPopup('🔄 Cargando puntos...', { autoClose: false })
        .openPopup();
      markersRef.current.addLayer(loadingMarker);
      return;
    }

    // Mostrar error si existe
    if (error) {
      const errorMarker = L.marker([centroMapa.lat, centroMapa.lng])
        .bindPopup(`❌ Error: ${error}`, { autoClose: false })
        .openPopup();
      markersRef.current.addLayer(errorMarker);
      return;
    }

    // Crear marcadores para cada punto
    puntos.forEach((punto) => {
      const color = getColorByType(punto.tipo);
      const icon = getIconByType(punto.tipo);

      // Crear marcador personalizado
      const customIcon = L.divIcon({
        html: `
          <div style="
            background-color: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            position: relative;
          ">
            ${icon}
          </div>
        `,
        className: 'custom-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
      });

      // Crear contenido del popup
      const popupContent = `
        <div style="min-width: 250px; max-width: 300px;">
          <div style="
            background: linear-gradient(135deg, ${color}, ${color}dd);
            color: white;
            padding: 12px;
            margin: -8px -8px 12px -8px;
            border-radius: 8px;
            font-weight: 600;
          ">
            ${icon} ${punto.nombre}
          </div>
          
          <div style="margin-bottom: 8px;">
            <strong>Tipo:</strong> ${punto.tipo.toUpperCase()}
          </div>
          
          <div style="margin-bottom: 8px;">
            <strong>Ubicación:</strong> ${punto.ubicacion}
          </div>
          
          <div style="margin-bottom: 8px;">
            <strong>Distancia:</strong> ${punto.distancia_km} km
          </div>
          
          ${punto.info_especifica ? Object.entries(punto.info_especifica)
            .slice(0, 3)
            .map(([key, value]) => `
              <div style="margin-bottom: 4px; font-size: 0.9em;">
                <strong>${key.replace(/_/g, ' ')}:</strong> ${value}
              </div>
            `).join('') : ''}
          
          <div style="
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px solid #e5e7eb;
            font-size: 0.8em;
            color: #6b7280;
          ">
            ID: ${punto.id}
          </div>
        </div>
      `;

      // Crear y añadir marcador
      const marker = L.marker([punto.latitud, punto.longitud], { icon: customIcon })
        .bindPopup(popupContent, {
          maxWidth: 300,
          className: 'custom-popup'
        });

      markersRef.current!.addLayer(marker);
    });

    // Ajustar vista si hay puntos
    if (puntos.length > 0) {
      const layers = Array.from(markersRef.current.getLayers()) as L.Layer[];
      const group = L.featureGroup(layers);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }

  }, [puntos, loading, error, centroMapa]);

  return (
    <div className="relative w-full h-full">
      {/* Contenedor del mapa */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full rounded-xl border border-gray-200 shadow-sm"
        style={{ minHeight: '500px' }}
      />
      
      {/* Indicadores de estado */}
      {loading && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-700">Cargando puntos...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-4 left-4 bg-red-50 border border-red-200 px-3 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-red-600 text-sm">⚠️</span>
            <span className="text-sm font-medium text-red-700">Error: {error}</span>
          </div>
        </div>
      )}
      
      {/* Contador de puntos */}
      {!loading && !error && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              📍 {puntos.length} puntos en vista
            </span>
          </div>
        </div>
      )}
      
      {/* Leyenda de tipos */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border p-3">
        <div className="text-xs font-semibold text-gray-800 mb-2">LEYENDA</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span>🔬 Puntos OEFA</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span>🏫 Centros Educativos</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span>🏥 Centros de Salud</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-purple-600"></div>
            <span>🏘️ Centros Poblados</span>
          </div>
        </div>
      </div>
    </div>
  );
}