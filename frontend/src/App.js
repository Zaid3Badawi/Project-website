import React, { useEffect, useState, createContext, useContext } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { access_token, user: userData } = response.data;
    
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setUser(userData);
    
    return userData;
  };

  const register = async (email, password, full_name, age) => {
    const response = await axios.post(`${API}/auth/register`, { 
      email, password, full_name, age 
    });
    const { access_token, user: userData } = response.data;
    
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setUser(userData);
    
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Landing Page Component
const LandingPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, fullName, parseInt(age) || null);
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1502325966718-85a90488dc29?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHxtZWRpdGF0aW9ufGVufDB8fHxibHVlfDE3NTMzMzc1NTd8MA&ixlib=rb-4.1.0&q=85')`
          }}
        />
        
        <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Welcome to <span className="text-blue-600">MindMate</span>
            </h1>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Your comprehensive wellness companion for maintaining mental and physical health. 
              Build better habits, track your wellness journey, and connect with a supportive community.
            </p>
            
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="font-semibold text-gray-900 mb-2">Habit Tracking</h3>
                <p className="text-sm text-gray-600">Build lasting habits with daily check-ins and streak tracking</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-semibold text-gray-900 mb-2">Wellness Dashboard</h3>
                <p className="text-sm text-gray-600">Monitor mood, stress, and productivity with beautiful insights</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
                <div className="text-3xl mb-3">👥</div>
                <h3 className="font-semibold text-gray-900 mb-2">Social Support</h3>
                <p className="text-sm text-gray-600">Connect with friends and join community challenges</p>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {isLogin ? 'Welcome Back!' : 'Join MindMate'}
              </h2>
              <p className="text-gray-600">
                {isLogin ? 'Sign in to continue your wellness journey' : 'Start your wellness journey today'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age (Optional)
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your age"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Navigation Component
const Navigation = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">MindMate</span>
            </div>
            
            <div className="hidden md:flex space-x-8">
              {['dashboard', 'habits', 'wellness', 'social', 'challenges'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`capitalize px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">Welcome, {user.full_name}</span>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/wellness/dashboard`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div 
        className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8)), url('https://images.unsplash.com/photo-1527137342181-19aab11a8ee8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwxfHxtZW50YWwlMjBoZWFsdGh8ZW58MHx8fGJsdWV8MTc1MzMzNzU1MHww&ixlib=rb-4.1.0&q=85')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Your Wellness Journey</h1>
          <p className="text-blue-100 mb-6">Keep up the great work! Here's your progress overview.</p>
          
          {dashboardData && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 inline-block">
              <div className="text-2xl font-bold">{dashboardData.wellness_score}%</div>
              <div className="text-sm text-blue-100">Overall Wellness Score</div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🎯</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{dashboardData.habit_completion_rate}%</div>
                <div className="text-sm text-gray-600">Habit Completion</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">😊</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{dashboardData.mood_average}/5</div>
                <div className="text-sm text-gray-600">Average Mood</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🧘</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{dashboardData.stress_average}/5</div>
                <div className="text-sm text-gray-600">Stress Level</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">⚡</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{dashboardData.productivity_average}/10</div>
                <div className="text-sm text-gray-600">Productivity</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 text-left transition-colors">
            <div className="text-2xl mb-2">📝</div>
            <div className="font-semibold text-gray-900">Log Mood</div>
            <div className="text-sm text-gray-600">Record how you're feeling today</div>
          </button>
          
          <button className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 text-left transition-colors">
            <div className="text-2xl mb-2">✅</div>
            <div className="font-semibold text-gray-900">Check-in Habit</div>
            <div className="text-sm text-gray-600">Mark your daily habits complete</div>
          </button>
          
          <button className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg p-4 text-left transition-colors">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-semibold text-gray-900">View Progress</div>
            <div className="text-sm text-gray-600">See your wellness trends</div>
          </button>
        </div>
      </div>
    </div>
  );
};

