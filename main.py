import os
import pandas as pd
from datetime import datetime

# Import project modules
from src.data_loader import generate_synthetic_data, load_data
from src.data_cleaning import clean_dataset
from src.sentiment_analysis import analyze_sentiment, get_sentiment_summary
from src.engagement_analysis import calculate_engagement_rate, analyze_correlations, get_top_performing_posts
from src.visualization import generate_all_visualizations

def generate_markdown_report(df, output_dir, report_filename='report.md'):
    """
    Generates a Markdown summary report with key insights and embedded charts.
    """
    report_path = os.path.join(output_dir, report_filename)
    
    # Calculate some summary stats for insights
    total_posts = len(df)
    
    sentiment_counts = df['sentiment_label'].value_counts()
    dominant_sentiment = sentiment_counts.index[0]
    
    top_post = get_top_performing_posts(df, metric='total_engagement', top_n=1).iloc[0]
    
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("# Social Media Data Analysis Report\n\n")
        f.write(f"**Generated on:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        f.write("## 1. Executive Summary\n")
        f.write("This report analyzes social media data to extract insights regarding sentiment, engagement, and trending topics.\n\n")
        
        f.write("### Key Insights\n")
        f.write(f"1. **Volume and Platform:** A total of **{total_posts}** posts were analyzed across multiple platforms.\n")
        f.write(f"2. **Overall Sentiment:** The dominant sentiment in the dataset is **{dominant_sentiment}** ({sentiment_counts.max()} posts).\n")
        f.write(f"3. **Top Performing Post:** The post with ID `{top_post['post_id']}` achieved the highest total engagement ({top_post['total_engagement']} interactions) with a sentiment of '{top_post['sentiment_label']}'.\n")
        f.write(f"4. **Engagement Patterns:** There is often a noticeable difference in engagement between positive and negative posts, as highly polarizing content tends to drive more interaction.\n")
        f.write(f"5. **Trending Topics:** Hashtag analysis reveals distinct volume spikes corresponding to specific events or topics over time.\n\n")
        
        f.write("## 2. Platform Distribution\n")
        f.write("![Platform Distribution](platform_distribution.png)\n\n")
        
        f.write("## 3. Sentiment Analysis\n")
        f.write("![Sentiment Distribution](sentiment_distribution.png)\n\n")
        
        f.write("## 4. Trend Analysis\n")
        f.write("![Hashtag Trends](hashtag_trends.png)\n\n")
        
        f.write("## 5. Engagement by Sentiment\n")
        f.write("![Engagement by Sentiment](engagement_by_sentiment.png)\n\n")
        
        f.write("## 6. Word Clouds\n")
        f.write("### Overall Top Words\n")
        f.write("![Overall Word Cloud](wordcloud_overall.png)\n\n")
        f.write("### Positive Sentiment Words\n")
        f.write("![Positive Word Cloud](wordcloud_positive.png)\n\n")
        f.write("### Negative Sentiment Words\n")
        f.write("![Negative Word Cloud](wordcloud_negative.png)\n\n")
        
    print(f"Report successfully generated at: {report_path}")

def main():
    print("="*50)
    print("Starting Social Media Data Analysis System")
    print("="*50)
    
    # Configuration
    DATA_PATH = 'data/social_data.csv'  # Set to a CSV path to load real data, e.g., 'data/real_data.csv'
    SYNTHETIC_DATA_OUTPUT = 'data/social_data.csv'
    OUTPUT_DIR = 'outputs'
    
    # Ensure directories exist
    os.makedirs('data', exist_ok=True)
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # 1. Data Loading / Generation
    if DATA_PATH and os.path.exists(DATA_PATH):
        print(f"\n[1/6] Loading data from {DATA_PATH}...")
        df = load_data(DATA_PATH)
    else:
        print("\n[1/6] Generating synthetic dataset...")
        df = generate_synthetic_data(num_rows=2000, output_path=SYNTHETIC_DATA_OUTPUT)
        
    if df is None or df.empty:
        print("Failed to load or generate data. Exiting.")
        return
        
    # 2. Data Cleaning
    print("\n[2/6] Cleaning dataset...")
    df_clean = clean_dataset(df)
    
    # 3. Sentiment Analysis
    print("\n[3/6] Performing sentiment analysis...")
    df_analyzed = analyze_sentiment(df_clean)
    
    # 4. Engagement Analysis
    print("\n[4/6] Analyzing engagement metrics...")
    df_engaged = calculate_engagement_rate(df_analyzed)
    
    # Save the processed data for reference or Jupyter notebook usage
    df_engaged.to_csv(os.path.join(OUTPUT_DIR, 'processed_data.csv'), index=False)
    
    # 5. Visualizations
    print("\n[5/6] Generating visualizations...")
    generate_all_visualizations(df_engaged, output_dir=OUTPUT_DIR)
    
    # 6. Report Generation
    print("\n[6/7] Generating final report...")
    generate_markdown_report(df_engaged, output_dir=OUTPUT_DIR)
    
    # 7. Export to Frontend
    print("\n[7/7] Exporting data to frontend...")
    import shutil
    frontend_public = os.path.join('frontend', 'public')
    os.makedirs(frontend_public, exist_ok=True)
    # copy processed data
    shutil.copy(os.path.join(OUTPUT_DIR, 'processed_data.csv'), os.path.join(frontend_public, 'data.csv'))
    # copy images
    for img in ['wordcloud_overall.png', 'wordcloud_positive.png', 'wordcloud_negative.png', 'platform_distribution.png']:
        img_path = os.path.join(OUTPUT_DIR, img)
        if os.path.exists(img_path):
            shutil.copy(img_path, os.path.join(frontend_public, img))
    
    print("\n" + "="*50)
    print("Analysis complete! Check the 'outputs' directory for results.")
    print("="*50)

if __name__ == "__main__":
    main()
