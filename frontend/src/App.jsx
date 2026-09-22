import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter, ZAxis, LabelList
} from 'recharts';
import { LayoutDashboard, MessageSquareText, Database, Download, Lightbulb, LogIn, Send, LogOut, UserPlus, X, TrendingUp, TrendingDown, Activity, Smile, AlertCircle, MessageCircle, Award, Sun, Moon, ArrowRight, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import './index.css';

const SENTIMENT_COLORS = { positive: '#10b981', neutral: '#64748b', negative: '#f43f5e' };
const PLATFORM_COLORS = ['#38BDF8', '#8B5CF6', '#22D3EE', '#F59E0B', '#D946EF', '#10b981'];
const CHART_TOOLTIP_STYLE = { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-body)' };

// --- Synthetic Data Generation ---
const cyrb128 = (str) => {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
    return [h1>>>0, h2>>>0, h3>>>0, h4>>>0];
};

const sfc32 = (a, b, c, d) => {
    return function() {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
      var t = (a + b) | 0;
      a = b ^ b >>> 9;
      b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11);
      d = d + 1 | 0;
      t = t + d | 0;
      c = c + t | 0;
      return (t >>> 0) / 4294967296;
    }
};

const generateSyntheticData = (username, platform) => {
    const seed = cyrb128(`${username}-${platform}`);
    const rand = sfc32(seed[0], seed[1], seed[2], seed[3]);
    
    const count = Math.floor(rand() * 40) + 20; // 20-60 posts
    const dataset = [];
    
    const baseDate = new Date();
    baseDate.setHours(0,0,0,0);
    
    const topics = ["tech", "design", "ai", "coding", "productivity", "remote", "coffee", "setup", "learning", "growth", "launch", "marketing", "startups", "web3", "react"];
    const adjectives = ["amazing", "terrible", "great", "bad", "interesting", "boring", "innovative", "slow", "fast", "beautiful"];

    for (let i = 0; i < count; i++) {
        const postDate = new Date(baseDate.getTime() - rand() * 30 * 24 * 60 * 60 * 1000);
        
        const r = rand();
        let sentiment_label = 'neutral';
        let sentiment_score = (rand() * 0.4) - 0.2;
        if (r > 0.6) {
            sentiment_label = 'positive';
            sentiment_score = 0.2 + (rand() * 0.8);
        } else if (r < 0.25) {
            sentiment_label = 'negative';
            sentiment_score = -0.2 - (rand() * 0.8);
        }
        
        const engagement_rate = 1 + (rand() * 12);
        const total_engagement = Math.floor(engagement_rate * 50 * (1 + rand() * 3));
        const followers_count = Math.floor(total_engagement / (engagement_rate / 100));

        const t = topics[Math.floor(rand()*topics.length)];
        const a = adjectives[Math.floor(rand()*adjectives.length)];
        
        dataset.push({
            id: `synth-${username}-${platform}-${i}`,
            timestamp: postDate.toISOString(),
            platform: platform,
            username: username,
            cleaned_text: `Just exploring some ${t} today. It's really ${a}! #${t} #${platform.toLowerCase()}`,
            sentiment_label,
            sentiment_score,
            engagement_rate,
            total_engagement,
            followers_count
        });
    }
    return dataset;
};

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dark-theme', isDarkTheme);
  }, [isDarkTheme]);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Dashboard State
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [overviewMode, setOverviewMode] = useState('public');
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [newLinkedAccount, setNewLinkedAccount] = useState('');
  const [newLinkedPlatform, setNewLinkedPlatform] = useState('Instagram');

  const handleAddLinkedAccount = () => {
    const uname = newLinkedAccount.trim();
    if (uname) {
      const isAlreadyLinked = linkedAccounts.some(acc => acc.username === uname && acc.platform === newLinkedPlatform);
      if (!isAlreadyLinked) {
        setLinkedAccounts([...linkedAccounts, { username: uname, platform: newLinkedPlatform }]);
        setNewLinkedAccount('');
      }
    }
  };

  const handleRemoveLinkedAccount = (accountToRemove) => {
    setLinkedAccounts(linkedAccounts.filter(a => !(a.username === accountToRemove.username && a.platform === accountToRemove.platform)));
  };
  
  // Sandbox State
  const [draftIdea, setDraftIdea] = useState('');
  const [sandboxFeedback, setSandboxFeedback] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Post Explorer State
  const [platformFilter, setPlatformFilter] = useState('All');
  const [sentimentFilter, setSentimentFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(20);
  const [expandedPosts, setExpandedPosts] = useState(new Set());
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    Papa.parse('/data.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data);
        setLoading(false);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        setLoading(false);
      }
    });
  }, []);

  // Open modal helpers
  const openLoginModal = () => {
    setIsRegistering(false);
    setAuthError('');
    setUsername('');
    setPassword('');
    setShowAuthModal(true);
  };

  const openRegisterModal = () => {
    setIsRegistering(true);
    setAuthError('');
    setUsername('');
    setPassword('');
    setShowAuthModal(true);
  };

  const closeModal = () => {
    setShowAuthModal(false);
    setAuthError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        setIsLoggedIn(true);
        setShowAuthModal(false);
      } else {
        setAuthError(data.detail || 'Login failed');
      }
    } catch (err) {
      setAuthError('Cannot connect to server. Is the backend running?');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const response = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        setIsRegistering(false);
        setAuthError('Registration successful! Please login.');
      } else {
        setAuthError(data.detail || 'Registration failed');
      }
    } catch (err) {
      setAuthError('Cannot connect to server. Is the backend running?');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setAuthError('');
  };

  const analyzeIdea = async () => {
    if (!draftIdea.trim()) {
      setSandboxFeedback([{ type: 'warning', text: 'Please type an idea first.' }]);
      return;
    }

    setIsAnalyzing(true);
    setSandboxFeedback([]);

    try {
      const response = await fetch('http://localhost:8000/analyze_idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: draftIdea })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSandboxFeedback(data.feedback || []);
      } else {
        setSandboxFeedback([{ type: 'warning', text: data.detail || 'Analysis failed.' }]);
      }
    } catch (err) {
      setSandboxFeedback([{ type: 'warning', text: 'Cannot connect to server. Is the backend running?' }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- Global Metrics ---
  const overviewData = useMemo(() => {
    if (overviewMode === 'personal') {
      let syntheticData = [];
      if (username) {
         syntheticData = syntheticData.concat(generateSyntheticData(username, 'Twitter'));
      }
      linkedAccounts.forEach(acc => {
         syntheticData = syntheticData.concat(generateSyntheticData(acc.username, acc.platform));
      });
      return syntheticData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
    return data;
  }, [data, overviewMode, username, linkedAccounts]);

  const globalMetrics = useMemo(() => {
    if (!overviewData.length) return { total: 0, engagement: 0, avgEngagement: 0, dominantSentiment: 'N/A', sentimentScore: 0 };
    
    let totalEngagement = 0;
    let sumEngagementRate = 0;
    let sumSentimentScore = 0;
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    
    overviewData.forEach(row => {
      totalEngagement += row.total_engagement || 0;
      sumEngagementRate += row.engagement_rate || 0;
      sumSentimentScore += row.sentiment_score || 0;
      if (row.sentiment_label) {
        sentimentCounts[row.sentiment_label] = (sentimentCounts[row.sentiment_label] || 0) + 1;
      }
    });

    const dominant = Object.keys(sentimentCounts).reduce((a, b) => sentimentCounts[a] > sentimentCounts[b] ? a : b, 'neutral');

    return {
      total: overviewData.length,
      engagement: totalEngagement,
      avgEngagement: (sumEngagementRate / overviewData.length),
      dominantSentiment: dominant,
      sentimentScore: sumSentimentScore / overviewData.length
    };
  }, [overviewData]);

  const publicMetrics = useMemo(() => {
    if (!data.length) return { avgEngagement: 0, sentimentScore: 0 };
    let sumEngagementRate = 0;
    let sumSentimentScore = 0;
    data.forEach(row => {
      sumEngagementRate += row.engagement_rate || 0;
      sumSentimentScore += row.sentiment_score || 0;
    });
    return {
      avgEngagement: sumEngagementRate / data.length,
      sentimentScore: sumSentimentScore / data.length
    };
  }, [data]);

  const sentimentPercentile = useMemo(() => {
    if (!data.length || globalMetrics.sentimentScore === undefined) return 50;
    const sortedScores = data.map(r => r.sentiment_score || 0).sort((a, b) => a - b);
    const index = sortedScores.findIndex(s => s >= globalMetrics.sentimentScore);
    if (index === -1) return 99;
    return Math.max(1, Math.round((index / sortedScores.length) * 100));
  }, [data, globalMetrics.sentimentScore]);

  const generatedInsights = useMemo(() => {
    if (!overviewData.length) return [];
    
    const insights = [];
    
    // 1. Platform with highest engagement
    const platformEngagement = {};
    overviewData.forEach(row => {
      if (row.platform) {
        platformEngagement[row.platform] = (platformEngagement[row.platform] || 0) + (row.total_engagement || 0);
      }
    });
    const topPlatform = Object.keys(platformEngagement).reduce((a, b) => platformEngagement[a] > platformEngagement[b] ? a : b, '');
    if (topPlatform) {
      insights.push({
        icon: <Award size={18} />,
        color: '#38BDF8', // blue
        text: `${topPlatform} is currently the most engaging platform, driving the highest total interactions.`
      });
    }

    // 2. Trend direction (compare first half to second half by time)
    const sortedData = [...overviewData].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    if (sortedData.length >= 10) {
      const half = Math.floor(sortedData.length / 2);
      const firstHalf = sortedData.slice(0, half);
      const secondHalf = sortedData.slice(half);
      const firstHalfEng = firstHalf.reduce((sum, row) => sum + (row.total_engagement || 0), 0) / firstHalf.length;
      const secondHalfEng = secondHalf.reduce((sum, row) => sum + (row.total_engagement || 0), 0) / secondHalf.length;
      
      if (secondHalfEng > firstHalfEng * 1.1) {
        insights.push({
          icon: <TrendingUp size={18} />,
          color: '#10b981', // positive
          text: 'Engagement is trending upwards recently compared to earlier posts.'
        });
      } else if (secondHalfEng < firstHalfEng * 0.9) {
        insights.push({
          icon: <TrendingDown size={18} />,
          color: '#f43f5e', // negative
          text: 'Recent engagement has dipped slightly; consider experimenting with new topics or formats.'
        });
      } else {
        insights.push({
          icon: <Activity size={18} />,
          color: '#8B5CF6', // violet
          text: 'Audience engagement has remained stable across the recent timeline.'
        });
      }
    }

    // 3. Sentiment context
    const dominant = globalMetrics.dominantSentiment;
    if (dominant === 'positive') {
      insights.push({
        icon: <Smile size={18} />,
        color: '#10b981',
        text: 'The overall response to this content is overwhelmingly positive.'
      });
    } else if (dominant === 'negative') {
      insights.push({
        icon: <AlertCircle size={18} />,
        color: '#f43f5e',
        text: 'There is a notable negative sentiment trend in the current dataset.'
      });
    } else {
      insights.push({
        icon: <MessageCircle size={18} />,
        color: '#64748b',
        text: 'Audience sentiment is largely neutral and informational.'
      });
    }

    return insights;
  }, [overviewData, globalMetrics.dominantSentiment]);

  const platformData = useMemo(() => {
    const counts = {};
    overviewData.forEach(row => {
      if (row.platform) counts[row.platform] = (counts[row.platform] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [overviewData]);

  const sentimentData = useMemo(() => {
    const counts = { positive: 0, neutral: 0, negative: 0 };
    overviewData.forEach(row => {
      if (row.sentiment_label) counts[row.sentiment_label]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [overviewData]);

  const topWordsData = useMemo(() => {
    if (!overviewData.length) return [];
    
    const stopWords = new Set(['the', 'and', 'to', 'a', 'of', 'in', 'is', 'it', 'you', 'that', 'for', 'on', 'this', 'with', 'i', 'my', 'at', 'as', 'are', 'be', 'but', 'not', 'have', 'from', 'we', 'by', 'an', 'they', 'your', 'so', 'was', 'if', 'what', 'can', 'or', 'all', 'out', 'up', 'just', 'like', 'about', 'some', 'explore', 'exploring', 'really', 'today', 'how']);
    
    const counts = {};
    overviewData.forEach(row => {
      if (row.cleaned_text) {
        // Simple regex to grab words and hashtags
        const words = row.cleaned_text.toLowerCase().match(/(?:#\w+)|(?:\b\w+\b)/g);
        if (words) {
          words.forEach(w => {
            if (!stopWords.has(w) && w.length > 2 && !w.match(/^\d+$/)) {
              counts[w] = (counts[w] || 0) + 1;
            }
          });
        }
      }
    });

    const sorted = Object.entries(counts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
      
    // Recharts renders bottom-to-top in horizontal bar charts, so reverse it
    return sorted.reverse();
  }, [overviewData]);

  const timeSeriesData = useMemo(() => {
    const dates = {};
    overviewData.forEach(row => {
      if (row.timestamp) {
        const dateStr = new Date(row.timestamp).toISOString().split('T')[0];
        dates[dateStr] = (dates[dateStr] || 0) + 1;
      }
    });
    return Object.entries(dates).sort((a,b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count }));
  }, [overviewData]);

  const dateRange = useMemo(() => {
    if (!data.length) return { min: '', max: '' };
    const timestamps = data.map(d => new Date(d.timestamp).getTime()).filter(t => !isNaN(t));
    if (!timestamps.length) return { min: 'N/A', max: 'N/A' };
    return {
      min: new Date(Math.min(...timestamps)).toLocaleDateString(),
      max: new Date(Math.max(...timestamps)).toLocaleDateString()
    };
  }, [data]);

  const filteredPosts = useMemo(() => {
    const filtered = data.filter(post => {
      const matchPlatform = platformFilter === 'All' || post.platform === platformFilter;
      const matchSentiment = sentimentFilter === 'All' || post.sentiment_label === sentimentFilter;
      const matchSearch = post.text && post.text.toLowerCase().includes(searchQuery.toLowerCase());
      return matchPlatform && matchSentiment && matchSearch;
    });

    if (sortColumn) {
      filtered.sort((a, b) => {
        let valA, valB;
        if (sortColumn === 'Platform') {
          valA = a.platform || '';
          valB = b.platform || '';
        } else if (sortColumn === 'Likes') {
          valA = a.likes || 0;
          valB = b.likes || 0;
        } else if (sortColumn === 'Engagement') {
          valA = a.total_engagement || 0;
          valB = b.total_engagement || 0;
        } else if (sortColumn === 'Sentiment') {
          valA = a.sentiment_score || 0;
          valB = b.sentiment_score || 0;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, platformFilter, sentimentFilter, searchQuery, sortColumn, sortDirection]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setDisplayCount(20);
    setExpandedPosts(new Set());
  };

  const togglePostExpanded = (index) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
      return newSet;
    });
  };

  if (loading) return <div className="loader">Loading Application...</div>;

  // ========================
  // AUTH MODAL (shared)
  // ========================
  const authModal = showAuthModal && (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
      <div className="modal-card">
        <button className="modal-close" onClick={closeModal} aria-label="Close">
          <X size={20} />
        </button>

        <h2>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
        <p className="modal-subtitle">{isRegistering ? 'Sign up to start analyzing' : 'Log in to access your dashboard'}</p>

        <form className="modal-form" onSubmit={isRegistering ? handleRegister : handleLogin}>
          <input 
            type="text" 
            placeholder="Username" 
            className="input-field" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="input-field" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {authError && (
            <div className={`auth-error ${authError.includes('successful') ? 'success' : 'error'}`}>
              {authError}
            </div>
          )}
          
          <button type="submit" className="modal-submit-btn">
            {isRegistering ? <><UserPlus size={18} /> Register</> : <><LogIn size={18} /> Sign In</>}
          </button>
        </form>
        
        <div className="modal-footer">
          {isRegistering ? 'Already have an account? ' : 'Need an account? '}
          <button onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}>
            {isRegistering ? 'Login here' : 'Register here'}
          </button>
        </div>
      </div>
    </div>
  );

  // ========================
  // LANDING PAGE (not logged in)
  // ========================
  if (!isLoggedIn) {
    return (
      <div className="landing-page">
        <div className="mesh-bg">
          <div className="mesh-blob blob-cyan" />
          <div className="mesh-blob blob-violet" />
          <div className="mesh-blob blob-magenta" />
          <div className="mesh-blob blob-blue" />
        </div>

        {/* Nav Bar */}
        <nav className="landing-nav">
          <div className="brand">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
            Social Analytics
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
          </div>
          <button className="nav-login-btn" onClick={openLoginModal}>
            <LogIn size={16} /> Log in
          </button>
        </nav>

        <div className="landing-content">
          {/* Hero */}
          <section className="hero-section">
            <div className="hero-badge">
              <span className="pulse-dot"></span>
              {publicMetrics.avgEngagement > 0 ? `${publicMetrics.avgEngagement.toFixed(2)}% avg engagement rate tracked` : 'Live sentiment & engagement tracking'}
            </div>
            <h1>Turn the noise into a narrative.</h1>
            <p>Analyze social media posts for engagement, sentiment, and trending topics. Understand what drives the conversation in real time.</p>
            <div className="hero-actions">
              <button className="primary-btn hero-cta" onClick={openLoginModal}>
                Get Started <ArrowRight size={18} />
              </button>
            </div>
          </section>

          {/* Product Preview Section */}
          <section className="preview-section">
            <div className="preview-window">
              <div className="preview-header">
                <div className="preview-dots"><span></span><span></span><span></span></div>
                <div className="preview-title">Social Analytics — The Big Picture</div>
              </div>
              <div className="preview-body">
                <div className="metrics-grid">
                  <div className="glass-card" style={{ borderLeftColor: '#38BDF8' }}>
                    <div className="metric-title">Posts Analyzed</div>
                    <div className="metric-value">2,500</div>
                  </div>
                  <div className="glass-card" style={{ borderLeftColor: '#8B5CF6' }}>
                    <div className="metric-title">Total Engagement</div>
                    <div className="metric-value">124,500</div>
                  </div>
                  <div className="glass-card" style={{ borderLeftColor: '#22D3EE' }}>
                    <div className="metric-title">Avg. Engagement Rate</div>
                    <div className="metric-value">4.98%</div>
                  </div>
                  <div className="glass-card" style={{ borderLeftColor: '#F59E0B' }}>
                    <div className="metric-title">Dominant Sentiment</div>
                    <div className="metric-value" style={{ color: 'var(--positive)' }}>Positive</div>
                  </div>
                </div>
                
                <div className="insights-callout" style={{ marginBottom: 0 }}>
                  <h3 className="insights-title"><Lightbulb size={16} /> Key Insights</h3>
                  <ul className="insights-list">
                    <li className="insight-item">
                      <span className="insight-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.15)' }}>
                        <TrendingUp size={18} />
                      </span>
                      <span className="insight-text">Engagement is trending upwards recently compared to earlier posts.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="features-section">
            <div className="section-header">
              <h2>Everything you need to understand your audience</h2>
              <p>Actionable metrics, sentiment analysis, and trend discovery all in one dashboard.</p>
            </div>
            
            <div className="features-grid">
              <div className="glass-card feature-card" style={{ borderLeftColor: '#38BDF8' }}>
                <div className="feature-icon" style={{ color: '#38BDF8', background: 'rgba(56, 189, 248, 0.1)' }}>
                  <LayoutDashboard size={24} />
                </div>
                <h3>Overview Dashboard</h3>
                <p>Track your core metrics like total engagement and average engagement rate at a single glance.</p>
              </div>
              <div className="glass-card feature-card" style={{ borderLeftColor: '#8B5CF6' }}>
                <div className="feature-icon" style={{ color: '#8B5CF6', background: 'rgba(139, 92, 246, 0.1)' }}>
                  <MessageSquareText size={24} />
                </div>
                <h3>Sentiment Analysis</h3>
                <p>Automatically classify posts as positive, negative, or neutral to understand the vibe of your audience.</p>
              </div>
              <div className="glass-card feature-card" style={{ borderLeftColor: '#22D3EE' }}>
                <div className="feature-icon" style={{ color: '#22D3EE', background: 'rgba(34, 211, 238, 0.1)' }}>
                  <Lightbulb size={24} />
                </div>
                <h3>Trending Words</h3>
                <p>Discover exactly which topics and hashtags are driving the most conversation in your niche.</p>
              </div>
              <div className="glass-card feature-card" style={{ borderLeftColor: '#F59E0B' }}>
                <div className="feature-icon" style={{ color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)' }}>
                  <Database size={24} />
                </div>
                <h3>Data & Methodology</h3>
                <p>Get a transparent view into the raw data and see exactly how it is collected, cleaned, and analyzed.</p>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" className="how-it-works-section">
            <div className="section-header">
              <h2>How it works</h2>
              <p>From raw data to actionable insights in seconds.</p>
            </div>
            
            <div className="steps-container">
              <div className="step-card">
                <div className="step-icon"><Database size={28} /></div>
                <h4>1. Collect</h4>
                <p>Gather data across all your connected social platforms.</p>
              </div>
              <div className="step-arrow"><ArrowRight size={24} /></div>
              <div className="step-card">
                <div className="step-icon"><Filter size={28} /></div>
                <h4>2. Clean</h4>
                <p>Automatically remove noise, URLs, and filter spam.</p>
              </div>
              <div className="step-arrow"><ArrowRight size={24} /></div>
              <div className="step-card">
                <div className="step-icon"><Activity size={28} /></div>
                <h4>3. Analyze</h4>
                <p>Apply sentiment scoring and keyword frequency logic.</p>
              </div>
              <div className="step-arrow"><ArrowRight size={24} /></div>
              <div className="step-card">
                <div className="step-icon"><LayoutDashboard size={28} /></div>
                <h4>4. Visualize</h4>
                <p>Explore your insights through interactive dashboards.</p>
              </div>
            </div>
          </section>

          {/* Footer & Final CTA */}
          <section className="cta-section">
            <h2>Ready to see the big picture?</h2>
            <p>Join today and start making sense of your social data.</p>
            <button className="primary-btn hero-cta" onClick={openLoginModal}>
              Get Started Now <ArrowRight size={18} />
            </button>
          </section>
          
          <footer className="landing-footer">
            <div className="footer-brand">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                <path d="M22 12A10 10 0 0 0 12 2v10z" />
              </svg>
              Social Analytics
            </div>
            <div className="footer-links">
              <a href="#">Terms of Service</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Contact</a>
            </div>
            <div className="footer-copy">
              &copy; {new Date().getFullYear()} Social Analytics. All rights reserved.
            </div>
          </footer>
        </div>

        {authModal}
      </div>
    );
  }

  // --- Comparison Row ---
  const renderComparisonRow = () => {
    if (overviewMode !== 'personal') return null;

    const engDiff = globalMetrics.avgEngagement - publicMetrics.avgEngagement;
    const engPercent = publicMetrics.avgEngagement > 0 ? Math.abs(engDiff / publicMetrics.avgEngagement) * 100 : 0;
    const engDirection = engDiff >= 0 ? '+' : '-';
    const engColor = engDiff >= 0 ? '#10b981' : '#f59e0b';

    const sentPercent = sentimentPercentile;
    const sentDirection = sentPercent >= 50 ? '+' : '-';
    const sentColor = sentPercent >= 50 ? '#10b981' : '#f59e0b';
    const sentText = sentPercent >= 50 ? `More positive than ${sentPercent}% of public posts` : `Less positive than ${100 - sentPercent}% of public posts`;

    return (
      <div className="metrics-grid comparison-row" style={{ marginTop: '-1rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ borderLeftColor: engColor, padding: '1rem 1.25rem' }}>
          <div className="metric-title">Vs. Public Engagement</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: engColor }}>{engDirection === '+' ? '▲' : '▼'} {engPercent.toFixed(0)}%</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>vs platform average</span>
          </div>
        </div>
        <div className="glass-card" style={{ borderLeftColor: sentColor, padding: '1rem 1.25rem' }}>
          <div className="metric-title">Vs. Public Sentiment</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: sentColor }}>{sentDirection === '+' ? '▲' : '▼'}</span>
            <span>{sentText}</span>
          </div>
        </div>
      </div>
    );
  };

  // --- Insights Callout ---
  const renderInsights = () => {
    if (generatedInsights.length === 0) return null;
    return (
      <div className="insights-callout">
        <h3 className="insights-title"><Lightbulb size={16} /> Key Insights</h3>
        <ul className="insights-list">
          {generatedInsights.map((insight, idx) => (
            <li key={idx} className="insight-item">
              <span className="insight-icon" style={{ color: insight.color, background: `${insight.color}15` }}>
                {insight.icon}
              </span>
              <span className="insight-text">{insight.text}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // ========================
  // MAIN DASHBOARD (logged in)
  // ========================
  return (
    <div className={`dashboard-layout ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar */}
      <div className="dash-sidebar">
        <div className="sidebar-brand">
          {!isSidebarCollapsed && (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                <path d="M22 12A10 10 0 0 0 12 2v10z" />
              </svg>
              <span>Social Analytics</span>
            </>
          )}
          {isSidebarCollapsed && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', flexShrink: 0 }}>
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
          )}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="sidebar-toggle" title="Toggle Sidebar">
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />} 
          </button>
        </div>
        <div className="sidebar-divider" />
        
        <div className="sidebar-nav">
          <button className={`sidebar-nav-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')} title="The Big Picture">
            <LayoutDashboard size={18} style={{ flexShrink: 0 }} /> <span className="sidebar-nav-btn-text">The Big Picture</span>
          </button>
          <button className={`sidebar-nav-btn ${activeTab === 'sentiment' ? 'active' : ''}`} onClick={() => setActiveTab('sentiment')} title="Vibe Check">
            <MessageSquareText size={18} style={{ flexShrink: 0 }} /> <span className="sidebar-nav-btn-text">Vibe Check</span>
          </button>
          <button className={`sidebar-nav-btn ${activeTab === 'sandbox' ? 'active' : ''}`} onClick={() => setActiveTab('sandbox')} title="Viral Lab">
            <Lightbulb size={18} style={{ flexShrink: 0 }} /> <span className="sidebar-nav-btn-text">Viral Lab</span>
          </button>
          <button className={`sidebar-nav-btn ${activeTab === 'data' ? 'active' : ''}`} onClick={() => setActiveTab('data')} title="Data Vault">
            <Database size={18} style={{ flexShrink: 0 }} /> <span className="sidebar-nav-btn-text">Data Vault</span>
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-divider" />
          <div className="user-row">
            {!isSidebarCollapsed && (
              <>
                <div className="user-avatar">{username ? username.charAt(0).toUpperCase() : 'U'}</div>
                <div className="user-info">
                  <span className="user-welcome">Welcome, {username}</span>
                  <button onClick={handleLogout} className="sidebar-logout">
                    <LogOut size={14} /> <span>Logout</span>
                  </button>
                </div>
              </>
            )}
            {isSidebarCollapsed && (
              <button onClick={handleLogout} className="sidebar-logout-icon" title="Logout">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dash-main-content">
        <div className="dashboard-container" style={{ paddingTop: '2.5rem' }}>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.65rem' }}>
            <button className={`tab-btn ${overviewMode === 'public' ? 'active' : ''}`} onClick={() => setOverviewMode('public')}>
              Overall Public
            </button>
            <button className={`tab-btn ${overviewMode === 'personal' ? 'active' : ''}`} onClick={() => setOverviewMode('personal')}>
              Personal Overview
            </button>
          </div>
          {overviewMode === 'personal' && (
            <div className="glass-card" style={{ marginBottom: '2rem' }}>
              <div className="chart-header" style={{ border: 'none', margin: 0 }}>Linked Accounts</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Link your specific social media accounts by selecting the platform and entering your username on that platform.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <select 
                  className="input-field" 
                  style={{ margin: 0, width: '150px' }}
                  value={newLinkedPlatform}
                  onChange={(e) => setNewLinkedPlatform(e.target.value)}
                >
                  <option value="Instagram">Instagram</option>
                  <option value="Twitter">Twitter</option>
                  <option value="Reddit">Reddit</option>
                  <option value="Facebook">Facebook</option>
                  <option value="TikTok">TikTok</option>
                </select>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ margin: 0, flex: 1 }} 
                  placeholder="Enter username for this platform..."
                  value={newLinkedAccount}
                  onChange={(e) => setNewLinkedAccount(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLinkedAccount()}
                />
                <button className="primary-btn" onClick={handleAddLinkedAccount} style={{ padding: '0.5rem 1rem', width: 'auto' }}>Link Account</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {linkedAccounts.map((account, idx) => (
                  <span key={idx} style={{ background: 'rgba(59, 110, 143, 0.1)', color: 'var(--steel)', padding: '0.25rem 0.75rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(59, 110, 143, 0.25)', fontSize: '0.9rem' }}>
                    <strong>{account.platform}:</strong> {account.username}
                    <button onClick={() => handleRemoveLinkedAccount(account)} style={{ background: 'none', border: 'none', color: 'var(--steel)', cursor: 'pointer', padding: 0, fontSize: '1.2rem', lineHeight: 1, marginLeft: '0.25rem' }}>&times;</button>
                  </span>
                ))}
                {linkedAccounts.length === 0 && <span style={{ color: 'var(--text-muted)' }}>No accounts linked yet.</span>}
              </div>
            </div>
          )}
          <div className="metrics-grid">
            <div className="glass-card">
              <div className="metric-title">Posts Analyzed</div>
              <div className="metric-value">{globalMetrics.total.toLocaleString()}</div>
            </div>
            <div className="glass-card">
              <div className="metric-title">Total Engagement</div>
              <div className="metric-value">{globalMetrics.engagement.toLocaleString()}</div>
            </div>
            <div className="glass-card">
              <div className="metric-title">Avg. Engagement Rate</div>
              <div className="metric-value">{globalMetrics.avgEngagement.toFixed(2)}%</div>
            </div>
            <div className="glass-card">
              <div className="metric-title">Dominant Sentiment</div>
              <div className="metric-value" style={{ textTransform: 'capitalize', color: SENTIMENT_COLORS[globalMetrics.dominantSentiment] || 'var(--navy)' }}>
                {globalMetrics.dominantSentiment}
              </div>
            </div>
          </div>
          {renderComparisonRow()}
          {renderInsights()}
          <div className="charts-grid">
            <div className="glass-card">
              <div className="chart-header">Daily Post Volume</div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Line type="monotone" dataKey="count" stroke="#38BDF8" strokeWidth={2.5} dot={{ r: 3, fill: '#38BDF8' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass-card">
              <div className="chart-header">Posts by Platform</div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="count" fill="#8884d8">
                      {platformData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PLATFORM_COLORS[index % PLATFORM_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sentiment Tab */}
      {activeTab === 'sentiment' && (
        <>
          <div className="charts-grid">
            <div className="glass-card">
              <div className="chart-header">Sentiment Distribution</div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={sentimentData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={80} 
                      outerRadius={120} 
                      paddingAngle={5} 
                      dataKey="value" 
                      label={({name, value, percent}) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`} 
                      labelLine={false}
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value) => [`${value} posts`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="glass-card">
              <div className="chart-header">Top Words & Hashtags</div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topWordsData} layout="vertical" margin={{ top: 5, right: 40, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#6B7280" hide />
                    <YAxis dataKey="word" type="category" stroke="#6B7280" axisLine={false} tickLine={false} width={100} />
                    <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: 'rgba(56, 189, 248, 0.05)' }} formatter={(value) => [`${value} occurrences`, 'Frequency']} />
                    <Bar dataKey="count" fill="#38BDF8" radius={[0, 4, 4, 0]}>
                      <LabelList dataKey="count" position="right" fill="var(--text-muted)" fontSize={12} />
                      {topWordsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.word.startsWith('#') ? '#8B5CF6' : '#38BDF8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sandbox Tab */}
      {activeTab === 'sandbox' && (
        <div className="sandbox-container">
          <div className="glass-card">
            <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: "'IBM Plex Sans', sans-serif", color: 'var(--navy)' }}>
              <Lightbulb color="#f59e0b" /> Idea Sandbox
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Draft your social media post below. Our engine will analyze it against historical data to predict performance and suggest improvements.
            </p>
            
            <textarea 
              className="sandbox-textarea"
              placeholder="Type your draft post here... (e.g., Just watched the new #Cinema movie. It was amazing!)"
              value={draftIdea}
              onChange={(e) => setDraftIdea(e.target.value)}
            ></textarea>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="primary-btn" onClick={analyzeIdea} disabled={isAnalyzing}>
                <Send size={18} /> {isAnalyzing ? 'Analyzing...' : 'Analyze Idea'}
              </button>
            </div>
          </div>

          {sandboxFeedback.length > 0 && (
            <div className="glass-card" style={{ marginTop: '2rem', border: '1px solid rgba(59, 110, 143, 0.2)' }}>
              <h3 style={{ marginBottom: '1.25rem', color: 'var(--steel)', fontFamily: "'IBM Plex Sans', sans-serif" }}>Analysis Results</h3>
              <div className="suggestions-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sandboxFeedback.map((fb, i) => (
                  <div key={i} className={`suggestion-card suggestion-${fb.type}`}>
                    <p>{fb.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Raw Data Tab */}
      {activeTab === 'data' && (
        <>
          <div className="charts-grid" style={{ marginBottom: '2rem' }}>
            {/* Methodology Panel */}
            <div className="glass-card" style={{ borderLeftColor: '#8B5CF6' }}>
              <div className="chart-header">Data Source & Methodology</div>
              <div style={{ color: 'var(--text-body)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                <p style={{ marginBottom: '1rem' }}>
                  This dashboard is powered by a dataset of <strong>{data.length.toLocaleString()}</strong> social media posts.
                </p>
                <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                  <li><strong>Date Range:</strong> {dateRange.min} to {dateRange.max}</li>
                  <li><strong>Platforms:</strong> Twitter, Reddit, Instagram, Facebook, TikTok</li>
                  <li><strong>Collection:</strong> Public API aggregators and simulated scraping for demonstration.</li>
                </ul>
                <p><strong>Known Limitations:</strong></p>
                <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-muted)' }}>
                  <li>"Linked Accounts" generate synthetic data that is dynamically appended to this dataset.</li>
                  <li>Sentiment analysis struggles with deep sarcasm and highly contextual internet slang.</li>
                </ul>
              </div>
            </div>

            {/* Preprocessing Example */}
            <div className="glass-card" style={{ borderLeftColor: '#38BDF8' }}>
              <div className="chart-header">Preprocessing Pipeline</div>
              <div style={{ color: 'var(--text-body)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                <strong>Steps Applied:</strong>
                <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                  <li>Lowercasing all text</li>
                  <li>URL and mention (@) stripping</li>
                  <li>Punctuation and special character removal</li>
                  <li>Basic stopword filtering</li>
                </ul>
                
                {data.length > 0 && (() => {
                  const example = data.find(d => d.text && d.cleaned_text && d.text.trim() !== d.cleaned_text.trim()) || data[0];
                  return (
                    <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#f43f5e' }}>Raw Input</span>
                        <div style={{ fontStyle: 'italic', marginTop: '0.25rem', color: 'var(--text-muted)' }}>"{example.text}"</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#10b981' }}>Cleaned Output</span>
                        <div style={{ marginTop: '0.25rem', color: 'var(--navy)', fontWeight: '500' }}>"{example.cleaned_text}"</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="glass-card table-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="chart-header" style={{ margin: 0, border: 'none' }}>Post Explorer</div>
              <a href="/data.csv" download className="tab-btn active" style={{ textDecoration: 'none' }}>
                <Download size={18} /> Download CSV
              </a>
            </div>
            
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              Showing {filteredPosts.length.toLocaleString()} of {data.length.toLocaleString()} posts
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <select 
                className="input-field" 
                style={{ margin: 0, width: '150px' }}
                value={platformFilter}
                onChange={(e) => { setPlatformFilter(e.target.value); setDisplayCount(20); setExpandedPosts(new Set()); }}
              >
                <option value="All">All Platforms</option>
                <option value="Twitter">Twitter</option>
                <option value="Reddit">Reddit</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="TikTok">TikTok</option>
              </select>
              
              <select 
                className="input-field" 
                style={{ margin: 0, width: '150px' }}
                value={sentimentFilter}
                onChange={(e) => { setSentimentFilter(e.target.value); setDisplayCount(20); setExpandedPosts(new Set()); }}
              >
                <option value="All">All Sentiments</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
              
              <input 
                type="text" 
                className="input-field" 
                style={{ margin: 0, flex: 1, minWidth: '200px' }} 
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setDisplayCount(20); setExpandedPosts(new Set()); }}
              />
            </div>

            {filteredPosts.length === 0 ? (
              <table>
                <tbody>
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', border: 'none' }}>
                      No posts match your filters
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <>
                <table>
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('Platform')} style={{ cursor: 'pointer', userSelect: 'none' }}>Platform {sortColumn === 'Platform' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                      <th>Post</th>
                      <th onClick={() => handleSort('Likes')} style={{ cursor: 'pointer', userSelect: 'none' }}>Likes {sortColumn === 'Likes' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                      <th onClick={() => handleSort('Engagement')} style={{ cursor: 'pointer', userSelect: 'none' }}>Engagement {sortColumn === 'Engagement' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                      <th onClick={() => handleSort('Sentiment')} style={{ cursor: 'pointer', userSelect: 'none' }}>Sentiment {sortColumn === 'Sentiment' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPosts.slice(0, displayCount).map((row, i) => {
                      const isExpanded = expandedPosts.has(i);
                      return (
                        <tr key={i} onClick={() => togglePostExpanded(i)} style={{ cursor: 'pointer' }}>
                          <td>{row.platform}</td>
                          <td style={{ 
                            maxWidth: '400px', 
                            whiteSpace: isExpanded ? 'normal' : 'nowrap', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis' 
                          }}>
                            {row.text}
                          </td>
                          <td>{row.likes?.toLocaleString()}</td>
                          <td>{row.total_engagement?.toLocaleString()}</td>
                          <td><span className={`sentiment-badge sentiment-${row.sentiment_label}`}>{row.sentiment_label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {displayCount < filteredPosts.length && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                    <button className="tab-btn" onClick={() => setDisplayCount(prev => prev + 20)}>
                      Load more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
        </div>
      </div>
    </div>
  );
}

export default App;
