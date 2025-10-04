from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import pandas as pd
import numpy as np
from math import radians, cos, sin, asin, sqrt
import pyproj
from pathlib import Path
import os
from datetime import datetime

# Configuración de la app
app = FastAPI(
    title="Radar de Riesgo Hídrico API",
    description="API para datos geoespaciales OEFA, educación y salud",
    version="1.0.0"
)

# CORS para conectar con Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache global para datasets
datasets_cache = {}
stats_cache = {}

def haversine(lon1, lat1, lon2, lat2):
    """Calcular distancia en km entre dos puntos lat/lng"""
    # Convertir grados a radianes
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    
    # Fórmula haversine
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371  # Radio de la Tierra en km
    return c * r

def utm_to_latlon(este, norte, zona):
    """Convertir coordenadas UTM a lat/lon usando método moderno"""
    try:
        # Método moderno de pyproj para evitar deprecation warning
        transformer = pyproj.Transformer.from_crs(
            f"EPSG:326{int(zona):02d}",  # UTM WGS84 Norte
            "EPSG:4326",  # WGS84 lat/lon
            always_xy=True
        )
        
        # Convertir (retorna lon, lat)
        lon, lat = transformer.transform(este, norte)
        return lat, lon
    except Exception as e:
        print(f"Error convirtiendo UTM: {e}")
        return None, None

