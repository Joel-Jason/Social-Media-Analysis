import pandas as pd
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

def analyze_sentiment(df, text_column='cleaned_text'):
    """
    Applies VADER sentiment analysis to the specified text column.
    Adds 'sentiment_score' and 'sentiment_label' columns to the dataframe.
    """
    analyzer = SentimentIntensityAnalyzer()
    
    # We create lists to hold scores and labels for better performance than iterrows
    scores = []
    labels = []
    
    for text in df[text_column]:
        if pd.isna(text) or not isinstance(text, str) or text.strip() == "":
            scores.append(0.0)
            labels.append('neutral')
            continue
            
        vs = analyzer.polarity_scores(text)
        compound = vs['compound']
        scores.append(compound)
        
        # Categorize sentiment based on compound score
        if compound >= 0.05:
            labels.append('positive')
        elif compound <= -0.05:
            labels.append('negative')
        else:
            labels.append('neutral')
            
    # Add new columns to the dataframe
    df['sentiment_score'] = scores
    df['sentiment_label'] = labels
    
    return df

def get_sentiment_summary(df):
    """
    Returns a summary of sentiment distribution.
    """
    if 'sentiment_label' not in df.columns:
        return pd.Series()
        
    return df['sentiment_label'].value_counts()

if __name__ == "__main__":
    # Test sentiment analysis
    test_df = pd.DataFrame({
        'cleaned_text': [
            'This new phone is amazing and I love it!',
            'The battery life is terrible, completely disappointed.',
            'It has a screen and buttons.',
            'Best purchase ever!!!',
            'I hate this product so much.'
        ]
    })
    
    result_df = analyze_sentiment(test_df)
    print(result_df[['cleaned_text', 'sentiment_score', 'sentiment_label']])
    print("\nSummary:")
    print(get_sentiment_summary(result_df))
