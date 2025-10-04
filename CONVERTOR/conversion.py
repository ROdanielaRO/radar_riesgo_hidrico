# -*- coding: utf-8 -*-
"""
latlon_to_utm.py
----------------

Uso rápido:
    from latlon_to_utm import latlon_a_utm

    # AQUÍ entregas tus parámetros:
    resultado = latlon_a_utm(lat=-12.046374, lon=-77.042793)  # Lima (18S)
    print(resultado)
"""

from __future__ import annotations  

import math  
from dataclasses import dataclass  
from typing import Optional  


from pyproj import CRS, Transformer  


@dataclass  # Estructura simple para devolver el resultado ordenado
class UTM:
    easting: float         # Coordenada Este (metros)
    northing: float        # Coordenada Norte (metros)
    zone_number: int       # Número de zona UTM (1..60)
    hemisphere: str        # 'N' (Norte) o 'S' (Sur)
    zone_letter: str       # Banda latitudinal UTM (C..X; útil para validaciones)
    epsg: int              # Código EPSG de la proyección usada (ej. 32718 = WGS84/UTM 18S)
    datum: str             # Datum destino (por defecto WGS84)
    # Recomendación: guarda también el CRS si lo necesitas (no imprescindible para el radar)


def _normaliza_lon(lon: float) -> float:
    """
    Normaliza la longitud a [-180, 180].
    Esto evita problemas si te llega, por ejemplo, 181 o -190 grados.
    """
    # Convierte cualquier valor a rango [-180, 180] mediante aritmética modular
    return ((float(lon) + 180.0) % 360.0) - 180.0


def _valida_lat_lon(lat: float, lon: float) -> tuple[float, float]:
    """
    Valida que lat esté en [-90, 90]; normaliza lon a [-180, 180].
    Lanza ValueError si lat es inválida.
    """
    # Intentamos convertir a float por si llegan strings tipo " -12.3 "
    lat = float(lat)
    lon = float(lon)
    # Verificamos rango válido para latitud
    if not (-90.0 <= lat <= 90.0):
        raise ValueError(f"Latitude fuera de rango [-90, 90]: {lat}")
    # Normalizamos longitud para evitar casos extremos
    lon = _normaliza_lon(lon)
    return lat, lon


def _utm_zone_from_lon(lon: float) -> int:
    """
    Calcula la zona UTM según la longitud.
    Fórmula estándar: floor((lon + 180) / 6) + 1; con caso borde lon=180 -> 60.
    """
    # Normalizamos primero para asegurar que lon esté en [-180, 180]
    lon = _normaliza_lon(lon)
    
    if lon == 180.0:
        return 60
    # Cálculo general
    return int(math.floor((lon + 180.0) / 6.0)) + 1


def _utm_band_from_lat(lat: float) -> str:
    """
    Devuelve la banda UTM (C..X) según latitud.
    UTM aplica entre ~80°S y 84°N; fuera de eso, no hay banda (UPS).
    """
    # Cadena de bandas UTM oficiales (sin I ni O); X llega hasta 84°N
    bands = "CDEFGHJKLMNPQRSTUVWX"
    # Si la latitud está fuera de los límites UTM, levantamos un error claro
    if lat < -80.0 or lat > 84.0:
        raise ValueError("Latitud fuera de rango UTM (usar UPS): debe estar entre ~80°S y 84°N")
    # Índice entero en la cadena, cada banda abarca 8 grados
    idx = int(math.floor((lat + 80.0) / 8.0))
    # Aseguramos límites por redondeos extremos (84° → 'X')
    idx = max(0, min(idx, len(bands) - 1))
    return bands[idx]


