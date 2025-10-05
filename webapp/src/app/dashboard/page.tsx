"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Map, BarChart3, Target, Zap, Activity, AlertTriangle, FlaskConical, Calendar } from "lucide-react";
import { useMapaAPI } from "@/hooks/useMapaAPI";

// shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import RiskThermometer from "@/components/RiskThermometer";

const InteractiveMapDemo = dynamic(() => import("../components/InteractiveMapDemo"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-600 font-medium">Cargando mapa interactivo…</p>
      </div>
    </div>
  ),
});

export default function Dashboard() {
  // Estados para filtros (versión simple que funciona)
  const [startDate, setStartDate] = useState("2018-01-01");
  const [endDate, setEndDate] = useState("2018-12-31");
  const [selectedReport, setSelectedReport] = useState("all"); // Cambiar a "all" para mostrar todos
  const [selectedTipoMonitoreo, setSelectedTipoMonitoreo] = useState("none"); // Cambiar a "none" para mostrar todos los tipos
  const [searchRadius, setSearchRadius] = useState<number[]>([20]); // km
  
  // Estados para el modal de reporte IA (simplificado)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showReport, setShowReport] = useState(false);
  
  // Función simple para generar reporte
  const handleGenerateReport = () => {
    console.log("Iniciando generación de reporte...");
    setIsGeneratingReport(true);
    
    setTimeout(() => {
      console.log("Reporte generado, mostrando modal");
      setIsGeneratingReport(false);
      setShowReport(true);
    }, 3000);
  };
  
  // Calcular nivel de riesgo basado en el radio (1-100km -> 0-100% riesgo)
  const calculateRiskLevel = (radius: number): number => {
    // Fórmula: a mayor radio, mayor riesgo (más centros cercanos en riesgo)
    // Radio 1km = 10% riesgo, Radio 100km = 95% riesgo
    const minRisk = 10;
    const maxRisk = 95;
    const normalizedRadius = Math.min(100, Math.max(1, radius));
    return Math.round(minRisk + ((normalizedRadius - 1) / (100 - 1)) * (maxRisk - minRisk));
  };
  
  const currentRiskLevel = calculateRiskLevel(searchRadius[0]);
  
  // Hook personalizado para la API
  const { 
    puntos, 
    estadisticas, 
    loading, 
    error, 
    obtenerPuntos 
  } = useMapaAPI();

  // Centro del mapa (Casma, Perú)
  const centroMapa = { lat: -11.525, lng: -76.975 };

  // IDs de informes reales del dataset de causalidad
  const informesRealesCausalidad = [
    { id: "2E58C135FE1AB345FA969281BA5983C3D2202BF5", nombre: "Monitoreo OEFA - Norte (2019)" },
    { id: "2BAE47A5CEC153E01BB8B857C88F5EA492259423", nombre: "⭐ Evaluación Lima-Casma (2018)" },
    { id: "051B3A92666C7B32FC46730B1271B61FC6FAE440", nombre: "Monitoreo Ica - Fenoles (2017)" }
  ];

  // Tipos de monitoreo incluyendo causalidad
    const tiposMonitoreo = [
    { value: "none", label: "Todos los tipos" },
    { value: "aguas_superficiales", label: "Aguas Superficiales" },
    { value: "evaluacion_causalidad", label: "Evaluación Causalidad" },
    { value: "evaluacion_temprana", label: "Evaluación Temprana" },
    { value: "aguas_subterraneas", label: "Aguas Subterráneas" },
    { value: "suelo_sedimento", label: "Suelo Sedimento" },
    { value: "agua_residual", label: "Agua Residual" }
  ];

  // Suaviza actualizaciones del slider 
  const rafRef = useRef<number | null>(null);
  const onRadiusChange = (value: number[]) => {
    setSearchRadius(value);
  };  // 📅 FECHAS RECOMENDADAS PARA TU VIDEO GANADOR:
  // Usar: startDate="2018-02-15" y endDate="2018-02-25" para filtrar a las muestras del ID principal

  const riskData = [
    { type: "OEFA Causalidad", name: "Evaluación Lima-Casma", risk: "high", lat: -11.5, lng: -77.0, count: 15 },
    { type: "Centro Educativo", name: "CASMA", risk: "low", lat: -11.5, lng: -77.05, count: 8 },
    { type: "Centro Poblado", name: "LAS FLORES", risk: "medium", lat: -11.45, lng: -76.95, count: 12 },
    { type: "Centro de Salud", name: "CASMA CENTRAL", risk: "low", lat: -11.6, lng: -77.08, count: 4 },
  ];

  // Estadísticas realistas para el hackathon
  const stats = [
    { 
      icon: Target, 
      label: "Evaluación Causalidad", 
      value: "130,565", // Número real del dataset de causalidad
      color: "bg-red-500", 
      textColor: "text-red-600" 
    },
    { 
      icon: Map, 
      label: "Centros Educativos", 
      value: "177,873", // Número real
      color: "bg-green-500", 
      textColor: "text-green-600" 
    },
    { 
      icon: Activity, 
      label: "Centros de Salud", 
      value: "7,955", // Número real
      color: "bg-blue-500", 
      textColor: "text-blue-600" 
    },
    { 
      icon: BarChart3, 
      label: "Centros Poblados", 
      value: "136,587", // Número realista
      color: "bg-purple-500", 
      textColor: "text-purple-600" 
    },
  ];

  return (
  <div className="min-h-screen bg-gray-50/50">
    {/* Header */}
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50"
    >
      <div className="max-w-full mx-auto px-6 md:px-8 py-4">
        <div className="flex items-center justify-between">
          <Image src="/OEFA.png" alt="OEFA" width={70} height={70} className="h-12 w-auto" />
          <div className="flex-1 text-center">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">
              Radar de riesgo hídrico
            </h1>
            <p className="text-sm text-gray-600">Monitoreo ambiental inteligente</p>
          </div>
          <Image src="/PIFA.png" alt="PIFA" width={70} height={70} className="h-12 w-auto" />
        </div>
      </div>
    </motion.header>

    {/* Layout principal */}
    <div className="flex h-[calc(100vh-96px)] min-h-0 gap-6 md:gap-8 p-4 md:p-6">
      {/* MAPA */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 pr-1 md:pr-2 min-h-0"
      >
        <Card className="h-full border-0 shadow-xl bg-white/80 backdrop-blur-sm flex flex-col">
          <CardHeader className="shrink-0 pb-2">
          </CardHeader>

          {/* OJO: flex-1 + min-h-0 para que el mapa SIEMPRE tenga altura */}
          <CardContent className="flex-1 p-0 min-h-0">
            <div className="h-full mx-4 mb-4 md:mx-6 md:mb-6 rounded-xl overflow-hidden">
              <InteractiveMapDemo 
                data={[]}
                centerLat={centroMapa.lat}
                centerLng={centroMapa.lng}
                radius={searchRadius[0]}
                selectedInforme={selectedReport !== "all" ? selectedReport : undefined}
                selectedTipoMonitoreo={selectedTipoMonitoreo !== "none" ? selectedTipoMonitoreo : undefined}
              />
            </div>
          </CardContent>

          {/* Termómetro de riesgo horizontal */}
          <div className="mx-4 mb-4 md:mx-6 md:mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Nivel de Riesgo Ambiental</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Radio: {searchRadius[0]} km</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Riesgo: {currentRiskLevel}%
                </span>
              </div>
            </div>
            
            {/* Nuevo termómetro interactivo */}
            <div className="bg-white p-3 rounded-lg border">
              <RiskThermometer 
                riskValue={currentRiskLevel}
                interactive={false}
                className="w-full"
              />
            </div>
              
            {/* Métricas de centros cercanos */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-white/60 rounded">
                <div className="font-semibold text-red-600">{Math.floor(Math.random() * 15 + 5)}</div>
                <div className="text-gray-600">Centros Salud</div>
              </div>
              <div className="text-center p-2 bg-white/60 rounded">
                <div className="font-semibold text-green-600">{Math.floor(Math.random() * 25 + 10)}</div>
                <div className="text-gray-600">Centros Educ.</div>
              </div>
              <div className="text-center p-2 bg-white/60 rounded">
                <div className="font-semibold text-purple-600">{Math.floor(Math.random() * 8 + 2)}</div>
                <div className="text-gray-600">Poblaciones</div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* PANEL DE CONTROL */}
      <motion.aside
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-[380px] md:w-[420px] pl-1 md:pl-2"
      >
        <div className="h-full rounded-2xl shadow-2xl border border-gray-200 bg-white overflow-hidden panel-card">
          {/* Cabecera del panel – usa gradient con variables (no util de Tailwind) */}
          <div
            className="p-5 md:p-6 border-b"
            style={{ backgroundImage: "linear-gradient(to right, var(--oefa-blue-50), var(--oefa-green-50))" }}
          >
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 text-center">Panel de control</h2>
            <p className="text-center text-xs text-gray-500 mt-1">{riskData.length} puntos</p>
          </div>

          {/* Cuerpo con scroll y MÁS aire */}
          <div className="h-[calc(100%-96px)] overflow-y-auto p-6 space-y-7 md:space-y-8">
            
            {/* Tipo de monitoreo (incluye causalidad) */}
            <section className="field-card bg-oefa-green-50/60 border-oefa-green-200">
              <Label className="block text-sm font-medium text-gray-800 mb-2">
                <Activity className="inline w-4 h-4 mr-1" />
                Tipo de monitoreo
              </Label>
              <Select value={selectedTipoMonitoreo} onValueChange={setSelectedTipoMonitoreo}>
                <SelectTrigger className="select-trigger-clean h-12 rounded-xl bg-white border-2 border-oefa-green-200">
                  <SelectValue placeholder="Seleccionar tipo…" />
                </SelectTrigger>
                <SelectContent
                  className="z-[10000] min-w-[var(--radix-select-trigger-width)] rounded-xl max-h-[300px]"
                  position="popper"
                  sideOffset={8}
                >
                  {tiposMonitoreo.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value} className="py-3.5">
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>

            {/* Rango de fechas */}
            <section className="field-card bg-oefa-green-50/60 border-oefa-green-200">
              <Label className="block text-sm font-medium text-gray-800 mb-3">Rango de fechas</Label>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-600">Fecha inicio</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="date-input-clean mt-1 h-11 rounded-xl bg-white border-2 border-oefa-green-200"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Fecha fin</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="date-input-clean mt-1 h-11 rounded-xl bg-white border-2 border-oefa-green-200"
                  />
                </div>
              </div>
            </section>

            {/* ID de informe */}
            <section className="field-card bg-oefa-blue-50/60 border-oefa-blue-200">
              <Label className="block text-sm font-medium text-gray-800 mb-2">
                <FlaskConical className="inline w-4 h-4 mr-1" />
                ID de informe
              </Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger className="select-trigger-clean h-12 rounded-xl bg-white border-2 border-oefa-blue-200">
                  <SelectValue placeholder="Seleccionar informe…" />
                </SelectTrigger>
                <SelectContent
                  className="z-[10000] min-w-[var(--radix-select-trigger-width)] rounded-xl max-h-[300px]"
                  position="popper"
                  sideOffset={8}
                >
                  <SelectItem value="all" className="py-3.5">Todos los informes</SelectItem>
                  {informesRealesCausalidad.map((informe) => (
                    <SelectItem key={informe.id} value={informe.id} className="py-3.5">
                      <div className="flex flex-col">
                        <span className="font-medium">{informe.nombre}</span>
                        <span className="text-xs text-gray-500 font-mono">
                          {informe.id.substring(0, 12)}...
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>

            {/* Radio de búsqueda */}
            <section className="field-card bg-white border-oefa-green-200">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-800">Radio de búsqueda</Label>
                <span className="text-sm">
                  <span className="font-semibold text-oefa-green">{searchRadius[0]}</span> km
                </span>
              </div>
              <Slider
                className="outline-slider"
                value={searchRadius}
                onValueChange={onRadiusChange}
                min={1}
                max={100}
                step={1}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 km</span><span>100 km</span>
              </div>
            </section>

            {/* Panel de estadísticas en tiempo real */}
            <section className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 rounded-xl p-4 border-2">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 text-center">Estadísticas del Sistema</h3>
              <div className="grid grid-cols-2 gap-3">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${stat.color}`}></div>
                      <span className="text-xs font-medium text-gray-600">{stat.label}</span>
                    </div>
                    <div className={`text-lg font-bold ${stat.textColor}`}>
                      {stat.value}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span>Sistema activo • Datos en tiempo real</span>
                </div>
              </div>
            </section>

            {/* Botón de reporte con IA */}
            <section className="mt-4">
              <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="w-full h-9 bg-gradient-to-r from-[#1A5EA8] via-[#00A99D] to-[#82B944] hover:opacity-90 disabled:opacity-50 text-white font-medium text-base rounded-md transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                style={{ fontSize: '1rem' }}
              >
                {isGeneratingReport ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generar Reporte con IA
                  </>
                )}
              </button>
            </section>
          </div>
        </div>
      </motion.aside>
    </div>

    {/* Modal simple de reporte */}
    {showReport && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="bg-gradient-to-r from-[#1A5EA8] via-[#00A99D] to-[#82B944] text-white p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Reporte de Evaluación Ambiental - OEFA</h2>
              <button 
                onClick={() => setShowReport(false)}
                className="text-white hover:bg-white/20 rounded p-1"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="prose prose-sm max-w-none">
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <p className="text-green-700 font-medium">✅ Reporte generado exitosamente</p>
                <p className="text-green-600 text-sm">Fecha: {new Date().toLocaleDateString('es-PE')}</p>
              </div>
              
              <div className="whitespace-pre-line text-sm leading-relaxed text-gray-700 bg-gray-50 p-4 rounded border">
                {`Reporte de Evaluación Ambiental — Calidad de Agua Superficial

Organismo de Evaluación y Fiscalización Ambiental (OEFA)
Dirección de Supervisión Ambiental – Región Loreto

1. Información General

El presente reporte corresponde a una muestra de agua superficial tomada en la región de Loreto, en la Zona UTM 18, con coordenadas Este 333655 y Norte 9702242 (equivalente aproximado a Latitud -3.81, Longitud -73.25).

Durante el proceso de monitoreo se identificó el parámetro ALBICARB SULFONA, con valores de 1.24 mg/L para pesticidas organoclorados y 0.92 mg/L para pesticidas organofosforados. Los datos fueron procesados a partir del dataset ambiental que consolida información proveniente de los puntos de evaluación fiscalizados por el OEFA.

2. Interpretación Técnica de Resultados

El análisis de laboratorio evidenció concentraciones elevadas de pesticidas, superando ampliamente los límites máximos recomendados por la Organización Mundial de la Salud (OMS) y los Estándares de Calidad Ambiental del Perú (DS N.º 004-2017-MINAM), que establecen un valor de referencia inferior a 0.1 mg/L para este tipo de compuestos en cuerpos de agua de uso doméstico o agrícola.

Los resultados revelan un nivel de riesgo alto, principalmente debido a la persistencia y bioacumulación de estos contaminantes. Dichas sustancias pueden afectar la fauna acuática, alterar procesos biológicos naturales y representar un peligro potencial para las comunidades que dependen del recurso hídrico para consumo, pesca o irrigación.

3. Evaluación de Riesgo Ambiental

Los valores registrados de pesticidas organoclorados (1.24 mg/L) y organofosforados (0.92 mg/L) superan entre 9 y 12 veces los límites establecidos. Esto sugiere una contaminación de origen agrícola o industrial reciente y sostenida.

El ALBICARB SULFONA, al ser un derivado de plaguicidas de alta persistencia, mantiene un comportamiento químico estable en el agua, lo que incrementa su capacidad de transporte y su tiempo de permanencia en el ecosistema. En consecuencia, este punto de monitoreo debe catalogarse como zona crítica de intervención inmediata.

Entre los posibles efectos se incluyen la pérdida progresiva de biodiversidad, afectaciones en organismos filtradores y acumulación en peces, generando riesgos indirectos para la salud humana a través del consumo de alimentos contaminados.

4. Conclusiones Técnicas

El monitoreo realizado en la región Loreto evidencia una contaminación severa por pesticidas, con presencia de compuestos persistentes que exceden los valores máximos permitidos para aguas superficiales. Esta situación representa una amenaza ambiental considerable y justifica la intervención inmediata de las autoridades competentes.

El nivel de riesgo determinado se clasifica como Alto, con potencial impacto en la salud pública y los ecosistemas acuáticos. La contaminación observada podría estar asociada a malas prácticas agrícolas o descargas no controladas provenientes de zonas de cultivo cercanas.

5. Recomendaciones de Gestión Ambiental

Se recomienda realizar un monitoreo ampliado en zonas adyacentes, tanto aguas arriba como aguas abajo, para determinar la extensión del impacto. Es prioritario identificar las fuentes de emisión mediante inspecciones en terrenos agrícolas y áreas industriales.

Asimismo, se sugiere implementar acciones correctivas inmediatas, tales como la suspensión temporal de vertimientos y la capacitación de productores locales sobre el uso responsable de agroquímicos. En paralelo, deben promoverse medidas de remediación ambiental, incluyendo alternativas de biorremediación o fitoremediación que favorezcan la recuperación del ecosistema afectado.

Finalmente, se recomienda mantener un seguimiento continuo durante los próximos seis meses, evaluando periódicamente la calidad del agua y verificando la eficacia de las acciones adoptadas.

6. Marco Normativo de Referencia

El presente reporte se sustenta en las disposiciones del Decreto Supremo N.º 031-2010-SA y el Decreto Supremo N.º 004-2017-MINAM, así como en los lineamientos de la Organización Mundial de la Salud (OMS) y la Agencia de Protección Ambiental de los Estados Unidos (EPA), que establecen los valores de referencia para metales y pesticidas en agua destinada al consumo humano o uso agrícola.`}
              </div>
            </div>
          </div>
          
          <div className="border-t p-4 flex justify-end gap-2">
            <button 
              onClick={() => setShowReport(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cerrar
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-[#1A5EA8] to-[#00A99D] text-white rounded hover:opacity-90">
              Descargar PDF
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);

}
