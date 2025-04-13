# app/controllers/item_controller.py
from fastapi import FastAPI, File, UploadFile, APIRouter
from transformers import MarianMTModel, MarianTokenizer
import json
import os
import time


router = APIRouter()

# Dependency that creates a new database session per request.

def load_json(index, timestamps, text):
    return {
        "index": index,
        "timestamps": timestamps,
        "text": text
    }
    
def convert_json(all_data):
    blocks = all_data.strip().split('\n\n')
    result = []
    for block in blocks:
       lines = block.strip().split('\n')
       index = lines[0]
       title = lines[1]
       text = " ".join(lines[2:])
       result.append(load_json(index, title, text))
    return result

model_name = "Helsinki-NLP/opus-mt-tr-en"
tokenizer = MarianTokenizer.from_pretrained(model_name)
model = MarianMTModel.from_pretrained(model_name)

def translate_model(text):    
    inputs = tokenizer([text], return_tensors="pt", padding=True)
    translated = model.generate(**inputs)
    return tokenizer.decode(translated[0], skip_special_tokens=True)

def translate_text(text_data):
    for idx, item in enumerate(text_data):
        try:
            translated_text = translate_model(item["text"])
            item['translated'] = translated_text
        except Exception as e:
            print(f"❌ Error: {e}")
            print("⚠️ Skipping to next or retrying might be a good idea.")
    
    return text_data





@router.post("/uploadfile/")
async def create_upload_file(file: UploadFile):
    print(file.filename)
    data = await file.read()
    print(data)
    # convert_json(data.decode('utf-8'))
    json_data = convert_json(data)
    for item in json_data:
       print("Index:", item["index"])
       print("Title:", item["timestamps"])
       print("Text:", item["text"])
       # item['translated'] = translated_data[int(item["index"])-1]
       print("-----")
    translated_data = translate_text(json_data)
    return translated_data