// Habits Component
const Habits = () => {
  const [habits, setHabits] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    category: 'exercise',
    target_frequency: 1
  });

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const response = await axios.get(`${API}/habits`);
      setHabits(response.data);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const createHabit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/habits`, newHabit);
      setNewHabit({ name: '', description: '', category: 'exercise', target_frequency: 1 });
      setShowCreateForm(false);
      fetchHabits();
    } catch (error) {
      console.error('Error creating habit:', error);
    }
  };

  const checkInHabit = async (habitId) => {
    try {
      await axios.post(`${API}/habits/${habitId}/checkin`, { completed: true });
      fetchHabits(); // Refresh to show updated streak
    } catch (error) {
      console.error('Error checking in habit:', error);
    }
  };

  const categoryEmojis = {
    exercise: '💪',
    nutrition: '🥗',
    mental_health: '🧠',
    productivity: '⚡',
    social: '👥',
    sleep: '😴',
    learning: '📚'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">My Habits</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          + Create Habit
        </button>
      </div>

      {/* Create Habit Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Habit</h2>
            <form onSubmit={createHabit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({...newHabit, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Morning Exercise"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({...newHabit, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional description"
                  rows="3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newHabit.category}
                  onChange={(e) => setNewHabit({...newHabit, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="exercise">Exercise</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="mental_health">Mental Health</option>
                  <option value="productivity">Productivity</option>
                  <option value="social">Social</option>
                  <option value="sleep">Sleep</option>
                  <option value="learning">Learning</option>
                </select>
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Habits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits.map((habit) => (
          <div key={habit.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{categoryEmojis[habit.category]}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{habit.name}</h3>
                  <p className="text-sm text-gray-600 capitalize">{habit.category.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Streak</div>
                <div className="text-xl font-bold text-blue-600">{habit.current_streak}</div>
              </div>
            </div>
            
            {habit.description && (
              <p className="text-sm text-gray-600 mb-4">{habit.description}</p>
            )}
            
            <button
              onClick={() => checkInHabit(habit.id)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              ✓ Check In Today
            </button>
          </div>
        ))}
      </div>

      {habits.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No habits yet</h3>
          <p className="text-gray-600 mb-6">Create your first habit to start building a better you!</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Create Your First Habit
          </button>
        </div>
      )}
    </div>
  );
};

// Wellness Component (Mood & Stress Tracking)
const Wellness = () => {
  const [activeTab, setActiveTab] = useState('mood');
  const [moodLevel, setMoodLevel] = useState(3);
  const [moodNotes, setMoodNotes] = useState('');
  const [stressLevel, setStressLevel] = useState(3);
  const [stressNotes, setStressNotes] = useState('');
  const [productivityScore, setProductivityScore] = useState(5);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [focusTime, setFocusTime] = useState(0);
  const [productivityNotes, setProductivityNotes] = useState('');

  const logMood = async () => {
    try {
      await axios.post(`${API}/wellness/mood`, {
        mood_level: moodLevel,
        notes: moodNotes
      });
      setMoodNotes('');
      alert('Mood logged successfully!');
    } catch (error) {
      console.error('Error logging mood:', error);
    }
  };

  const logStress = async () => {
    try {
      await axios.post(`${API}/wellness/stress`, {
        stress_level: stressLevel,
        notes: stressNotes
      });
      setStressNotes('');
      alert('Stress level logged successfully!');
    } catch (error) {
      console.error('Error logging stress:', error);
    }
  };

  const logProductivity = async () => {
    try {
      await axios.post(`${API}/wellness/productivity`, {
        productivity_score: productivityScore,
        tasks_completed: tasksCompleted,
        focus_time_minutes: focusTime,
        notes: productivityNotes
      });
      setTasksCompleted(0);
      setFocusTime(0);
      setProductivityNotes('');
      alert('Productivity logged successfully!');
    } catch (error) {
      console.error('Error logging productivity:', error);
    }
  };

  const moodEmojis = ['😢', '😕', '😐', '😊', '😄'];
  const stressEmojis = ['😌', '🙂', '😐', '😰', '😱'];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Wellness Tracking</h1>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['mood', 'stress', 'productivity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Mood Tracking */}
      {activeTab === 'mood' && (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
          <h2 className="text-xl font-semibold mb-6">How are you feeling today?</h2>
          
          <div className="mb-6">
            <div className="flex justify-center space-x-4 mb-4">
              {moodEmojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => setMoodLevel(index + 1)}
                  className={`text-4xl p-2 rounded-full transition-all ${
                    moodLevel === index + 1 ? 'bg-blue-100 scale-125' : 'hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="text-center text-lg font-medium text-gray-700">
              {['Very Bad', 'Bad', 'Neutral', 'Good', 'Excellent'][moodLevel - 1]}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={moodNotes}
              onChange={(e) => setMoodNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="What's influencing your mood today?"
              rows="3"
            />
          </div>

          <button
            onClick={logMood}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Log Mood
          </button>
        </div>
      )}

      {/* Stress Tracking */}
      {activeTab === 'stress' && (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
          <h2 className="text-xl font-semibold mb-6">What's your stress level?</h2>
          
          <div className="mb-6">
            <div className="flex justify-center space-x-4 mb-4">
              {stressEmojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => setStressLevel(index + 1)}
                  className={`text-4xl p-2 rounded-full transition-all ${
                    stressLevel === index + 1 ? 'bg-red-100 scale-125' : 'hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="text-center text-lg font-medium text-gray-700">
              {['Very Low', 'Low', 'Moderate', 'High', 'Very High'][stressLevel - 1]}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={stressNotes}
              onChange={(e) => setStressNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="What's causing stress? Any coping strategies you used?"
              rows="3"
            />
          </div>

          <button
            onClick={logStress}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Log Stress Level
          </button>
        </div>
      )}

      {/* Productivity Tracking */}
      {activeTab === 'productivity' && (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
          <h2 className="text-xl font-semibold mb-6">How productive were you today?</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Productivity Score (1-10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={productivityScore}
                onChange={(e) => setProductivityScore(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>1</span>
                <span className="font-medium text-lg">{productivityScore}</span>
                <span>10</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tasks Completed
                </label>
                <input
                  type="number"
                  min="0"
                  value={tasksCompleted}
                  onChange={(e) => setTasksCompleted(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Focus Time (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={focusTime}
                  onChange={(e) => setFocusTime(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={productivityNotes}
                onChange={(e) => setProductivityNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="What helped or hindered your productivity today?"
                rows="3"
              />
            </div>

            <button
              onClick={logProductivity}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Log Productivity
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Social Component
const Social = () => {
  const [friends, setFriends] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('friends');

  useEffect(() => {
    fetchFriends();
    fetchUsers();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`${API}/social/friends`);
      setFriends(response.data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/social/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const addFriend = async (friendId) => {
    try {
      await axios.post(`${API}/social/friends/${friendId}`);
      fetchFriends();
      fetchUsers();
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Social</h1>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['friends', 'discover'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <div>
          {friends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {friends.map((friend) => (
                <div key={friend.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">👤</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{friend.full_name}</h3>
                    <p className="text-sm text-gray-600">{friend.email}</p>
                    <div className="mt-4 bg-green-50 rounded-lg p-3">
                      <div className="text-lg font-bold text-green-700">{friend.total_wellness_score}%</div>
                      <div className="text-sm text-green-600">Wellness Score</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No friends yet</h3>
              <p className="text-gray-600">Connect with others to share your wellness journey!</p>
            </div>
          )}
        </div>
      )}

      {/* Discover Tab */}
      {activeTab === 'discover' && (
        <div>
          <h2 className="text-xl font-semibold mb-6">Discover Users</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <div key={user.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">👤</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{user.full_name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  {user.age && (
                    <p className="text-sm text-gray-500">Age: {user.age}</p>
                  )}
                  <button
                    onClick={() => addFriend(user.id)}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Add Friend
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Challenges Component
const Challenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    name: '',
    description: '',
    category: 'exercise',
    duration_days: 7
  });

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await axios.get(`${API}/challenges`);
      setChallenges(response.data);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  };

  const createChallenge = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/challenges`, newChallenge);
      setNewChallenge({ name: '', description: '', category: 'exercise', duration_days: 7 });
      setShowCreateForm(false);
      fetchChallenges();
    } catch (error) {
      console.error('Error creating challenge:', error);
    }
  };

  const joinChallenge = async (challengeId) => {
    try {
      await axios.post(`${API}/challenges/${challengeId}/join`);
      fetchChallenges();
    } catch (error) {
      console.error('Error joining challenge:', error);
    }
  };

  const categoryEmojis = {
    exercise: '💪',
    nutrition: '🥗',
    mental_health: '🧠',
    productivity: '⚡',
    social: '👥',
    sleep: '😴',
    learning: '📚'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Community Challenges</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          + Create Challenge
        </button>
      </div>

      {/* Create Challenge Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Challenge</h2>
            <form onSubmit={createChallenge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newChallenge.name}
                  onChange={(e) => setNewChallenge({...newChallenge, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., 30-Day Fitness Challenge"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  value={newChallenge.description}
                  onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Describe the challenge..."
                  rows="3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newChallenge.category}
                  onChange={(e) => setNewChallenge({...newChallenge, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="exercise">Exercise</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="mental_health">Mental Health</option>
                  <option value="productivity">Productivity</option>
                  <option value="social">Social</option>
                  <option value="sleep">Sleep</option>
                  <option value="learning">Learning</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={newChallenge.duration_days}
                  onChange={(e) => setNewChallenge({...newChallenge, duration_days: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => (
          <div key={challenge.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <span className="text-3xl mr-3">{categoryEmojis[challenge.category]}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{challenge.name}</h3>
                  <p className="text-sm text-gray-600 capitalize">{challenge.category.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Duration</div>
                <div className="text-lg font-bold text-purple-600">{challenge.duration_days} days</div>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{challenge.description}</p>
            
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-500">
                {challenge.participants.length} participants
              </div>
              <div className="text-sm text-gray-500">
                {new Date(challenge.created_at).toLocaleDateString()}
              </div>
            </div>
            
            <button
              onClick={() => joinChallenge(challenge.id)}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
            >
              Join Challenge
            </button>
          </div>
        ))}
      </div>

      {challenges.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No challenges yet</h3>
          <p className="text-gray-600 mb-6">Create the first community challenge!</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Create First Challenge
          </button>
        </div>
      )}
    </div>
  );
};

// Main App Component
const MainApp = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'habits':
        return <Habits />;
      case 'wellness':
        return <Wellness />;
      case 'social':
        return <Social />;
      case 'challenges':
        return <Challenges />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-blue-600">MindMate</span>
              </div>
              
              <div className="hidden md:flex space-x-8">
                {[
                  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
                  { key: 'habits', label: 'Habits', icon: '🎯' },
                  { key: 'wellness', label: 'Wellness', icon: '🧘' },
                  { key: 'social', label: 'Social', icon: '👥' },
                  { key: 'challenges', label: 'Challenges', icon: '🏆' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setCurrentView(tab.key)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === tab.key 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user.full_name}</span>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.reload();
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {renderView()}
      </main>
    </div>
  );
};

// Root App Component
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <MainApp /> : <LandingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
