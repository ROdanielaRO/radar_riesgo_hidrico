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

  // Actualizar marcadores basados en puntos de la API (OPTIMIZADO)
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

    // Limitar puntos para mejor performance (máximo 200 por tipo)
    const puntosLimitados = puntos.slice(0, 800); // Máximo 800 puntos totales
    
    // Crear marcadores en lotes para evitar bloqueo de UI
    const crearMarcadoresEnLotes = (puntos: typeof puntosLimitados, batchSize = 50) => {
      let index = 0;
      
      const procesarLote = () => {
        const lote = puntos.slice(index, index + batchSize);
        
        lote.forEach((punto) => {
          const color = getColorByType(punto.tipo);
          const icon = getIconByType(punto.tipo);

          // Crear marcador personalizado más simple para mejor performance
          const customIcon = L.divIcon({
            html: `
              <div style="
                background-color: ${color};
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
              ">
                ${icon}
              </div>
            `,
            className: 'custom-marker-optimized',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            popupAnchor: [0, -10]
          });

          // Popup más simple para mejor performance
          const popupContent = `
            <div style="min-width: 200px;">
              <div style="
                background: ${color};
                color: white;
                padding: 8px;
                margin: -8px -8px 8px -8px;
                border-radius: 6px;
                font-weight: 600;
                font-size: 14px;
              ">
                ${icon} ${punto.nombre}
              </div>
              
              <div style="margin-bottom: 6px;">
                <strong>Tipo:</strong> ${punto.tipo.toUpperCase()}
              </div>
              
              <div style="margin-bottom: 6px;">
                <strong>Ubicación:</strong> ${punto.ubicacion}
              </div>
              
              <div style="margin-bottom: 6px;">
                <strong>Distancia:</strong> ${punto.distancia_km} km
              </div>
              
              <div style="
                margin-top: 8px;
                padding-top: 6px;
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
              maxWidth: 250,
              className: 'custom-popup-optimized'
            });

          if (markersRef.current) {
            markersRef.current.addLayer(marker);
          }
        });

        index += batchSize;
        
        // Continuar con el siguiente lote si hay más puntos
        if (index < puntos.length) {
          setTimeout(procesarLote, 5); // Pequeña pausa para no bloquear UI
        } else {
          // Ajustar vista cuando se termine de cargar todo
          if (puntos.length > 0 && markersRef.current) {
            const layers = Array.from(markersRef.current.getLayers());
            if (layers.length > 0) {
              const group = L.featureGroup(layers as L.Layer[]);
              if (mapRef.current) {
                mapRef.current.fitBounds(group.getBounds().pad(0.05));
              }
            }
          }
        }
      };
      
      procesarLote();
    };

    // Iniciar procesamiento en lotes
    crearMarcadoresEnLotes(puntosLimitados);

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