def _epsg_for_utm(zone_number: int, hemisphere: str, datum: str = "WGS84") -> int:
    """
    Devuelve el EPSG correspondiente a la zona UTM y hemisferio para el datum indicado.
    - WGS84 Norte: 326## ; WGS84 Sur: 327## (## es la zona)
    - Nota: si algún día necesitas PSAD56 (Perú antiguo), zonas 17S:24877, 18S:24878, 19S:24879
    """
    # Normalizamos texto de datum y hemisferio
    datum = datum.upper()
    hemisphere = hemisphere.upper()

    # Validamos zona
    if not (1 <= zone_number <= 60):
        raise ValueError(f"Zona UTM inválida: {zone_number} (debe estar entre 1 y 60)")

    # Soportamos WGS84 que es el estándar moderno
    if datum == "WGS84":
        # Hemisferio norte → 326## ; sur → 327##
        if hemisphere == "N":
            return 32600 + zone_number
        elif hemisphere == "S":
            return 32700 + zone_number
        else:
            raise ValueError(f"Hemisferio inválido: {hemisphere} (usar 'N' o 'S')")

    # Si requieres PSAD56, descomenta y maneja según tus datos reales
    # if datum == "PSAD56":
    #     mapping = {17: 24877, 18: 24878, 19: 24879}
    #     if hemisphere != "S" or zone_number not in mapping:
    #         raise ValueError("PSAD56 aquí se limita a zonas 17S/18S/19S.")
    #     return mapping[zone_number]

    # Si llega un datum no soportado, avisamos explícitamente
    raise ValueError(f"Datum no soportado: {datum}. Usa 'WGS84'.")


def latlon_a_utm(*, lat: float, lon: float, datum: str = "WGS84", force_zone: Optional[int] = None) -> UTM:
    """
    FUNCIÓN PRINCIPAL QUE USARÁS.
    ------------------------------------------------
    🔹 Dónde recibe tus parámetros:
        - `lat`: latitud en grados decimales (WGS84).
        - `lon`: longitud en grados decimales (WGS84).
      (Se pasan SIEMPRE como argumentos nombrados: lat=..., lon=...)

    🔹 Qué hace:
        1) Valida/normaliza lat y lon.
        2) Determina hemisferio y zona UTM (o usa `force_zone` si la fijas).
        3) Obtiene el EPSG correcto (por defecto WGS84).
        4) Proyecta (lon, lat) → (easting, northing) con pyproj/PROJ.
        5) Devuelve un objeto UTM con toda la info útil.

    🔹 Parámetros:
        - lat (float): Latitud WGS84.
        - lon (float): Longitud WGS84.
        - datum (str, opcional): Datum destino; por defecto 'WGS84'.
        - force_zone (int, opcional): Forzar una zona UTM específica (útil cerca de límites).

    🔹 Retorna:
        - UTM: dataclass con easting, northing, zona, hemisferio, banda, EPSG y datum.
    """
    # 1) Validamos y normalizamos lat/lon para evitar datos sucios
    lat, lon = _valida_lat_lon(lat, lon)

    # 2) Determinamos hemisferio: N si lat >= 0, S si lat < 0
    hemisphere = 'N' if lat >= 0.0 else 'S'

    # 3) Hallamos la zona automáticamente a partir de la longitud (o usamos force_zone si lo especificaste)
    zone_number = force_zone if force_zone is not None else _utm_zone_from_lon(lon)

    # 4) Obtenemos la banda UTM a partir de la latitud (valida que la lat esté en rango UTM)
    zone_letter = _utm_band_from_lat(lat)

    # 5) Construimos el EPSG correcto para el CRS UTM objetivo
    epsg = _epsg_for_utm(zone_number, hemisphere, datum=datum)

    # 6) Definimos CRS fuente (WGS84 geográfico) y destino (UTM elegido)
    crs_src = CRS.from_epsg(4326)       # EPSG 4326 = WGS84 lat/lon
    crs_dst = CRS.from_epsg(epsg)       # EPSG de la UTM específica (ej. 32718 para 18S)

    # 7) Creamos un transformador que espera (lon, lat) gracias a always_xy=True
    transformer = Transformer.from_crs(crs_src, crs_dst, always_xy=True)

    # 8) Ejecutamos la transformación -> obtenemos easting y northing en metros
    easting, northing = transformer.transform(lon, lat)

    # 9) Devolvemos un objeto UTM con todos los campos útiles para tu radar
    return UTM(
        easting=float(easting),
        northing=float(northing),
        zone_number=zone_number,
        hemisphere=hemisphere,
        zone_letter=zone_letter,
        epsg=epsg,
        datum=datum.upper(),
    )


# Ejemplo rápido si ejecutas este archivo directamente (python latlon_to_utm.py)
if __name__ == "__main__":
    # Aquí mostramos un ejemplo con Lima para que veas la salida
    ejemplo = latlon_a_utm(lat=-12.078559, lon=-76.993716)  # ACLARACIÓN: AQUÍ se pasan tus parámetros
    print(ejemplo)