'use client';
import { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import dynamic from 'next/dynamic';

// Importar el componente del mapa dinámicamente para evitar errores de SSR
const InteractiveMap = dynamic(() => import('../components/InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando mapa...</p>
      </div>
    </div>
  )
});

export default function MapaInteractivo() {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('01/04/2024 – 23/04/2024');
  const [selectedReport, setSelectedReport] = useState<string>('all');
  const [searchRadius, setSearchRadius] = useState<number>(20);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Image
                src="/OEFA.png"
                alt="OEFA Logo"
                width={60}
                height={60}
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-800">RADAR DE RIESGO HÍDRICO</h1>
                <p className="text-sm text-gray-600">Mapa Interactivo</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-600 hover:text-green-600 transition-colors">
                Inicio
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-green-600 transition-colors">
                Dashboard
              </Link>
              <Link href="/mapa" className="text-green-600 font-semibold">
                Mapa Interactivo
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Panel de Control */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3">
            <div className="dashboard-card h-full overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Panel de Control</h2>
              
              {/* Filtros */}
              <div className="space-y-6">
                {/* Ubicación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">UBICACIÓN:</label>
                  <select 
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="all">Selecciona...</option>
                    <option value="champaran">Champaran</option>
                    <option value="lunacasma">Lunacasma</option>
                    <option value="lanuarca">Lanuarca</option>
                    <option value="sunamar">Sunamar</option>
                    <option value="chuchumas">Chuchumas</option>
                    <option value="noel">Noel</option>
                  </select>
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">FECHA</label>
                  <input
                    type="text"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* ID Informe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ID_INFORME</label>
                  <select 
                    value={selectedReport}
                    onChange={(e) => setSelectedReport(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="all">Selecciona...</option>
                    <option value="report_1">INF-2024-001</option>
                    <option value="report_2">INF-2024-002</option>
                    <option value="report_3">INF-2024-003</option>
                  </select>
                </div>

                {/* Radio de búsqueda */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Radio de búsqueda: {searchRadius} KM
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Botones */}
                <div className="space-y-3">
                  <button className="w-full gradient-oefa text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-all">
                    APLICAR FILTROS
                  </button>
                  <button className="w-full bg-yellow-400 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-yellow-500 transition-all">
                    LIMPIAR
                  </button>
                </div>
              </div>

              {/* Leyenda */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Leyenda</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                    <span className="text-sm text-gray-700">Centro Poblado</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-700">Centro Educativo</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-700">Centro de Salud</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-700">Muestra</span>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">IRH (Indicador de Riesgo Hídrico)</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Bajo</span>
                      <div className="w-8 h-2 bg-green-500 rounded"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Medio</span>
                      <div className="w-8 h-2 bg-yellow-400 rounded"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Alto</span>
                      <div className="w-8 h-2 bg-orange-500 rounded"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Muy Alto</span>
                      <div className="w-8 h-2 bg-red-600 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mapa */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9">
            <div className="dashboard-card h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Mapa de Riesgo Hídrico</h3>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Coordenadas: -11.525°, -76.975°</span>
                </div>
              </div>
              
              <div className="h-[calc(100%-4rem)] rounded-lg overflow-hidden">
                <InteractiveMap 
                  searchRadius={searchRadius}
                  selectedLocation={selectedLocation}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}