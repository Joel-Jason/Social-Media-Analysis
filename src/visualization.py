import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
from wordcloud import WordCloud
import os
from .trend_analysis import extract_top_hashtags, get_hashtag_trends

# Set default seaborn style
sns.set_theme(style="whitegrid")

def ensure_dir(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)

def plot_platform_distribution(df, output_dir):
    ensure_dir(output_dir)
    plt.figure(figsize=(8, 6))
    ax = sns.countplot(data=df, x='platform', palette='viridis', order=df['platform'].value_counts().index)
    plt.title('Distribution of Posts by Platform')
    plt.xlabel('Platform')
    plt.ylabel('Number of Posts')
    
    # Add counts above bars
    for p in ax.patches:
        ax.annotate(format(p.get_height(), '.0f'), 
                    (p.get_x() + p.get_width() / 2., p.get_height()), 
                    ha = 'center', va = 'center', 
                    xytext = (0, 9), 
                    textcoords = 'offset points')
                    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'platform_distribution.png'))
    plt.close()

def plot_sentiment_distribution(df, output_dir):
    ensure_dir(output_dir)
    if 'sentiment_label' not in df.columns:
        return
        
    plt.figure(figsize=(8, 6))
    colors = {'positive': '#2ecc71', 'neutral': '#95a5a6', 'negative': '#e74c3c'}
    
    counts = df['sentiment_label'].value_counts()
    
    plt.pie(counts, labels=counts.index, autopct='%1.1f%%', startangle=140, 
            colors=[colors.get(l, '#3498db') for l in counts.index])
    plt.title('Overall Sentiment Distribution')
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'sentiment_distribution.png'))
    plt.close()

def plot_hashtag_trends(df, output_dir):
    ensure_dir(output_dir)
    
    trends = get_hashtag_trends(df, top_n=5, freq='D')
    if trends.empty:
        return
        
    plt.figure(figsize=(12, 6))
    for col in trends.columns:
        plt.plot(trends.index, trends[col], marker='o', linewidth=2, label=col)
        
    plt.title('Top Hashtag Volume Over Time (Daily)')
    plt.xlabel('Date')
    plt.ylabel('Number of Posts')
    plt.legend(title='Hashtags')
    plt.xticks(rotation=45)
    plt.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'hashtag_trends.png'))
    plt.close()

def plot_engagement_by_sentiment(df, output_dir):
    ensure_dir(output_dir)
    if 'sentiment_label' not in df.columns or 'total_engagement' not in df.columns:
        return
        
    plt.figure(figsize=(10, 6))
    sns.boxplot(data=df, x='sentiment_label', y='total_engagement', palette='Set2')
    
    plt.title('Engagement Distribution by Sentiment')
    plt.xlabel('Sentiment')
    plt.ylabel('Total Engagement (Log Scale)')
    plt.yscale('log')  # Use log scale because engagement can be highly skewed
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'engagement_by_sentiment.png'))
    plt.close()

def generate_wordclouds(df, output_dir):
    ensure_dir(output_dir)
    
    def create_wc(text_data, filename, title):
        if not text_data.strip():
            return
        wc = WordCloud(width=800, height=400, background_color='white', colormap='inferno',
                       max_words=100).generate(text_data)
        plt.figure(figsize=(10, 5))
        plt.imshow(wc, interpolation='bilinear')
        plt.title(title, fontsize=16)
        plt.axis('off')
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, filename))
        plt.close()
        
    # Overall Word Cloud
    all_text = " ".join(str(t) for t in df['cleaned_text'].dropna())
    create_wc(all_text, 'wordcloud_overall.png', 'Overall Word Cloud')
    
    # Positive Word Cloud
    if 'sentiment_label' in df.columns:
        pos_text = " ".join(str(t) for t in df[df['sentiment_label'] == 'positive']['cleaned_text'].dropna())
        create_wc(pos_text, 'wordcloud_positive.png', 'Positive Sentiment Word Cloud')
        
        neg_text = " ".join(str(t) for t in df[df['sentiment_label'] == 'negative']['cleaned_text'].dropna())
        create_wc(neg_text, 'wordcloud_negative.png', 'Negative Sentiment Word Cloud')

def plot_interactive_engagement(df, output_dir):
    """
    Creates an interactive scatter plot using Plotly and saves it as HTML.
    """
    ensure_dir(output_dir)
    if 'sentiment_score' not in df.columns or 'engagement_rate' not in df.columns:
        return
        
    fig = px.scatter(
        df, x='sentiment_score', y='engagement_rate', 
        color='platform', size='followers_count', 
        hover_data=['post_id', 'sentiment_label'],
        title='Engagement Rate vs Sentiment Score',
        opacity=0.7,
        template='plotly_white'
    )
    
    fig.write_html(os.path.join(output_dir, 'interactive_engagement.html'))

def generate_all_visualizations(df, output_dir='../outputs'):
    print("Generating platform distribution...")
    plot_platform_distribution(df, output_dir)
    
    print("Generating sentiment distribution...")
    plot_sentiment_distribution(df, output_dir)
    
    print("Generating hashtag trends...")
    plot_hashtag_trends(df, output_dir)
    
    print("Generating engagement by sentiment...")
    plot_engagement_by_sentiment(df, output_dir)
    
    print("Generating word clouds...")
    generate_wordclouds(df, output_dir)
    
    print("Generating interactive plots...")
    plot_interactive_engagement(df, output_dir)
    
    print(f"All visualizations saved to {output_dir}")

if __name__ == "__main__":
    pass # Will be tested via main.py
