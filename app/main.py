# app/main.py
from fastapi import FastAPI, File, UploadFile, APIRouter
from app.controllers import item_controller
from fastapi.middleware.cors import CORSMiddleware  # Add this import


app = FastAPI(title="FastAPI MVC Sample")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL here
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include the item routes
app.include_router(item_controller.router, prefix="/file", tags=["files"])

# Optional: Root endpoint for a friendly greeting
@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI MVC Sample!"}
