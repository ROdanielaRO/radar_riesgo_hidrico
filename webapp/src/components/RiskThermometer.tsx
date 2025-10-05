'use client';

import React from 'react';

interface RiskThermometerProps {
  /** Valor del riesgo de 0 a 100 */
  riskValue: number;
  /** Callback cuando el valor cambia */
  onChange?: (value: number) => void;
  /** Si el termómetro es interactivo o solo de visualización */
  interactive?: boolean;
  /** Clase CSS adicional para personalización */
  className?: string;
}

/**
 * Componente de termómetro de riesgo ambiental con barra horizontal degradada
 * Muestra niveles de riesgo de verde (bajo) a rojo (crítico)
 */
export default function RiskThermometer({ 
  riskValue, 
  onChange, 
  interactive = false, 
  className = '' 
}: RiskThermometerProps) {

  /**
   * Obtiene la etiqueta de riesgo según el valor
   */
  const getRiskLabel = (value: number): string => {
    if (value <= 25) return 'Bajo';
    if (value <= 50) return 'Medio';
    if (value <= 75) return 'Alto';
    return 'Crítico';
  };

  /**
   * Obtiene el color del texto según el valor de riesgo
   */
  const getRiskColor = (value: number): string => {
    if (value <= 25) return 'text-green-600';
    if (value <= 50) return 'text-yellow-600';
    if (value <= 75) return 'text-orange-600';
    return 'text-red-600';
  };

  /**
   * Obtiene el color de fondo para la barra de progreso
   */
  const getProgressColor = (value: number): string => {
    if (value <= 25) return 'bg-green-500';
    if (value <= 50) return 'bg-yellow-500';
    if (value <= 75) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Etiqueta superior con valor y nivel */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-gray-700">
          Nivel de Riesgo
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${getRiskColor(riskValue)}`}>
            {getRiskLabel(riskValue)}
          </span>
          <span className="text-xs text-gray-500">
            ({riskValue}%)
          </span>
        </div>
      </div>

      {/* Termómetro visual */}
      <div className="relative w-full mb-4">
        {/* Barra de fondo gris */}
        <div className="h-6 w-full bg-gray-200 rounded-full border border-gray-300 shadow-inner">
          {/* Barra de progreso coloreada */}
          <div 
            className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressColor(riskValue)}`}
            style={{ width: `${Math.max(5, riskValue)}%` }}
          />
        </div>

        {/* Indicador circular que se mueve */}
        <div
          className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-400 flex items-center justify-center transition-all duration-700 ease-out z-10"
          style={{ left: `${Math.max(5, riskValue)}%` }}
        >
          <div className={`w-3 h-3 rounded-full ${getProgressColor(riskValue).replace('bg-', 'bg-')}`} />
        </div>
      </div>

      {/* Etiquetas de referencia */}
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>

      {/* Etiquetas de nivel */}
      <div className="flex justify-between text-xs font-medium">
        <span className="text-green-600">Bajo</span>
        <span className="text-yellow-600">Medio</span>
        <span className="text-orange-600">Alto</span>
        <span className="text-red-600">Crítico</span>
      </div>
    </div>
  );
}