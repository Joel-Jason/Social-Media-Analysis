# Social Media Data Analysis System

A comprehensive Python pipeline designed to analyze social media data (posts, tweets) to extract insights on sentiment, engagement, and trending topics. This project was developed as a Data Analysis Essentials course project.

## Features

1. **Data Loading & Generation**: Generates a realistic synthetic dataset of 2,000+ rows covering topics like tech launches, movie releases, and sports events. It can also be easily configured to load real CSV datasets.
2. **Data Cleaning**: Removes URLs, user mentions, and emojis, handles missing values, and removes duplicate entries to prepare data for analysis.
3. **Sentiment Analysis**: Uses the `vaderSentiment` library to classify each post as positive, negative, or neutral based on its text content.
4. **Engagement Analysis**: Analyzes correlations between sentiment, post length, and engagement metrics (likes, shares, comments) to identify top-performing content.
5. **Trend Analysis**: Tracks the volume of top hashtags over time.
6. **Visualization**: Generates informative charts (post frequency, top hashtags, platform distribution, sentiment distribution, and engagement by sentiment) alongside word clouds for different sentiment categories.
7. **Automated Reporting**: Produces a final summary report (`outputs/report.md`) with embedded chart images and key insights written in plain English.

## Project Structure

```
social-media-analysis/
├── data/                  # Contains raw/synthetic and processed datasets
├── notebooks/             # Jupyter notebooks for interactive analysis
│   └── analysis.ipynb
├── outputs/               # Saved charts, word clouds, and the final report
├── src/                   # Core Python modules
│   ├── data_loader.py     # Data generation and loading
│   ├── data_cleaning.py   # Text cleaning and data formatting
│   ├── sentiment_analysis.py # VADER sentiment scoring
│   ├── engagement_analysis.py # Engagement metrics and correlations
│   ├── trend_analysis.py  # Hashtag trend calculations over time
│   └── visualization.py   # Chart and word cloud generation
├── main.py                # Main orchestration script
├── requirements.txt       # Python dependencies
└── README.md              # Project documentation
```

## Setup Instructions

1. **Clone or Download the Repository**
2. **Create a Virtual Environment (Recommended):**
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Running the Project

### End-to-End Pipeline
To run the full analysis pipeline end-to-end, execute:

```bash
python main.py
```

This will:
1. Generate the synthetic dataset (if a real dataset path is not provided).
2. Clean the data.
3. Perform sentiment and engagement analysis.
4. Generate all visualizations in the `outputs/` folder.
5. Generate a final Markdown report in `outputs/report.md`.

### Interactive Analysis
If you want to walk through the analysis step-by-step with detailed explanations, you can run the Jupyter Notebook:

```bash
jupyter notebook notebooks/analysis.ipynb
```

## Using Real Data
By default, `main.py` generates synthetic data. To use a real dataset:
1. Place your CSV file in the `data/` folder.
2. Edit `main.py`. Change `DATA_PATH = None` to `DATA_PATH = 'data/your_dataset.csv'`.
3. Ensure your CSV contains the expected columns (`post_id`, `username`, `timestamp`, `platform`, `text`, `hashtags`, `likes`, `shares`, `comments`, `followers_count`).
