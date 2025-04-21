# app/controllers/item_controller.py

import asyncio
import tempfile
from fastapi import Form
from fastapi import FastAPI, WebSocket
from fastapi.responses import FileResponse
from fastapi.responses import HTMLResponse
from transformers import MarianMTModel, MarianTokenizer
from fastapi import File, UploadFile, APIRouter, HTTPException


router = APIRouter()
active_websockets = {}


# Helper to structure each block into a JSON object
def load_json(index: str, timestamps: str, text: str) -> dict:
    return {
        "index": index,
        "timestamps": timestamps,
        "text": text
    }
def percentage_cal(iterate, lent):
  return round((iterate / lent) * 100, 1) 

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

# Upload endpoint
@router.post("/uploadfile/")
async def create_upload_file(file: UploadFile, session_id: str  = Form(...)):
    try:
        data = await file.read()
        json_data = convert_json(data.decode('utf-8'))  # Decode bytes to string
        if not json_data:
            raise HTTPException(status_code=400, detail="Invalid or empty file format.")
        
        websocket = None
        for _ in range(30):
            websocket = active_websockets.get(session_id)
            if websocket:
                break
            await asyncio.sleep(0.1)
        if not websocket:
            raise HTTPException(status_code=400, detail="WebSocket not connected for this session.")

        for idx, item in enumerate(json_data):
            try:
                translated_text = translate_model(item["text"])
                item['translated'] = translated_text
            except Exception as e:
                print(f"Error while translating index {item.get('index')}: {e}")
                item['translated'] = "[Translation Failed]"
            percentage = percentage_cal(idx+1, len(json_data))
            await websocket.send_text(f"Progress: {percentage}%")
            await asyncio.sleep(0.01)

    
        srt_content = ""
        for item in json_data:
            index = item["index"]
            timestamps = item["timestamps"]
            text = item["translated"]
            srt_content += f"{index}\n{timestamps}\n{text}\n\n"
        
        with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".srt") as tmp:
            tmp.write(srt_content)
            tmp_path = tmp.name
            
        await websocket.send_text("Translation complete.")
        #Return file as downloadable response
        return FileResponse(tmp_path, filename="translated_output.srt", media_type="application/x-subrip")

    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
       

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    active_websockets[session_id] = websocket
    try:
        while True:
            await asyncio.sleep(1)  # keep connection alive
    except:
        pass
    finally:
        active_websockets.pop(session_id, None)

