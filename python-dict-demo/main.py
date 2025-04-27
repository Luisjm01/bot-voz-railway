import os
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from elevenlabs import play, PronunciationDictionaryVersionLocator

# 0) Carga tu .env
load_dotenv()
API_KEY  = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")

# 1) Inicializa el cliente
client = ElevenLabs(api_key=API_KEY)

# 2) Subir el diccionario desde el archivo
with open("dictionary.pls", "rb") as f:
    dict_res = client.pronunciation_dictionary.add_from_file(
        file=f.read(),
        name="MiDiccionarioES"
    )
dict_id     = dict_res.id
version_id  = dict_res.version_id
print("✅ Dictionary uploaded:", dict_id, "version:", version_id)

# 3) Genera dos audios para comparar:
#    A) Sin diccionario
audio1 = client.generate(
    text="Sin diccionario: tomate",
    voice=VOICE_ID,
    model="eleven_turbo_v2",
)
play(audio1)

#    B) Con diccionario (usando el locator)
audio2 = client.generate(
    text="Con diccionario: tomate",
    voice=VOICE_ID,
    model="eleven_turbo_v2",
    pronunciation_dictionary_locators=[
        PronunciationDictionaryVersionLocator(
            pronunciation_dictionary_id=dict_id,
            version_id=version_id,
        )
    ],
)
play(audio2)
