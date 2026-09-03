import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os

def generate_synthetic_data(num_rows=1000, output_path=None):
    """
    Generates a realistic synthetic social media dataset.
    """
    platforms = ['Twitter', 'Instagram', 'Reddit']
    
    topics = {
        'TechLaunch': {
            'hashtags': ['#TechLaunch', '#Smartphone2024', '#GadgetReview'],
            'positive': [
                "The new {} phone is absolutely amazing! The camera is unreal! 📱✨",
                "Finally got my hands on the {} device. Loving the battery life. 😍",
                "Best {} I have ever used. Highly recommend!",
                "Wow, the screen on the {} is stunning."
            ],
            'negative': [
                "Extremely disappointed with the {} phone. Overheating issues are terrible. 😡",
                "Not worth the upgrade. {} is just a rehash of last year's model.",
                "Terrible customer service when I tried to return my {}. Never again.",
                "The battery life on this {} is a joke. 🗑️"
            ],
            'neutral': [
                "Just saw the specs for the {} phone. They seem okay.",
                "Will wait for the reviews before buying the {} device.",
                "Anyone getting the new {}? I can't decide.",
                "Comparing the {} with other models."
            ]
        },
        'MovieRelease': {
            'hashtags': ['#MovieRelease', '#Blockbuster', '#Cinema'],
            'positive': [
                "Just watched the new {}. Best movie of the year! 🍿🎬",
                "Incredible performance by the lead actor in {}! A must watch!",
                "The visual effects in {} blew my mind. 10/10.",
                "I was on the edge of my seat during {}!"
            ],
            'negative': [
                "What a waste of time. {} was completely boring. 🥱",
                "The plot in {} made no sense. Avoid at all costs.",
                "Worst ending ever. {} completely ruined the franchise.",
                "I fell asleep halfway through {}."
            ],
            'neutral': [
                "Going to see {} tonight. Hope it's good.",
                "{} had some decent moments, but overall average.",
                "Tickets for {} were expensive, hope it's worth it.",
                "Watching {} with my friends this weekend."
            ]
        },
        'SportsEvent': {
            'hashtags': ['#SportsEvent', '#ChampionshipGame', '#Finals'],
            'positive': [
                "What a thrilling finish to the {}! Unbelievable! 🏆🔥",
                "My team finally won the {}! Best day ever!",
                "Incredible display of skill at the {} today.",
                "Can't stop thinking about that game winning play at the {}!"
            ],
            'negative': [
                "Terrible refereeing ruined the {}. Absolutely rigged. 🗑️",
                "Can't believe we lost the {}. So heartbroken right now.",
                "Worst performance by my team in the {}. Embarrassing.",
                "The broadcast quality for the {} is awful. 😡"
            ],
            'neutral': [
                "Watching the {} with friends. Game is tied.",
                "The {} is pretty competitive this year.",
                "Who do you think will win the {}?",
                "Getting snacks ready for the {}."
            ]
        }
    }
    
    data = []
    
    start_date = datetime.now() - timedelta(days=30)
    
    for i in range(num_rows):
        post_id = f"POST_{i:05d}"
        username = f"user_{random.randint(1, 5000)}"
        timestamp = start_date + timedelta(
            days=random.randint(0, 30),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59)
        )
        platform = random.choice(platforms)
        
        # Determine topic and sentiment
        topic_key = random.choice(list(topics.keys()))
        topic_info = topics[topic_key]
        sentiment = random.choice(['positive', 'negative', 'neutral'])
        
        # Base text
        template = random.choice(topic_info[sentiment])
        primary_hashtag = random.choice(topic_info['hashtags'])
        text = template.format(primary_hashtag)
        
        # Add some random mentions or URLs occasionally to test cleaning
        if random.random() < 0.2:
            text += f" @{username} "
        if random.random() < 0.2:
            text += " https://example.com/link"
            
        # Compile hashtags
        num_tags = random.randint(1, 3)
        post_hashtags = ",".join(random.sample(topic_info['hashtags'], k=min(num_tags, len(topic_info['hashtags']))))
        
        # Engagement metrics based on sentiment and platform to create correlations
        followers_count = random.randint(10, 100000)
        base_engagement = int(followers_count * random.uniform(0.001, 0.05))
        
        # Highly positive or negative posts often get more engagement
        if sentiment in ['positive', 'negative']:
            base_engagement = int(base_engagement * random.uniform(1.2, 2.5))
            
        likes = base_engagement
        shares = int(likes * random.uniform(0.1, 0.4))
        comments = int(likes * random.uniform(0.05, 0.3))
        
        data.append({
            'post_id': post_id,
            'username': username,
            'timestamp': timestamp,
            'platform': platform,
            'text': text,
            'hashtags': post_hashtags,
            'likes': likes,
            'shares': shares,
            'comments': comments,
            'followers_count': followers_count
        })
        
    df = pd.DataFrame(data)
    
    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        df.to_csv(output_path, index=False)
        print(f"Synthetic dataset created at: {output_path}")
        
    return df

def load_data(file_path):
    """
    Loads social media data from a given CSV file path.
    """
    try:
        df = pd.read_csv(file_path)
        print(f"Successfully loaded data from {file_path}")
        return df
    except Exception as e:
        print(f"Error loading data: {e}")
        return None

if __name__ == "__main__":
    # Test generation
    df = generate_synthetic_data(num_rows=1500, output_path="../data/synthetic_social_data.csv")
    print(df.head())
    print(df.info())
