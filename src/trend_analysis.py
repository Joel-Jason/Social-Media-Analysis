import pandas as pd
from collections import Counter
import ast

def extract_top_hashtags(df, n=10):
    """
    Extracts the top N most frequent hashtags from the dataset.
    Handles hashtags stored as comma-separated strings.
    """
    all_hashtags = []
    
    for tags in df['hashtags'].dropna():
        if isinstance(tags, str):
            # Split by comma and clean whitespace
            tags_list = [t.strip().lower() for t in tags.split(',') if t.strip()]
            all_hashtags.extend(tags_list)
            
    counts = Counter(all_hashtags)
    return counts.most_common(n)

def get_hashtag_trends(df, top_n=5, freq='D'):
    """
    Calculates the volume of top hashtags over time.
    freq: 'D' for daily, 'W' for weekly, 'M' for monthly
    """
    # Get the top N hashtags
    top_tags_tuples = extract_top_hashtags(df, n=top_n)
    top_tags = [tag for tag, count in top_tags_tuples]
    
    if not top_tags:
        return pd.DataFrame()
        
    # Ensure timestamp is datetime
    if not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
    # Create a timeframe column based on frequency
    df['timeframe'] = df['timestamp'].dt.to_period(freq).dt.to_timestamp()
    
    trend_data = []
    
    for _, row in df.iterrows():
        tags = str(row.get('hashtags', '')).lower()
        if not tags or tags == 'nan':
            continue
            
        tags_list = [t.strip() for t in tags.split(',')]
        
        for tag in top_tags:
            if tag in tags_list:
                trend_data.append({
                    'timeframe': row['timeframe'],
                    'hashtag': tag,
                    'count': 1
                })
                
    if not trend_data:
        return pd.DataFrame()
        
    trend_df = pd.DataFrame(trend_data)
    
    # Group by timeframe and hashtag
    grouped = trend_df.groupby(['timeframe', 'hashtag']).size().reset_index(name='volume')
    
    # Pivot for easier plotting: rows=timeframe, cols=hashtags, values=volume
    pivot_df = grouped.pivot(index='timeframe', columns='hashtag', values='volume').fillna(0)
    
    return pivot_df

if __name__ == "__main__":
    # Test trend analysis
    test_df = pd.DataFrame({
        'timestamp': ['2023-01-01 10:00:00', '2023-01-01 15:00:00', '2023-01-02 09:00:00', '2023-01-02 11:00:00'],
        'hashtags': ['#TechLaunch, #Gadget', '#techlaunch, #cool', '#MovieRelease', '#TechLaunch']
    })
    
    print("Top Hashtags:")
    print(extract_top_hashtags(test_df, n=3))
    
    print("\nHashtag Trends (Daily):")
    trends = get_hashtag_trends(test_df, top_n=2, freq='D')
    print(trends)
