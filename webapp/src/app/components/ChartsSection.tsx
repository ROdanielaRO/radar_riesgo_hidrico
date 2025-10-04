'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Datos simulados basados en tus archivos CSV
const riskTrendData = [
  { month: 'Ene', riesgo: 65, alertas: 12 },
  { month: 'Feb', riesgo: 72, alertas: 15 },
  { month: 'Mar', riesgo: 68, alertas: 9 },
  { month: 'Abr', riesgo: 78, alertas: 18 },
  { month: 'May', riesgo: 82, alertas: 22 },
  { month: 'Jun', riesgo: 75, alertas: 16 },
];

const locationRiskData = [
  { name: 'Champaran', bajo: 5, medio: 8, alto: 2 },
  { name: 'Lunacasma', bajo: 3, medio: 6, alto: 4 },
  { name: 'Lanuarca', bajo: 7, medio: 4, alto: 1 },
  { name: 'Sunamar', bajo: 6, medio: 5, alto: 2 },
  { name: 'Chuchumas', bajo: 4, medio: 3, alto: 1 },
];

const riskDistributionData = [
  { name: 'Riesgo Bajo', value: 45, color: '#22c55e' },
  { name: 'Riesgo Medio', value: 35, color: '#fbbf24' },
  { name: 'Riesgo Alto', value: 15, color: '#f97316' },
  { name: 'Riesgo Muy Alto', value: 5, color: '#dc2626' },
];

const waterQualityData = [
  { parameter: 'pH', valor: 7.2, limite: 7.5, estado: 'Normal' },
  { parameter: 'Turbidez', valor: 8.5, limite: 10, estado: 'Normal' },
  { parameter: 'Coliformes', valor: 45, limite: 50, estado: 'Alerta' },
  { parameter: 'Metales Pesados', valor: 12, limite: 15, estado: 'Normal' },
  { parameter: 'DBO5', valor: 18, limite: 20, estado: 'Alerta' },
];

export default function ChartsSection() {
  return (
    <div className="space-y-6">
      {/* Gráficos de Tendencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia de Riesgo */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tendencia de Riesgo Hídrico</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={riskTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="riesgo" 
                stroke="#22c55e" 
                strokeWidth={3}
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Alertas por Mes */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Alertas Generadas</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={riskTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Bar dataKey="alertas" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribución de Riesgo y Calidad del Agua */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de Riesgo */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución de Niveles de Riesgo</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={riskDistributionData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {riskDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Calidad del Agua */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Parámetros de Calidad del Agua</h3>
          <div className="space-y-3">
            {waterQualityData.map((param, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-800">{param.parameter}</span>
                  <div className="text-sm text-gray-600">
                    Valor: {param.valor} | Límite: {param.limite}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  param.estado === 'Normal' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {param.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Riesgo por Ubicación */}
      <div className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución de Riesgo por Ubicación</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={locationRiskData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Bar dataKey="bajo" stackId="a" fill="#22c55e" name="Riesgo Bajo" />
            <Bar dataKey="medio" stackId="a" fill="#fbbf24" name="Riesgo Medio" />
            <Bar dataKey="alto" stackId="a" fill="#ef4444" name="Riesgo Alto" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}