# app/controllers/item_controller.py

from fastapi import File, UploadFile, APIRouter, HTTPException
from fastapi.responses import FileResponse
from transformers import MarianMTModel, MarianTokenizer
import tempfile


router = APIRouter()

# Helper to structure each block into a JSON object
def load_json(index: str, timestamps: str, text: str) -> dict:
    return {
        "index": index,
        "timestamps": timestamps,
        "text": text
    }

# Converts raw text to list of dicts
def convert_json(all_data: str) -> list:
    blocks = all_data.strip().split('\n\n')
    result = []
    for block in blocks:
        lines = block.strip().split('\n')
        if len(lines) < 3:
            continue  # Skip incomplete blocks
        index = lines[0]
        title = lines[1]
        text = " ".join(lines[2:])
        result.append(load_json(index, title, text))
    return result

# Load the MarianMT model and tokenizer
model_name = "Helsinki-NLP/opus-mt-tr-en"
tokenizer = MarianTokenizer.from_pretrained(model_name)
model = MarianMTModel.from_pretrained(model_name)

# Single text translation
def translate_model(text: str) -> str:
    inputs = tokenizer([text], return_tensors="pt", padding=True)
    translated = model.generate(**inputs)
    return tokenizer.decode(translated[0], skip_special_tokens=True)

# Batch translation for a list of text blocks
def translate_text(text_data: list[dict]) -> list[dict]:
    for idx, item in enumerate(text_data):
        try:
            translated_text = translate_model(item["text"])
            item['translated'] = translated_text
        except Exception as e:
            print(f"Error while translating index {item.get('index')}: {e}")
            item['translated'] = "[Translation Failed]"
    return text_data

# Upload endpoint
@router.post("/uploadfile/")
async def create_upload_file(file: UploadFile):
    try:
        data = await file.read()
        json_data = convert_json(data.decode('utf-8'))  # Decode bytes to string
        if not json_data:
            raise HTTPException(status_code=400, detail="Invalid or empty file format.")

        for item in json_data:
            print("Index:", item["index"])
            print("Title:", item["timestamps"])
            print("Text:", item["text"])
            print("-----")

        translated_data = translate_text(json_data)
        srt_content = ""
        for item in translated_data:
            index = item["index"]
            timestamps = item["timestamps"]
            text = item["translated"]
            srt_content += f"{index}\n{timestamps}\n{text}\n\n"
        
        with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".srt") as tmp:
            tmp.write(srt_content)
            tmp_path = tmp.name

        #Return file as downloadable response
        return FileResponse(tmp_path, filename="translated_output.srt", media_type="application/x-subrip")

    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
