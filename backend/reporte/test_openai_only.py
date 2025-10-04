#!/usr/bin/env python3
"""
Prueba de EdHack solo con OpenAI (sin base de datos)
Para verificar que la integración con GPT funciona correctamente
"""
import asyncio
import os
import sys
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


async def test_openai_integration():
    """Prueba la integración con OpenAI"""
    print("🤖 PRUEBA DE INTEGRACIÓN CON OPENAI")
    print("=" * 50)

    try:
        # Importar cliente de OpenAI
        from ai.openai_client import openai_client

        # 1. Prueba de conexión básica
        print("1. Probando conexión básica...")
        is_connected = await openai_client.test_connection()

        if not is_connected:
            print("❌ No se pudo conectar a OpenAI")
            return False

        print("✅ Conexión exitosa!")

        # 2. Generar un reporte OEFA usando el método dedicado
        print("\n2. Generando reporte OEFA usando generate_oefa_report...")
        report_data = {
            "Pesticidas.organoclorados": 0.25,
            "Pesticidas.Organofosforados": 0.05,
            "PARAMETRO": "DDT",
            "TXUBIGEO": "Lima",
            "TXZONA": "17S",
            "COORD_ESTE": 288000.0,
            "COORD_NORTE": 8665000.0,
        }

        result = await openai_client.generate_oefa_report(
            report_data=report_data, max_tokens=600, temperature=0.2
        )

        print("✅ Texto generado:")
        print("-" * 40)
        print(result["content"])
        print("-" * 40)
        print(f"📊 Tokens usados: {result['usage']['total_tokens']}")
        print(f"🕒 Tiempo: {result['execution_time']:.2f}s")
        print(f"🤖 Modelo: {result['model']}")

        # 3. Generar preguntas sobre el texto
        print("\n3. Generando preguntas de comprensión...")

        questions_prompt = f"""
        Basado en el siguiente  sobre los océanos, crea 3 preguntas de comprensión. Incluye una mezcla de preguntas abiertas y de opción múltiple.
        
        TEXTO:
        {result['content']}
        
        Crea las preguntas en este formato JSON:
        {{
            "preguntas": [
                {{
                    "pregunta": "¿Cuál es la idea principal?",
                    "tipo": "abierta",
                    "respuesta_esperada": "Los océanos son importantes porque..."
                }},
                {{
                    "pregunta": "¿Qué característica se menciona sobre los océanos?",
                    "tipo": "opcion_multiple", 
                    "opciones": ["A) Son salados", "B) Son dulces", "C) Son pequeños"],
                    "respuesta_correcta": "A"
                }}
            ]
        }}
        """

        questions_result = await openai_client.generate_completion(
            prompt=questions_prompt,
            system_message="Eres un experto en crear preguntas educativas precisas.",
            max_tokens=500,
            temperature=0.6,
        )

        print("✅ Preguntas generadas:")
        print("-" * 40)
        print(questions_result["content"])
        print("-" * 40)
        print(f"📊 Tokens usados: {questions_result['usage']['total_tokens']}")

        # 4. Simular evaluación de respuesta
        print("\n4. Simulando evaluación de respuesta...")

        student_answer = "Los océanos son muy grandes y contienen agua salada. Son importantes para el clima."

        evaluation_prompt = f"""
        Evalúa esta respuesta de estudiante:
        
        PREGUNTA: "¿Cuál es la importancia de los océanos?"
        RESPUESTA DEL ESTUDIANTE: "{student_answer}"
        
        Proporciona una evaluación en este formato JSON:
        {{
            "puntaje": 85,
            "es_correcta": true,
            "comentarios": "Muy buena respuesta que demuestra comprensión...",
            "areas_mejora": ["Podría añadir más detalles sobre..."]
        }}
        """

        eval_result = await openai_client.generate_completion(
            prompt=evaluation_prompt,
            system_message="Eres un evaluador educativo justo y constructivo.",
            max_tokens=300,
            temperature=0.3,
        )

        print("✅ Evaluación generada:")
        print("-" * 40)
        print(eval_result["content"])
        print("-" * 40)

        # 5. Resumen de la prueba
        print("\n🎉 RESUMEN DE LA PRUEBA")
        print("=" * 30)
        print("✅ Conexión a OpenAI: FUNCIONANDO")
        print("✅ Generación de contenido: FUNCIONANDO")
        print("✅ Creación de preguntas: FUNCIONANDO")
        print("✅ Evaluación automática: FUNCIONANDO")

        total_tokens = (
            result["usage"]["total_tokens"]
            + questions_result["usage"]["total_tokens"]
            + eval_result["usage"]["total_tokens"]
        )

        print(f"\n📊 Total de tokens usados: {total_tokens}")
        print(f"🤖 Modelo utilizado: {result['model']}")

        return True

    except Exception as e:
        print(f"❌ Error en la prueba: {e}")
        import traceback

        traceback.print_exc()
        return False


