import React, { useEffect, useState } from 'react';
import {
  FaEllipsisV,
  FaRegHeart,
  FaHeart,
  FaSearch,
  FaBars,
  FaBookmark,
  FaHome,
  FaLaptop,
  FaBolt,
  FaFlask,
  FaHeartbeat
} from 'react-icons/fa';
import './news.css';
import { useLocation } from 'react-router-dom';
import { url } from '../Api';

const CATEGORIES = [
  { id: 'home', label: 'Home', icon: FaHome },
  { id: 'sports', label: 'Sports', icon: FaBolt },
  { id: 'technology', label: 'Tech', icon: FaLaptop },
  { id: 'science', label: 'Science', icon: FaFlask },
  { id: 'health', label: 'Health', icon: FaHeartbeat }
];

export default function NewsPage() {
  const [category, setCategory] = useState('home');
  const [articles, setArticles] = useState([]);
  const [saved, setSaved] = useState([]);
  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingArticle, setSavingArticle] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [summarizing, setSummarizing] = useState(null);
  const [summary, setSummary] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [recommendedCategory, setRecommendedCategory] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const location = useLocation();
  const email = location.state?.email || 'Unknown';

  // Function to refresh saved articles
  const refreshSavedArticles = async () => {
    if (email === 'Unknown') return;
    
    try {
      const res = await fetch(`${url}/articles-by-email?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      
      if (res.ok) {
        const savedArticles = data.articles || [];
        setSaved(savedArticles);
        
        // If currently on saved tab, also update articles display
        if (category === 'saved') {
          setArticles(savedArticles);
        }
      }
    } catch (err) {
      console.error('Error refreshing saved articles:', err);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch recommendations when component mounts
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (email === 'Unknown') return;
      
      setLoadingRecommendations(true);
      try {
        const res = await fetch(`${url}/recommend_categories?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        
        if (res.ok && data.recommended_categories && data.recommended_categories.length > 0) {
          // Get the best recommended category (first in the array)
          const bestCategory = data.recommended_categories[0];
          setRecommendedCategory(bestCategory);
          console.log('Recommended categories:', data.recommended_categories);
          console.log('Best category for user:', bestCategory);
        } else {
          console.log('No recommendations available or error:', data.error);
          // Fallback to 'general' if no recommendations
          setRecommendedCategory('general');
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        // Fallback to 'general' on error
        setRecommendedCategory('general');
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
  }, [email]);

  // Fetch articles when category changes
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        if (category === 'saved') {
          // Fetch saved articles from API
          if (email === 'Unknown') {
            console.error('Email not available for fetching saved articles');
            setArticles([]);
            return;
          }
          
          console.log('Fetching saved articles for user:', email);
          const res = await fetch(`${url}/articles-by-email?email=${encodeURIComponent(email)}`);
          const data = await res.json();
          
          if (!res.ok) {
            throw new Error(data.error || 'Failed to fetch saved articles');
          }
          
          // Update both articles and saved state
          const savedArticles = data.articles || [];
          setArticles(savedArticles);
          setSaved(savedArticles);
          console.log(`Loaded ${savedArticles.length} saved articles`);
          
        } else {
          // Fetch regular news articles
          let categoryToFetch = category;
          
          // If on home tab and we have a recommended category, use it
          if (category === 'home' && recommendedCategory) {
            categoryToFetch = recommendedCategory;
            console.log(`Fetching ${recommendedCategory} articles for home tab based on user preferences`);
          }
          
          const res = await fetch(`${url}/news?category=${categoryToFetch}`);
          const data = await res.json();
          setArticles(data.articles || []);
        }
      } catch (err) {
        console.error('Error fetching articles:', err);
        setArticles([]);
        if (category === 'saved') {
          alert(`Failed to load saved articles: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    // Only fetch articles if we're not loading recommendations or if we're not on home tab
    if (!loadingRecommendations || category !== 'home') {
      fetchArticles();
    }
  }, [category, recommendedCategory, loadingRecommendations, email]);

  const toggleSave = async (article) => {
    const isCurrentlySaved = saved.some((a) => a.url === article.url);
    
    if (isCurrentlySaved) {
      // Remove from saved (local state only)
      setSaved((prev) => prev.filter((a) => a.url !== article.url));
    } else {
      // Add to saved - call API
      setSavingArticle(article.url);
      
      try {
        const articleData = {
          title: article.title,
          description: article.description,
          content: article.content,
          author: article.author,
          published_at: article.publishedAt || article.published_at,
          source_name: article.source?.name || article.source_name,
          url: article.url,
          url_to_image: article.urlToImage || article.url_to_image,
          category: category === 'home' ? (recommendedCategory || 'general') : category,
          email: email
        };

        const response = await fetch(`${url}/articles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(articleData)
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to save article');
        }

        setSaved((prev) => [...prev, article]);
        console.log('Article saved successfully:', data.message);
        
      } catch (error) {
        console.error('Error saving article:', error);
        alert(`Failed to save article: ${error.message}`);
      } finally {
        setSavingArticle(null);
      }
    }
    
    setActiveMenu(null);
  };

  const handleSummarize = async (article) => {
    setSummarizing(article.url);
    setActiveMenu(null);
    
    try {
      const response = await fetch(`${url}/summarize?url=${encodeURIComponent(article.url)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to summarize');
      }
      
      setSummary({
        title: article.title,
        summary: data.summary,
        originalUrl: article.url
      });
      setShowSummaryModal(true);
    } catch (error) {
      console.error('Summarization error:', error);
      alert(`Failed to summarize: ${error.message}`);
    } finally {
      setSummarizing(null);
    }
  };

  const handleNewsClick = (article) => {
    window.open(article.url, '_blank');
  };

  const handleMenuClick = (e, articleUrl) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === articleUrl ? null : articleUrl);
  };

  const isSaved = (article) => saved.some((a) => a.url === article.url);

  const filteredArticles = articles.filter((art) =>
    art.title?.toLowerCase().includes(search.toLowerCase()) ||
    art.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Get display text for home tab
  const getHomeTabLabel = () => {
    if (category === 'home' && recommendedCategory) {
      const categoryMap = {
        'sports': 'Sports',
        'technology': 'Tech',
        'science': 'Science',
        'health': 'Health',
        'general': 'General',
        'business': 'Business',
        'entertainment': 'Entertainment'
      };
      return `Home`;
    }
    return 'Home';
  };

  return (
    <div className="news-app">
      {/* ENHANCED NAVBAR */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-content">
            {/* Logo */}
            <div className="logo-section">
              <div className="logo-icon">
                <span>P</span>
              </div>
              <span className="logo-text">Personalized News</span>
            </div>

            {/* Category Buttons */}
            <div className="nav-categories">
              {CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`nav-button ${category === cat.id ? 'active' : ''}`}
                  >
                    <IconComponent size={16} />
                    <span>{cat.id === 'home' ? getHomeTabLabel() : cat.label}</span>
                  </button>
                );
              })}
              <button
                onClick={() => setCategory('saved')}
                className={`nav-button ${category === 'saved' ? 'active' : ''}`}
              >
                <FaBookmark size={16} />
                <span>Saved ({saved.length})</span>
              </button>
            </div>

            {/* Mobile Menu */}
            <div className="mobile-menu">
              <FaBars size={24} />
            </div>
          </div>
        </div>
      </nav>

      {/* ENHANCED SEARCH BAR */}
      <div className="search-section">
        <div className="search-container">
          <div className="search-wrapper">
            <div className={`search-icon ${isSearchFocused ? 'focused' : ''}`}>
              <FaSearch size={20} />
            </div>
            <input
              type="text"
              placeholder="Search news articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {/* Show recommendation status for home tab */}
      {category === 'home' && (
        <div className="recommendation-status">
          {loadingRecommendations ? (
            <p>Loading personalized recommendations...</p>
          ) : recommendedCategory ? (
            <p>Showing personalized {recommendedCategory} news based on your interests</p>
          ) : (
            <p>Showing general news</p>
          )}
        </div>
      )}

      {/* Show saved articles status */}
      {category === 'saved' && !loading && (
        <div className="recommendation-status">
          <p>Your saved articles ({articles.length})</p>
        </div>
      )}

      {/* LOADING SPINNER */}
      {(loading || (category === 'home' && loadingRecommendations)) && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>
            {loadingRecommendations 
              ? 'Loading personalized recommendations...' 
              : 'Loading articles...'
            }
          </p>
        </div>
      )}

      {/* BEAUTIFUL NEWS GRID */}
      <div className="news-container">
        {!loading && !loadingRecommendations && filteredArticles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaSearch size={48} />
            </div>
            <h3>No articles found</h3>
            <p>Try adjusting your search terms or browse different categories.</p>
          </div>
        ) : (
          <div className="news-grid">
            {filteredArticles.map((article) => (
              <article 
                key={article.url} 
                className="news-card-modern"
                onClick={() => handleNewsClick(article)}
                style={{ cursor: 'pointer' }}
              >
                {/* Image Container */}
                <div className="card-image-container">
                  <img
                    src={article.urlToImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=600&fit=crop'}
                    alt={article.title}
                    className="card-image"
                  />
                  <div className="image-overlay"></div>
                  
                  {/* Save Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSave(article);
                    }}
                    className="save-button"
                  >
                    {isSaved(article) ? (
                      <FaHeart size={18} className="heart-icon saved" />
                    ) : (
                      <FaRegHeart size={18} className="heart-icon" />
                    )}
                  </button>

                  {/* 3-Dot Menu Button */}
                  <div className="menu-container">
                    <button
                      onClick={(e) => handleMenuClick(e, article.url)}
                      className="menu-button"
                    >
                      <FaEllipsisV size={16} />
                    </button>

                    {/* Dropdown Menu */}
                    {activeMenu === article.url && (
                      <div className="dropdown-menu">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSave(article);
                          }}
                          className="dropdown-item"
                          disabled={savingArticle === article.url}
                        >
                          {savingArticle === article.url 
                            ? 'Saving...' 
                            : (isSaved(article) ? 'Remove from Saved' : 'Save News')
                          }
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSummarize(article);
                          }}
                          className="dropdown-item"
                          disabled={summarizing === article.url}
                        >
                          {summarizing === article.url ? 'Summarizing...' : 'Summarize News'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="card-content">
                  <h2 className="card-title">{article.title}</h2>
                  <p className="card-description">{article.description}</p>
                  
                  {/* Read More Link */}
                  <div className="card-footer">
                    <span className="read-more">Read more →</span>
                    <div className="read-more-icon">→</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Category Navigation */}
      <div className="mobile-nav">
        <div className="mobile-nav-content">
          {CATEGORIES.slice(0, 4).map((cat) => {
            const IconComponent = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`mobile-nav-button ${category === cat.id ? 'active' : ''}`}
              >
                <IconComponent size={20} />
                <span>{cat.id === 'home' ? 'Home' : cat.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setCategory('saved')}
            className={`mobile-nav-button ${category === 'saved' ? 'active' : ''}`}
          >
            <FaBookmark size={20} />
            <span>Saved</span>
          </button>
        </div>
      </div>

      {/* Summary Modal */}
      {showSummaryModal && summary && (
        <div className="summary-modal-overlay" onClick={() => setShowSummaryModal(false)}>
          <div className="summary-modal" onClick={(e) => e.stopPropagation()}>
            <div className="summary-header">
              <h3>Article Summary</h3>
              <button 
                className="close-button"
                onClick={() => setShowSummaryModal(false)}
              >
                ×
              </button>
            </div>
            <div className="summary-content">
              <h4 className="summary-title">{summary.title}</h4>
              <p className="summary-text">{summary.summary}</p>
              <div className="summary-footer">
                <button 
                  className="read-original-btn"
                  onClick={() => window.open(summary.originalUrl, '_blank')}
                >
                  Read Original Article
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}