def load_datasets():
    """Cargar y procesar todos los datasets"""
    global datasets_cache, stats_cache
    
    if datasets_cache:  # Ya están cargados
        return
    
    data_path = Path(__file__).parent.parent / "DATAFINAL"
    
    print("🔄 Cargando datasets...")
    
    # 1. DATOS DE EDUCACIÓN
    try:
        df_edu = pd.read_csv(data_path / "educacion_procesado.csv")
        # Ya tiene latitud, longitud
        df_edu = df_edu.dropna(subset=['latitud', 'longitud'])
        datasets_cache['educacion'] = df_edu
        print(f"✅ Educación: {len(df_edu):,} registros")
    except Exception as e:
        print(f"❌ Error cargando educación: {e}")
        datasets_cache['educacion'] = pd.DataFrame()
    
    # 2. DATOS DE SALUD  
    try:
        df_salud = pd.read_csv(data_path / "salud_procesado.csv")
        print(f"📋 Salud columnas: {list(df_salud.columns)}")
        
        # IMPORTANTE: El CSV tiene las columnas invertidas! 
        # longitud,latitud pero los valores están intercambiados
        if 'longitud' in df_salud.columns and 'latitud' in df_salud.columns:
            # Intercambiar las columnas porque están mal etiquetadas
            df_salud['lat_temp'] = df_salud['longitud']
            df_salud['lng_temp'] = df_salud['latitud'] 
            df_salud['latitud'] = df_salud['lat_temp']
            df_salud['longitud'] = df_salud['lng_temp']
            df_salud = df_salud.drop(['lat_temp', 'lng_temp'], axis=1)
            
        df_salud = df_salud.dropna(subset=['latitud', 'longitud'])
        datasets_cache['salud'] = df_salud
        print(f"✅ Salud: {len(df_salud):,} registros (coordenadas corregidas)")
    except Exception as e:
        print(f"❌ Error cargando salud: {e}")
        datasets_cache['salud'] = pd.DataFrame()
    
        # 3. DATOS DE POBLACIÓN (CENTROS POBLADOS)
    try:
        df_poblacion = pd.read_csv(data_path / "poblacion_procesado.csv")
        print(f"📋 Población columnas: {list(df_poblacion.columns)}")
        
        # El dataset tiene longitud, latitud (en ese orden)
        if 'longitud' in df_poblacion.columns and 'latitud' in df_poblacion.columns:
            df_poblacion = df_poblacion.dropna(subset=['longitud', 'latitud'])
            datasets_cache['poblacion'] = df_poblacion
            print(f"✅ Población: {len(df_poblacion):,} registros")
        else:
            print(f"⚠️ Población: No se encontraron columnas longitud/latitud")
            datasets_cache['poblacion'] = pd.DataFrame()
    except Exception as e:
        print(f"❌ Error cargando población: {e}")
        datasets_cache['poblacion'] = pd.DataFrame()
    
    # 4. DATOS OEFA - Cargar todos los tipos
    oefa_files = [
        "oefa_agua_residual_efluentes.csv",
        "oefa_agua_subterranea.csv", 
        "oefa_agua_superficial.csv",
        "oefa_evaluacion_causalidad.csv",
        "oefa_evaluacion_temprana.csv",
        "oefa_suelo_sedimento.csv"
    ]
    
    oefa_combined = []
    
    for file in oefa_files:
        try:
            file_path = data_path / file
            if file_path.exists():
                print(f"🔄 Procesando {file}...")
                df = pd.read_csv(file_path)
                
                # Procesar coordenadas UTM a lat/lon
                if 'ESTE' in df.columns and 'NORTE' in df.columns and 'ZONA' in df.columns:
                    print(f"   Convirtiendo {len(df)} registros UTM a lat/lon...")
                    
                    # Convertir UTM a lat/lon de manera más eficiente
                    coords_converted = []
                    conversion_errors = 0
                    
                    for i, row in df.iterrows():
                        try:
                            este, norte, zona = row['ESTE'], row['NORTE'], row['ZONA']
                            if pd.notna(este) and pd.notna(norte) and pd.notna(zona):
                                lat, lon = utm_to_latlon(este, norte, zona)
                                if lat and lon:
                                    coords_converted.append({'latitud': lat, 'longitud': lon})
                                else:
                                    coords_converted.append({'latitud': None, 'longitud': None})
                                    conversion_errors += 1
                            else:
                                coords_converted.append({'latitud': None, 'longitud': None})
                                conversion_errors += 1
                        except Exception as e:
                            coords_converted.append({'latitud': None, 'longitud': None})
                            conversion_errors += 1
                    
                    coords_df = pd.DataFrame(coords_converted)
                    df = pd.concat([df, coords_df], axis=1)
                    
                    print(f"   ✅ Convertido: {len(df) - conversion_errors} registros exitosos")
                    if conversion_errors > 0:
                        print(f"   ⚠️ Errores de conversión: {conversion_errors}")
                        
                elif 'latitud' in df.columns and 'longitud' in df.columns:
                    print(f"   ✅ Ya tiene coordenadas lat/lng: {len(df)} registros")
                    # Ya tiene coordenadas en formato correcto
                    pass
                else:
                    print(f"   ⚠️ No se encontraron coordenadas válidas en {file}")
                    continue
                # Agregar tipo de dataset
                df['tipo_oefa'] = file.replace('.csv', '').replace('oefa_', '')
                
                # Solo agregar registros con coordenadas válidas
                df_with_coords = df.dropna(subset=['latitud', 'longitud'])
                if len(df_with_coords) > 0:
                    oefa_combined.append(df_with_coords)
                    print(f"   ✅ {file}: {len(df_with_coords):,} registros con coordenadas válidas")
                else:
                    print(f"   ⚠️ {file}: Sin registros con coordenadas válidas")
                
        except Exception as e:
            print(f"❌ Error cargando {file}: {e}")
    
    # Combinar todos los OEFA
    if oefa_combined:
        df_oefa = pd.concat(oefa_combined, ignore_index=True)
        df_oefa = df_oefa.dropna(subset=['latitud', 'longitud'])
        datasets_cache['oefa'] = df_oefa
        print(f"✅ OEFA Total: {len(df_oefa):,} registros")
    else:
        datasets_cache['oefa'] = pd.DataFrame()
    
    # Calcular estadísticas
    stats_cache = {
        'total_puntos_oefa': len(datasets_cache['oefa']),
        'total_centros_educacion': len(datasets_cache['educacion']),
        'total_centros_salud': len(datasets_cache['salud']),
        'total_centros_poblacion': len(datasets_cache['poblacion']),
        'ultimo_update': datetime.now().isoformat()
    }
    
    print("🎯 Datasets cargados correctamente!")

@app.on_event("startup")
async def startup_event():
    """Cargar datos al iniciar la API"""
    load_datasets()

