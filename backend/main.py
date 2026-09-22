from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import bcrypt
import os
import json
from google import genai
from dotenv import load_dotenv

import models
from database import engine, SessionLocal

models.Base.metadata.create_all(bind=engine)

# Load .env from the project root (two levels up from this file: backend/ -> project root)
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_PROJECT_ROOT, ".env"))
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

app = FastAPI()

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UserCreate(BaseModel):
    username: str
    password: str

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Securely hash password
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), salt).decode('utf-8')
    
    new_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully"}

@app.post("/login")
def login(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    # Verify password
    if not bcrypt.checkpw(user.password.encode('utf-8'), db_user.hashed_password.encode('utf-8')):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
        
    return {"message": "Login successful", "username": db_user.username}

class IdeaRequest(BaseModel):
    text: str

@app.post("/analyze_idea")
def analyze_idea(request: IdeaRequest):
    text = request.text
    if not text.strip():
        raise HTTPException(status_code=400, detail="Idea cannot be empty")
        
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        feedback = []
        words = len(text.split())
        if words < 5:
            feedback.append({"type": "warning", "text": "(Mock AI) Your post is very short. Longer posts usually drive more meaningful comments."})
        elif words > 50:
            feedback.append({"type": "warning", "text": "(Mock AI) Your post is quite long. Consider breaking it up."})
        else:
            feedback.append({"type": "positive", "text": "(Mock AI) Good length! It falls into the optimal range."})
            
        if "#" in text:
            feedback.append({"type": "positive", "text": "(Mock AI) Great use of hashtags!"})
        else:
            feedback.append({"type": "neutral", "text": "(Mock AI) You didn't include any hashtags."})
            
        return {"feedback": feedback}
        
    prompt = f"""
    You are an expert social media manager. Evaluate the following social media post idea.
    Provide a list of actionable feedback items, including notes on tone, length, and hashtag usage.
    Predict engagement based on standard social media best practices.
    
    Post: "{text}"
    
    Output your response STRICTLY as a JSON array of objects. 
    Each object must have exactly two keys: "type" (one of: "positive", "neutral", "warning") and "text" (a string with the feedback).
    Example:
    [
      {{"type": "positive", "text": "Great use of hashtags!"}},
      {{"type": "warning", "text": "The tone is a bit negative, which might hurt brand image."}}
    ]
    Do not wrap the JSON in markdown code blocks. Output raw JSON only.
    """
    try:
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=prompt,
        )
        
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
            
        feedback = json.loads(response_text)
        return {"feedback": feedback}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
