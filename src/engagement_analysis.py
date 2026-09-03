import pandas as pd
import numpy as np

def calculate_engagement_rate(df):
    """
    Calculates the total engagement and engagement rate based on followers count.
    """
    # Total engagement is the sum of likes, shares, and comments
    df['total_engagement'] = df['likes'] + df['shares'] + df['comments']
    
    # Engagement rate: (total_engagement / followers_count) * 100
    # Add a small epsilon to avoid division by zero
    df['engagement_rate'] = (df['total_engagement'] / (df['followers_count'] + 1)) * 100
    
    return df

def analyze_correlations(df):
    """
    Computes correlations between numerical variables like sentiment score, 
    post length, and engagement metrics.
    """
    # Calculate post length (number of words)
    df['post_length'] = df['cleaned_text'].apply(lambda x: len(str(x).split()) if pd.notna(x) else 0)
    
    # Select numerical columns for correlation
    numeric_cols = ['sentiment_score', 'post_length', 'likes', 'shares', 'comments', 'total_engagement', 'engagement_rate']
    
    # Ensure all columns exist
    available_cols = [col for col in numeric_cols if col in df.columns]
    
    if not available_cols:
        return pd.DataFrame()
        
    return df[available_cols].corr()

def get_top_performing_posts(df, metric='total_engagement', top_n=10):
    """
    Returns the top N performing posts based on a specified metric.
    """
    if metric not in df.columns:
        if metric == 'total_engagement':
            df = calculate_engagement_rate(df)
        else:
            raise ValueError(f"Metric '{metric}' not found in dataframe.")
            
    return df.sort_values(by=metric, ascending=False).head(top_n)

if __name__ == "__main__":
    # Test engagement analysis
    test_df = pd.DataFrame({
        'post_id': ['1', '2', '3', '4'],
        'cleaned_text': ['Short post', 'This is a slightly longer post with more words', 'Another one here', 'And this one is the longest of all the posts here today'],
        'sentiment_score': [0.1, 0.5, -0.2, 0.9],
        'likes': [100, 50, 200, 10],
        'shares': [20, 10, 40, 2],
        'comments': [5, 2, 10, 1],
        'followers_count': [1000, 500, 2000, 100]
    })
    
    df_with_eng = calculate_engagement_rate(test_df)
    print("Engagement Data:")
    print(df_with_eng[['post_id', 'total_engagement', 'engagement_rate']])
    
    print("\nCorrelations:")
    print(analyze_correlations(df_with_eng))
    
    print("\nTop 2 Posts by Engagement Rate:")
    print(get_top_performing_posts(df_with_eng, metric='engagement_rate', top_n=2)[['post_id', 'engagement_rate']])
