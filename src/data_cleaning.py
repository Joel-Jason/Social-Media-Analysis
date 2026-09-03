import pandas as pd
import re

def remove_urls(text):
    if not isinstance(text, str):
        return text
    return re.sub(r'http[s]?://\S+', '', text)

def remove_mentions(text):
    if not isinstance(text, str):
        return text
    return re.sub(r'@\w+', '', text)

def remove_emojis(text):
    if not isinstance(text, str):
        return text
    # Removing common emoji ranges
    return text.encode('ascii', 'ignore').decode('ascii')

def clean_text(text):
    """
    Applies text cleaning steps: removes URLs, mentions, and emojis.
    Strips leading and trailing whitespace.
    """
    if pd.isna(text):
        return text
        
    text = remove_urls(text)
    text = remove_mentions(text)
    text = remove_emojis(text)
    
    # Remove multiple spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def clean_dataset(df):
    """
    Cleans the entire dataset by applying text cleaning, 
    handling missing values, and removing duplicates.
    """
    print(f"Original dataset size: {df.shape[0]} rows")
    
    # 1. Remove duplicates based on post_id
    df_clean = df.drop_duplicates(subset=['post_id'])
    print(f"Size after removing duplicates: {df_clean.shape[0]} rows")
    
    # 2. Handle missing values
    # Drop rows where 'text' or 'timestamp' is missing, since they are crucial
    df_clean = df_clean.dropna(subset=['text', 'timestamp'])
    
    # Fill missing engagement metrics with 0
    engagement_cols = ['likes', 'shares', 'comments']
    for col in engagement_cols:
        if col in df_clean.columns:
            df_clean[col] = df_clean[col].fillna(0).astype(int)
            
    print(f"Size after dropping critical missing values: {df_clean.shape[0]} rows")
    
    # 3. Clean text column
    df_clean['cleaned_text'] = df_clean['text'].apply(clean_text)
    
    return df_clean

if __name__ == "__main__":
    # Small test
    test_data = pd.DataFrame({
        'post_id': ['1', '2', '2', '3'],
        'text': ['Check this out! https://link.com @user1 🚀', 'Hello world!', 'Hello world!', None],
        'timestamp': ['2023-01-01', '2023-01-02', '2023-01-02', '2023-01-03'],
        'likes': [10, None, None, 5]
    })
    
    cleaned_test = clean_dataset(test_data)
    print("\nCleaned Data:")
    print(cleaned_test[['post_id', 'cleaned_text', 'likes']])
