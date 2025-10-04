# 🌊 Radar de Riesgo Hídrico

**Sistema de monitoreo ambiental inteligente para la evaluación de riesgos en recursos hídricos**

Desarrollado para el DATATON - Hackathon de Innovación Ambiental

## 🎯 Descripción del Proyecto

El Radar de Riesgo Hídrico es una aplicación web interactiva que permite visualizar y analizar datos ambientales del OEFA (Organismo de Evaluación y Fiscalización Ambiental) para identificar zonas de riesgo en recursos hídricos del Perú.

### ✨ Características Principales

- 🗺️ **Mapa Interactivo**: Visualización geoespacial con Leaflet
- 📊 **Dashboard en Tiempo Real**: Estadísticas dinámicas y filtros avanzados
- 🎯 **Radio de Análisis**: Sistema de proximidad configurable
- 🌡️ **Termómetro de Riesgo**: Indicador visual del nivel de amenaza ambiental
- 🤖 **Reportes con IA**: Generación automática de informes técnicos
- 📈 **Múltiples Datasets**: Integración de datos de causalidad, educación, salud y población

## 🏗️ Arquitectura del Proyecto

```
radar_riesgo_hidrico/
├── backend/              # API FastAPI
│   ├── main.py          # Servidor principal
│   ├── requirements.txt # Dependencias Python
│   └── reporte/         # Sistema de reportes IA
├── webapp/              # Frontend Next.js
│   ├── src/app/         # Páginas y componentes
│   ├── package.json     # Dependencias Node.js
│   └── next.config.ts   # Configuración Next.js
├── DATAFINAL/           # Datasets CSV (no incluidos en Git)
├── NOTEBOOKS/           # Análisis exploratorio Jupyter
└── CONVERTOR/           # Scripts de procesamiento
```

## 🚀 Instrucciones de Instalación

### Prerrequisitos

- **Node.js** 18.0 o superior
- **Python** 3.8 o superior
- **Git** para clonar el repositorio

### 1. Clonar el Repositorio

```bash
git clone https://github.com/ROdanielaRO/radar_riesgo_hidrico.git
cd radar_riesgo_hidrico
```

### 2. Configurar el Backend (FastAPI)

```bash
# Navegar a la carpeta del backend
cd backend

# Crear entorno virtual (recomendado)
python -m venv venv

# Activar entorno virtual
# En macOS/Linux:
source venv/bin/activate
# En Windows:
# venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar el servidor
python main.py
```

El backend estará disponible en: `http://localhost:8000`

### 3. Configurar el Frontend (Next.js)

```bash
# Abrir una nueva terminal y navegar al frontend
cd webapp

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

El frontend estará disponible en: `http://localhost:3000`

### 4. Verificar la Instalación

1. Abre tu navegador en `http://localhost:3000`
2. Deberías ver el dashboard del Radar de Riesgo Hídrico
3. Verifica que el mapa se carga correctamente
4. Prueba los filtros y el termómetro de riesgo

## 📋 Uso de la Aplicación

### Panel de Control

1. **Filtros de Fecha**: Selecciona el rango temporal (por defecto: 2018)
2. **Tipo de Monitoreo**: Elige entre diferentes tipos de evaluación OEFA
3. **ID Informe**: Filtra por informes específicos
4. **Radio de Búsqueda**: Ajusta el área de análisis (1-100 km)

### Funcionalidades

- **Mapa Interactivo**: Visualiza puntos de monitoreo con códigos de color
- **Estadísticas en Tiempo Real**: Métricas actualizadas dinámicamente
- **Termómetro de Riesgo**: Indicador que aumenta según proximidad a centros poblados
- **Generador de Reportes**: Crea informes técnicos con IA

## 🛠️ Comandos Disponibles

### Backend
```bash
cd backend
python main.py          # Ejecutar servidor FastAPI
pip freeze > requirements.txt  # Actualizar dependencias
```

### Frontend
```bash
cd webapp
npm run dev             # Servidor de desarrollo
npm run build           # Construir para producción
npm run start           # Ejecutar versión de producción
npm run lint            # Verificar código
```

## 📊 Datasets Utilizados

El proyecto integra los siguientes datasets del OEFA:

- `oefa_evaluacion_causalidad.csv` - Evaluaciones de causalidad ambiental
- `educacion_procesado.csv` - Centros educativos
- `salud_procesado.csv` - Establecimientos de salud
- `poblacion_procesado.csv` - Centros poblados

> **Nota**: Los archivos de datos están excluidos del repositorio por su tamaño. Contacta al equipo para obtener acceso.

## 🔧 Solución de Problemas

### Error: "Module not found"
```bash
# Reinstalar dependencias
cd webapp && npm install
cd ../backend && pip install -r requirements.txt
```

### Error: "Port already in use"
```bash
# Cambiar puertos en caso de conflicto
# Backend: Modificar puerto en main.py
# Frontend: npm run dev -- -p 3001
```

### Error: Mapa no se carga
- Verifica que el backend esté ejecutándose en puerto 8000
- Confirma que no hay errores en la consola del navegador

## 👥 Equipo de Desarrollo

Desarrollado para el DATATON - Hackathon de Innovación Ambiental

## 📄 Licencia

Este proyecto fue creado para fines educativos y de competencia en el marco del DATATON.

---

**🏆 Proyecto presentado en el DATATON - Hackathon de Innovación Ambiental**

Para más información o soporte, consulta la documentación técnica incluida en los notebooks de análisis.