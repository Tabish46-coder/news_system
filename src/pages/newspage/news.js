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
  FaHeartbeat,
  FaLanguage,
  FaUser,
  FaSignOutAlt,
  FaUserPlus,
  FaKey
} from 'react-icons/fa';
import './news.css';
import { useLocation, useNavigate } from 'react-router-dom';
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
  
  // Translation states
  const [translatedText, setTranslatedText] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  
  // User menu state
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Change password states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || 'Unknown';

  // Function to refresh saved articles
  const refreshSavedArticles = async () => {
    if (email === 'Unknown') return;
    
    try {
      const res = await fetch(`${url}/articles-by-email?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      
      if (res.ok) {
        const savedArticles = data.articles || [];
        
        // Transform the saved articles to match the expected format
        const transformedArticles = savedArticles.map(article => ({
          ...article,
          urlToImage: article.url_to_image,
          publishedAt: article.published_at,
          source: { name: article.source_name }
        }));
        
        setSaved(transformedArticles);
        
        // If currently on saved tab, also update articles display
        if (category === 'saved') {
          setArticles(transformedArticles);
        }
        
        console.log(`Refreshed ${transformedArticles.length} saved articles`);
      }
    } catch (err) {
      console.error('Error refreshing saved articles:', err);
    }
  };

  // Function to fetch recommendations
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

  // Handle change password
  const handleChangePassword = () => {
    setShowUserMenu(false);
    setShowPasswordModal(true);
    // Reset form
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      alert('Please fill in all fields');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    
    setUpdatingPassword(true);
    
    try {
      const response = await fetch(`${url}/update-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: passwordData.newPassword
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Password updated successfully!');
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        throw new Error(data.message || 'Failed to update password');
      }
      
    } catch (error) {
      console.error('Error updating password:', error);
      alert(`Failed to update password: ${error.message}`);
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    setShowUserMenu(false);
    // Clear any stored user data if needed
    navigate('/'); // Adjust path as needed
  };

  // Handle signup navigation
  const handleSignup = () => {
    setShowUserMenu(false);
    navigate('/signup'); // Adjust path as needed
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close article menu
      if (!event.target.closest('.menu-container')) {
        setActiveMenu(null);
      }
      // Close user menu
      if (!event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Load saved articles on component mount
  useEffect(() => {
    if (email !== 'Unknown') {
      refreshSavedArticles();
    }
  }, [email]);

  // Fetch recommendations when component mounts
  useEffect(() => {
    fetchRecommendations();
  }, [email]); // Added dependency array

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
          
          // Transform the saved articles to match the expected format
          const transformedArticles = savedArticles.map(article => ({
            ...article,
            urlToImage: article.url_to_image,
            publishedAt: article.published_at,
            source: { name: article.source_name }
          }));
          
          setArticles(transformedArticles);
          setSaved(transformedArticles);
          console.log(`Loaded ${transformedArticles.length} saved articles`);
          
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
      // For now, just show a message - you'd need a delete API endpoint to remove articles
      alert('Article is already saved. To remove it, go to the Saved tab.');
      setActiveMenu(null);
      return;
    }
    
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

      console.log('Saving article with data:', articleData);

      const response = await fetch(`${url}/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData)
      });

      const data = await response.json();
      console.log('Save response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save article');
      }

      // Add to saved state with the correct structure
      const savedArticle = {
        ...article,
        id: data.article_id,
        login_id: data.login_id
      };
      
      setSaved((prev) => [...prev, savedArticle]);
      console.log('Article saved successfully:', data.message);
      
      // Show success message
      alert('Article saved successfully!');
      
    } catch (error) {
      console.error('Error saving article:', error);
      alert(`Failed to save article: ${error.message}`);
    } finally {
      setSavingArticle(null);
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
      
      // Reset translation states when opening new summary
      setTranslatedText(null);
      setShowTranslation(false);
      
    } catch (error) {
      console.error('Summarization error:', error);
      alert(`Failed to summarize: ${error.message}`);
    } finally {
      setSummarizing(null);
    }
  };

  // Function to handle translation
  const handleTranslate = async () => {
    if (!summary?.summary) return;
    
    setIsTranslating(true);
    
    try {
      // Construct the URL with proper query parameter
      const translationUrl = `${url}/translate_urdu?text=${encodeURIComponent(summary.summary)}`;
      console.log('Translation URL:', translationUrl);
      
      const response = await fetch(translationUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      console.log('Translation response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to translate');
      }
      
      // Check if translated_text exists in response
      if (data.translated_text) {
        setTranslatedText(data.translated_text);
        setShowTranslation(true);
        console.log('Translation successful:', data.translated_text);
      } else {
        throw new Error('No translated text received from server');
      }
      
    } catch (error) {
      console.error('Translation error:', error);
      alert(`Failed to translate: ${error.message}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleNewsClick = (article) => {
    window.open(article.url, '_blank');
  };

  const handleMenuClick = (e, articleUrl) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === articleUrl ? null : articleUrl);
  };

  const handleUserMenuClick = (e) => {
    e.stopPropagation();
    setShowUserMenu(!showUserMenu);
  };

  const isSaved = (article) => saved.some((a) => a.url === article.url);

  const filteredArticles = articles.filter((art) =>
    art.title?.toLowerCase().includes(search.toLowerCase()) ||
    art.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Get display text for home tab
  const getHomeTabLabel = () => {
    if (category === 'home' && recommendedCategory) {
      return 'Home';
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

            {/* User Menu */}
            <div className="user-menu-container">
              <button 
                onClick={handleUserMenuClick}
                className="user-menu-button"
                title="User Menu"
              >
                <FaUser size={18} />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <span className="user-email">{email}</span>
                  </div>
                  <div className="user-dropdown-divider"></div>
                  <button
                    onClick={handleChangePassword}
                    className="user-dropdown-item"
                  >
                    <FaKey size={16} />
                    <span>Change Password</span>
                  </button>
                  <button
                    onClick={handleSignup}
                    className="user-dropdown-item"
                  >
                    <FaUserPlus size={16} />
                    <span>Sign Up</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="user-dropdown-item logout"
                  >
                    <FaSignOutAlt size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
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

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="password-modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="password-header">
              <h3>Change Password</h3>
              <button 
                className="close-button"
                onClick={() => setShowPasswordModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="password-form">
              <div className="password-content">
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    placeholder="Enter new password"
                    required
                    minLength="6"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    placeholder="Confirm new password"
                    required
                    minLength="6"
                  />
                </div>
              </div>
              
              <div className="password-footer">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="update-btn"
                  disabled={updatingPassword}
                >
                  {updatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Summary Modal with Translation */}
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
              
              {/* Original Summary */}
              <div className="summary-section">
                <div className="summary-section-header">
                  <h5>English Summary</h5>
                </div>
                <p className="summary-text">{summary.summary}</p>
              </div>

              {/* Translation Section */}
              {showTranslation && translatedText && (
                <div className="summary-section translation-section">
                  <div className="summary-section-header">
                    <h5>اردو ترجمہ (Urdu Translation)</h5>
                  </div>
                  <p className="summary-text urdu-text" dir="rtl">{translatedText}</p>
                </div>
              )}

              <div className="summary-footer">
                <div className="summary-actions">
                  <button 
                    className="translate-btn"
                    onClick={handleTranslate}
                    disabled={isTranslating}
                  >
                    <FaLanguage size={16} />
                    <span>
                      {isTranslating 
                        ? 'Translating...' 
                        : showTranslation 
                          ? 'Translate Again' 
                          : 'Translate to Urdu'
                      }
                    </span>
                  </button>
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
        </div>
      )}
    </div>
  );
}