@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "message": "🚀 Radar de Riesgo Hídrico API",
        "version": "1.0.0",
        "status": "online",
        "datasets_loaded": len(datasets_cache) > 0
    }

@app.get("/api/stats")
async def get_stats():
    """Obtener estadísticas generales"""
    if not stats_cache:
        raise HTTPException(status_code=503, detail="Datasets no cargados")
    
    return stats_cache

@app.get("/api/mapa/puntos")
async def get_puntos_mapa(
    centro_lat: float = Query(..., description="Latitud del centro"),
    centro_lng: float = Query(..., description="Longitud del centro"),
    radio_km: int = Query(20, description="Radio en kilómetros"),
    tipos: str = Query("oefa,educacion,salud,poblacion", description="Tipos separados por coma"),
    ubicacion: Optional[str] = Query(None, description="Filtro por ubicación"),
    limit: int = Query(1000, description="Límite de resultados")
):
    """
    🎯 ENDPOINT PRINCIPAL: Obtener puntos dentro de un radio
    
    Este es el endpoint que tu slider va a llamar en tiempo real
    """
    if not datasets_cache:
        raise HTTPException(status_code=503, detail="Datasets no cargados")
    
    tipos_lista = [t.strip() for t in tipos.split(",")]
    puntos_resultado = []
    conteos = {}
    
    # Procesar cada tipo de dato solicitado
    for tipo in tipos_lista:
        if tipo not in datasets_cache:
            continue
            
        df = datasets_cache[tipo]
        if df.empty:
            conteos[tipo] = 0
            continue
        
        # Calcular distancias usando haversine (vectorizado para mejor performance)
        if len(df) > 0:
            # Usar numpy para cálculos vectorizados más rápidos
            lats = df['latitud'].values
            lngs = df['longitud'].values
            
            # Convertir a radianes
            lat1_rad = np.radians(centro_lat)
            lng1_rad = np.radians(centro_lng)
            lat2_rad = np.radians(lats)
            lng2_rad = np.radians(lngs)
            
            # Fórmula haversine vectorizada
            dlat = lat2_rad - lat1_rad
            dlng = lng2_rad - lng1_rad
            a = np.sin(dlat/2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(dlng/2)**2
            c = 2 * np.arcsin(np.sqrt(a))
            distancias = c * 6371  # Radio de la Tierra en km
            
            df_copy = df.copy()
            df_copy['distancia_km'] = distancias
        else:
            df_copy = df.copy()
            df_copy['distancia_km'] = []
        
        # Filtrar por radio
        df_filtrado = df_copy[df_copy['distancia_km'] <= radio_km]
        
        # Filtro adicional por ubicación (si se especifica)
        if ubicacion:
            columnas_ubicacion = ['departamento', 'provincia', 'distrito']
            for col in columnas_ubicacion:
                if col in df_filtrado.columns:
                    df_filtrado = df_filtrado[
                        df_filtrado[col].str.contains(ubicacion, case=False, na=False)
                    ]
                    break
        
        # Limitar resultados por tipo
        df_filtrado = df_filtrado.nsmallest(limit//len(tipos_lista), 'distancia_km')
        conteos[tipo] = len(df_filtrado)
        
        # Convertir a formato estándar
        for _, row in df_filtrado.iterrows():
            # Obtener nombre según el tipo de dataset
            if tipo == 'educacion':
                nombre = str(row.get('nombre_institucion', 'Centro Educativo'))
            elif tipo == 'salud':
                nombre = str(row.get('nombre_establecimiento', 'Centro de Salud'))
            elif tipo == 'poblacion':
                nombre = str(row.get('nombre_centro_poblado', 'Centro Poblado'))
            elif tipo == 'oefa':
                nombre = f"Punto OEFA - {str(row.get('PUNTO_MUESTREO', 'Monitoreo'))}"
            else:
                nombre = f"Punto {tipo}"
            
            # Generar ID único según tipo
            if tipo == 'educacion':
                punto_id = str(row.get('codigo_modular', f"edu_{len(puntos_resultado)}"))
            elif tipo == 'salud':
                punto_id = str(row.get('codigo_unico', f"salud_{len(puntos_resultado)}"))
            elif tipo == 'poblacion':
                punto_id = str(row.get('id_centro_poblado', f"pob_{len(puntos_resultado)}"))
            elif tipo == 'oefa':
                punto_id = str(row.get('ID_INFORME', f"oefa_{len(puntos_resultado)}"))
            else:
                punto_id = f"{tipo}_{len(puntos_resultado)}"
            
            punto = {
                "id": punto_id,
                "tipo": tipo,
                "latitud": float(row['latitud']),
                "longitud": float(row['longitud']),
                "distancia_km": round(row['distancia_km'], 2),
                "nombre": nombre,
                "ubicacion": str(row.get('departamento', '')) + ", " + str(row.get('provincia', ''))
            }
            
            # Información específica por tipo
            if tipo == 'educacion':
                punto['info_especifica'] = {
                    "nivel_modalidad": str(row.get('nivel_modalidad', '')),
                    "gestion": str(row.get('gestion', '')),
                    "area_censal": str(row.get('area_censal', ''))
                }
            elif tipo == 'salud':
                punto['info_especifica'] = {
                    "tipo_establecimiento": str(row.get('tipo_establecimiento', '')),
                    "categoria": str(row.get('categoria', '')),
                    "estado": str(row.get('estado', ''))
                }
            elif tipo == 'poblacion':
                punto['info_especifica'] = {
                    "departamento": str(row.get('departamento', '')),
                    "provincia": str(row.get('provincia', '')),
                    "distrito": str(row.get('distrito', ''))
                }
            elif tipo == 'oefa':
                punto['info_especifica'] = {
                    "tipo_oefa": str(row.get('tipo_oefa', '')),
                    "fecha_muestra": str(row.get('FECHA_MUESTRA', '')),
                    "parametro": str(row.get('PARAMETRO', ''))
                }
            
            puntos_resultado.append(punto)
    
    return {
        "puntos": puntos_resultado,
        "total": len(puntos_resultado),
        "tipos_count": conteos,
        "filtros_aplicados": {
            "centro": {"lat": centro_lat, "lng": centro_lng},
            "radio_km": radio_km,
            "tipos": tipos_lista,
            "ubicacion": ubicacion
        }
    }

@app.get("/api/punto/{tipo}/{punto_id}")
async def get_detalle_punto(tipo: str, punto_id: str):
    """Obtener detalles específicos de un punto"""
    if not datasets_cache or tipo not in datasets_cache:
        raise HTTPException(status_code=404, detail="Tipo de dato no encontrado")
    
    df = datasets_cache[tipo]
    
    # Buscar el punto según el tipo
    if tipo == 'educacion':
        punto = df[df['codigo_modular'].astype(str) == punto_id]
    elif tipo == 'salud':
        punto = df[df['codigo_unico'].astype(str) == punto_id]
    elif tipo == 'oefa':
        punto = df[df['ID_INFORME'].astype(str) == punto_id]
    else:
        raise HTTPException(status_code=400, detail="Tipo no válido")
    
    if punto.empty:
        raise HTTPException(status_code=404, detail="Punto no encontrado")
    
    row = punto.iloc[0]
    
    return {
        "id": punto_id,
        "tipo": tipo,
        "nombre": str(row.get('nombre_institucion', row.get('nombre_establecimiento', 'Punto OEFA'))),
        "coordenadas": {
            "latitud": float(row['latitud']),
            "longitud": float(row['longitud'])
        },
        "info_completa": row.to_dict()
    }

@app.get("/api/filtros/opciones")
async def get_opciones_filtros():
    """Obtener opciones disponibles para filtros"""
    if not datasets_cache:
        raise HTTPException(status_code=503, detail="Datasets no cargados")
    
    opciones = {
        "ubicaciones": [],
        "tipos": ["oefa", "educacion", "salud", "poblacion"],
        "total_registros": sum(len(df) for df in datasets_cache.values())
    }
    
    # Recopilar ubicaciones únicas
    ubicaciones_set = set()
    for df in datasets_cache.values():
        if 'departamento' in df.columns:
            ubicaciones_set.update(df['departamento'].dropna().unique())
    
    opciones["ubicaciones"] = sorted(list(ubicaciones_set))
    
    return opciones

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)