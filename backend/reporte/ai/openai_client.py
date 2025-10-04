"""
Cliente mejorado para OpenAI con soporte para modelos avanzados
"""

import asyncio
import logging
import time
from typing import Dict, List, Optional, Any
from openai import OpenAI, AsyncOpenAI
from config import Config

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OpenAIClient:
    """Cliente mejorado para interactuar con la API de OpenAI"""

    def __init__(self):
        """Inicializa el cliente de OpenAI con la forma moderna"""
        try:
            Config.validate()
            # Cliente síncrono y asíncrono (lee automáticamente OPENAI_API_KEY)
            self.client = AsyncOpenAI()
            self.sync_client = OpenAI()
            self.model = Config.OPENAI_MODEL
            logger.info(f"Cliente OpenAI inicializado con modelo: {self.model}")
        except Exception as e:
            logger.error(f"Error al inicializar cliente OpenAI: {e}")
            raise

    async def test_connection(self) -> bool:
        """Prueba la conexión con OpenAI usando la forma moderna"""
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",  # Usar modelo más estable para test
                messages=[{"role": "user", "content": "Responde solo: OK"}],
                max_tokens=10,
            )
            logger.info("Prueba de conexión a OpenAI exitosa")
            return True
        except Exception as e:
            logger.error(f"Error en prueba de conexión OpenAI: {e}")
            return False

    def test_connection_sync(self) -> bool:
        """Prueba síncrona de la conexión con OpenAI"""
        try:
            response = self.sync_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": "Test"}],
                max_tokens=5,
                timeout=5,  # 5 segundos timeout
            )
            logger.info("Prueba síncrona de conexión a OpenAI exitosa")
            return True
        except Exception as e:
            logger.error(f"Error en prueba síncrona OpenAI: {e}")
            return False

    async def generate_completion(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Genera una completación usando ChatGPT

        Args:
            prompt (str): El prompt del usuario
            system_message (str, optional): Mensaje del sistema para contexto
            max_tokens (int): Máximo número de tokens
            temperature (float): Creatividad de la respuesta (0-1)
            model (str, optional): Modelo específico a usar

        Returns:
            Dict: Respuesta con contenido, tiempo y metadatos
        """
        start_time = time.time()

        try:
            messages = []

            if system_message:
                messages.append({"role": "system", "content": system_message})

            messages.append({"role": "user", "content": prompt})

            response = await self.client.chat.completions.create(
                model=model or self.model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )

            end_time = time.time()
            execution_time = end_time - start_time

            result = {
                "content": response.choices[0].message.content,
                "model": response.model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                },
                "execution_time": execution_time,
                "timestamp": time.time(),
            }

            logger.info(f"Completación generada exitosamente en {execution_time:.2f}s")
            return result

        except Exception as e:
            logger.error(f"Error al generar completación: {e}")
            raise

    async def generate_quiz_questions(
        self, topic: str, num_questions: int = 3, difficulty: str = "medio"
    ) -> Dict[str, Any]:
        """
        Genera preguntas de quiz sobre un tema específico

        Args:
            topic (str): Tema del quiz
            num_questions (int): Número de preguntas
            difficulty (str): Dificultad (fácil, medio, difícil)

        Returns:
            Dict: Preguntas generadas con respuestas
        """
        system_message = f"""
        Eres un experto educador que crea preguntas de quiz educativas.
        Genera {num_questions} preguntas de nivel {difficulty} sobre {topic}.
        
        Formato de respuesta (JSON):
        {{
            "topic": "{topic}",
            "difficulty": "{difficulty}",
            "questions": [
                {{
                    "question": "¿Pregunta aquí?",
                    "options": ["A) Opción 1", "B) Opción 2", "C) Opción 3", "D) Opción 4"],
                    "correct_answer": "A",
                    "explanation": "Explicación de por qué es correcta"
                }}
            ]
        }}
        """

        prompt = f"Genera un quiz de {num_questions} preguntas sobre {topic} con nivel de dificultad {difficulty}."

        return await self.generate_completion(
            prompt=prompt,
            system_message=system_message,
            max_tokens=2000,
            temperature=0.8,
        )

    async def generate_oefa_report(
        self,
        report_data: Dict[str, Any],
        model: Optional[str] = None,
        max_tokens: int = 2000,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        """
        Genera un reporte ejecutivo para OEFA a partir de los datos en `report_data`.

        report_data: diccionario con claves esperadas:
          - 'Pesticidas.organoclorados'
          - 'Pesticidas.Organofosforados'
          - 'PARAMETRO'
          - 'TXUBIGEO'
          - 'TXZONA'
          - 'COORD_ESTE'
          - 'COORD_NORTE'

        La función construye el prompt institucional (texto en español, sin tablas),
        pide la comparación con el límite OMS (0.1 mg/L), solicita clasificación de
        riesgo (Bajo/Medio/Alto según factor de exceso) y recomendaciones prácticas.
        """

        # Normalizar y extraer valores del input
        p_oc = report_data.get("Pesticidas.organoclorados") or report_data.get(
            "Pesticidas.Organoclorados"
        )
        p_of = report_data.get("Pesticidas.Organofosforados") or report_data.get(
            "Pesticidas.organofosforados"
        )
        parametro = report_data.get("PARAMETRO", "No especificado")
        txubigeo = report_data.get("TXUBIGEO", "No especificado")
        txzona = report_data.get("TXZONA", "No especificado")
        coord_este = report_data.get("COORD_ESTE")
        coord_norte = report_data.get("COORD_NORTE")

        system_message = (
            "Eres un redactor técnico experto en evaluación ambiental y normativas peruanas. "
            "Genera un reporte ejecutivo para el Organismo de Evaluación y Fiscalización Ambiental (OEFA) del Perú. "
            "El reporte debe usar un léxico ejecutivo y técnico, evitar tablas visibles y presentarse en texto corrido con tono formal y preciso. "
            "Incluye los apartados: Título y encabezado institucional; Información general del muestreo; "
            "Interpretación técnica de resultados (comparar con límites de la OMS y normas peruanas); Evaluación del riesgo ambiental; "
            "Conclusiones técnicas; Recomendaciones de gestión ambiental; Marco normativo de referencia. "
            "Compara los valores con el límite de referencia de la OMS para pesticidas (0.1 mg/L) y clasifica el nivel de riesgo como Bajo, Medio o Alto según la magnitud del exceso. "
            "Finaliza con recomendaciones concretas de monitoreo, remediación y fiscalización. "
            "Responde únicamente en español."
        )

        # Construir prompt con los datos de muestreo pasados
        prompt_lines: List[str] = [
            "Genera el reporte ejecutivo para OEFA usando los siguientes datos de muestreo:",
            f"Parámetro analizado: {parametro}.",
            f"Pesticidas organoclorados (mg/L): {p_oc if p_oc is not None else 'No proporcionado'}.",
            f"Pesticidas organofosforados (mg/L): {p_of if p_of is not None else 'No proporcionado'}.",
            f"Ubicación (TXUBIGEO): {txubigeo}.",
            f"Zona UTM: {txzona}.",
            f"Coordenadas UTM - Este: {coord_este if coord_este is not None else 'No proporcionado'}, Norte: {coord_norte if coord_norte is not None else 'No proporcionado'}.",
            "Convierte las coordenadas UTM a latitud/longitud y explícitalas en el apartado de información general.",
            "Compara cada valor con el límite OMS de 0.1 mg/L para pesticidas y con las normas peruanas aplicables; indica claramente si excede y por cuánto (factor o diferencia absoluta).",
            "Clasifica el riesgo ambiental por sitio (Bajo, Medio, Alto) en función de la magnitud del exceso: Bajo (<=2×Límite), Medio (>2× y <=10×), Alto (>10×).",
            "Incluye recomendaciones concretas de monitoreo, remediación y acciones de fiscalización específicas para OEFA.",
        ]

        prompt = "\n".join(prompt_lines)

        return await self.generate_completion(
            prompt=prompt,
            system_message=system_message,
            max_tokens=max_tokens,
            temperature=temperature,
            model=model,
        )

    async def chat_conversation(
        self, messages: List[Dict[str, str]], max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """
        Mantiene una conversación con múltiples mensajes

        Args:
            messages (List[Dict]): Lista de mensajes con rol y contenido
            max_tokens (int): Máximo número de tokens

        Returns:
            Dict: Respuesta de la conversación
        """
        start_time = time.time()

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.7,
            )

            end_time = time.time()

            result = {
                "content": response.choices[0].message.content,
                "model": response.model,
                "usage": response.usage.__dict__,
                "execution_time": end_time - start_time,
                "timestamp": time.time(),
            }

            logger.info("Conversación procesada exitosamente")
            return result

        except Exception as e:
            logger.error(f"Error en conversación: {e}")
            raise


# Instancia global del cliente
openai_client = OpenAIClient()
