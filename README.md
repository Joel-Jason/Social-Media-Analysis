# Social Media Data Analysis System

A comprehensive web application and Python pipeline designed to analyze social media data (posts, tweets) to extract insights on sentiment, engagement, and trending topics.

## Features

1. **Dashboard UI**: A modern React-based frontend for exploring the dataset, analyzing metrics, and viewing charts.
2. **REST API**: A FastAPI backend providing endpoints for data fetching and processing.
3. **Data Processing Pipeline**:
   - Generates a realistic synthetic dataset.
   - Cleans and preprocesses data (removes URLs, emojis, handles missing values).
   - Performs sentiment analysis using `vaderSentiment`.
   - Conducts engagement and trend analysis.

## Project Structure

```
social-media-analysis/
├── backend/               # FastAPI Backend
│   ├── main.py            # API Server endpoints
│   ├── models.py          # Pydantic and Database models
│   └── database.py        # Database connection setup
├── frontend/              # React + Vite Frontend
│   ├── src/               # React components and pages
│   └── package.json       # Node dependencies
├── data/                  # Contains raw/synthetic and processed datasets
├── notebooks/             # Jupyter notebooks for interactive analysis
├── outputs/               # Saved charts, word clouds, and the final report
├── src/                   # Core Python modules (pipeline)
├── main.py                # Pipeline orchestration script
└── requirements.txt       # Python dependencies
```

## Setup Instructions

### 1. Backend Setup
Create a virtual environment and install dependencies:
```bash
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Frontend Setup
Navigate to the `frontend` directory and install Node.js dependencies:
```bash
cd frontend
npm install
```

## Running the Application

### Start the Backend Server
Run the FastAPI backend on port 8000:
```bash
cd backend
uvicorn main:app --reload
```

### Start the Frontend Server
In a separate terminal, start the React development server:
```bash
cd frontend
npm run dev
```

### (Optional) Run the CLI Pipeline
To run the original analysis pipeline end-to-end to generate charts and the markdown report:
```bash
python main.py
```