async def interactive_test():
    """Prueba interactiva con el usuario"""
    print("\n" + "=" * 60)
    print("🎮 PRUEBA INTERACTIVA")
    print("=" * 60)

    try:
        from ai.openai_client import openai_client

        while True:
            print("\n¿Qué quieres probar?")
            print("1. Generar texto educativo personalizado")
            print("2. Crear preguntas sobre un tema")
            print("3. Evaluar una respuesta")
            print("4. Conversación educativa")
            print("5. Salir")

            choice = input("\nSelecciona una opción (1-5): ").strip()

            if choice == "1":
                tema = input("Ingresa un tema educativo: ").strip()
                nivel = input("Nivel (básico/intermedio/avanzado): ").strip()

                prompt = f"Crea un texto educativo sobre {tema} para nivel {nivel}. Debe ser interesante, claro y de aproximadamente 150 palabras."

                print("\n🤖 Generando...")
                result = await openai_client.generate_completion(
                    prompt=prompt,
                    system_message="Eres un educador experto que adapta contenido al nivel del estudiante.",
                    max_tokens=400,
                )

                print("✅ Texto generado:")
                print("-" * 50)
                print(result["content"])
                print("-" * 50)

            elif choice == "2":
                tema = input("Tema para las preguntas: ").strip()
                num = input("Número de preguntas (1-5): ").strip()

                prompt = f"Crea {num} preguntas educativas sobre {tema}. Incluye tanto preguntas abiertas como de opción múltiple."

                print("\n🤖 Creando preguntas...")
                result = await openai_client.generate_completion(
                    prompt=prompt,
                    system_message="Eres un experto en crear preguntas educativas variadas y efectivas.",
                    max_tokens=600,
                )

                print("✅ Preguntas creadas:")
                print("-" * 50)
                print(result["content"])
                print("-" * 50)

            elif choice == "3":
                pregunta = input("Pregunta: ").strip()
                respuesta = input("Respuesta del estudiante: ").strip()

                prompt = f"""
                Evalúa esta respuesta de estudiante:
                
                PREGUNTA: {pregunta}
                RESPUESTA: {respuesta}
                
                Proporciona una evaluación constructiva con puntaje (0-100) y comentarios.
                """

                print("\n🤖 Evaluando...")
                result = await openai_client.generate_completion(
                    prompt=prompt,
                    system_message="Eres un evaluador educativo comprensivo y constructivo.",
                    max_tokens=300,
                )

                print("✅ Evaluación:")
                print("-" * 50)
                print(result["content"])
                print("-" * 50)

            elif choice == "4":
                print("💬 Conversación educativa (escribe 'salir' para terminar)")
                messages = [
                    {
                        "role": "system",
                        "content": "Eres un tutor educativo amigable y paciente. Ayudas a los estudiantes a aprender de manera interactiva.",
                    }
                ]

                while True:
                    user_input = input("\nTú: ").strip()
                    if user_input.lower() == "salir":
                        break

                    messages.append({"role": "user", "content": user_input})

                    result = await openai_client.chat_conversation(
                        messages, max_tokens=300
                    )
                    response = result["content"]

                    print(f"🤖 Tutor: {response}")
                    messages.append({"role": "assistant", "content": response})

            elif choice == "5":
                break
            else:
                print("❌ Opción inválida")

    except Exception as e:
        print(f"❌ Error en prueba interactiva: {e}")


async def main():
    """Función principal"""
    print("🚀 INICIANDO PRUEBAS DE EDHACK - SOLO OPENAI")
    print("=" * 60)

    # Verificar configuración
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY no configurada en .env")
        return

    print(f"✅ API Key configurada: {api_key[:10]}...")
    print(f"✅ Modelo: {os.getenv('OPENAI_MODEL', 'gpt-4o-mini')}")

    # Ejecutar pruebas
    success = await test_openai_integration()

    if success:
        print("\n🎉 ¡Todas las pruebas pasaron exitosamente!")

        # Ofrecer prueba interactiva
        choice = (
            input("\n¿Quieres hacer una prueba interactiva? (s/n): ").strip().lower()
        )
        if choice == "s":
            await interactive_test()
    else:
        print("\n❌ Algunas pruebas fallaron. Revisa la configuración.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 ¡Prueba terminada!")
    except Exception as e:
        print(f"\n❌ Error fatal: {e}")
