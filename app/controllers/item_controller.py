# app/controllers/item_controller.py
from fastapi import FastAPI, File, UploadFile, APIRouter

router = APIRouter()

# Dependency that creates a new database session per request.

def load_json(index, timestamps, text):
    return {
        "index": index,
        "timestamps": timestamps,
        "text": text
    }

@router.post("/uploadfile/")
async def create_upload_file(file: UploadFile):
    print(file.filename)
    data = await file.read()
    print(data)
    return {"filename": file.filename}



