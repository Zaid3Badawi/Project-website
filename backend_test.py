#!/usr/bin/env python3
"""
MindMate Backend API Testing Suite
Tests all backend endpoints for the wellness application
"""

import requests
import json
import sys
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

print(f"Testing backend at: {API_BASE}")

class MindMateAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.user_id = None
        self.habit_id = None
        self.challenge_id = None
        self.friend_id = None
        
    def set_auth_header(self, token):
        """Set authorization header for authenticated requests"""
        self.auth_token = token
        self.session.headers.update({'Authorization': f'Bearer {token}'})
        
    def test_user_registration(self):
        """Test user registration endpoint"""
        print("\n=== Testing User Registration ===")
        
        user_data = {
            "email": "sarah.wellness@mindmate.com",
            "password": "SecurePass123!",
            "full_name": "Sarah Johnson",
            "age": 28
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/register", json=user_data)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Registration successful")
                print(f"User ID: {data['user']['id']}")
                print(f"Email: {data['user']['email']}")
                print(f"Full Name: {data['user']['full_name']}")
                
                # Set auth token for subsequent requests
                self.set_auth_header(data['access_token'])
                self.user_id = data['user']['id']
                return True
            else:
                print(f"❌ Registration failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Registration error: {str(e)}")
            return False
    
    def test_user_login(self):
        """Test user login endpoint"""
        print("\n=== Testing User Login ===")
        
        login_data = {
            "email": "sarah.wellness@mindmate.com",
            "password": "SecurePass123!"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Login successful")
                print(f"Token Type: {data['token_type']}")
                print(f"User: {data['user']['full_name']}")
                
                # Update auth token
                self.set_auth_header(data['access_token'])
                return True
            else:
                print(f"❌ Login failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False
    
    def test_get_current_user(self):
        """Test get current user endpoint"""
        print("\n=== Testing Get Current User ===")
        
        try:
            response = self.session.get(f"{API_BASE}/auth/me")
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Get current user successful")
                print(f"User ID: {data['id']}")
                print(f"Email: {data['email']}")
                print(f"Wellness Score: {data['total_wellness_score']}")
                return True
            else:
                print(f"❌ Get current user failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Get current user error: {str(e)}")
            return False
    
    def test_create_habit(self):
        """Test habit creation endpoint"""
        print("\n=== Testing Habit Creation ===")
        
        habit_data = {
            "name": "Morning Meditation",
            "description": "10 minutes of mindfulness meditation every morning",
            "category": "mental_health",
            "target_frequency": 1,
            "is_active": True
        }
        
        try:
            response = self.session.post(f"{API_BASE}/habits", json=habit_data)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Habit creation successful")
                print(f"Habit ID: {data['id']}")
                print(f"Name: {data['name']}")
                print(f"Category: {data['category']}")
                print(f"Current Streak: {data['current_streak']}")
                
                self.habit_id = data['id']
                return True
            else:
                print(f"❌ Habit creation failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Habit creation error: {str(e)}")
            return False
    
    def test_get_habits(self):
        """Test get user habits endpoint"""
        print("\n=== Testing Get User Habits ===")
        
        try:
            response = self.session.get(f"{API_BASE}/habits")
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Get habits successful")
                print(f"Number of habits: {len(data)}")
                
                for habit in data:
                    print(f"- {habit['name']} ({habit['category']}) - Streak: {habit['current_streak']}")
                
                return True
            else:
                print(f"❌ Get habits failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Get habits error: {str(e)}")
            return False
    
    def test_habit_checkin(self):
        """Test habit check-in endpoint"""
        print("\n=== Testing Habit Check-in ===")
        
        if not self.habit_id:
            print("❌ No habit ID available for check-in")
            return False
        
        checkin_data = {
            "completed": True,
            "notes": "Great morning meditation session, feeling centered"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/habits/{self.habit_id}/checkin", params=checkin_data)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Habit check-in successful")
                print(f"Check-in ID: {data['id']}")
                print(f"Completed: {data['completed']}")
                print(f"Notes: {data['notes']}")
                return True
            else:
                print(f"❌ Habit check-in failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Habit check-in error: {str(e)}")
            return False
    
    def test_log_mood(self):
        """Test mood logging endpoint"""
        print("\n=== Testing Mood Logging ===")
        
        mood_data = {
            "mood_level": 4,
            "notes": "Feeling good after morning meditation and exercise"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/wellness/mood", params=mood_data)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Mood logging successful")
                print(f"Mood Level: {data['mood_level']}")
                print(f"Notes: {data['notes']}")
                print(f"Date: {data['date']}")
                return True
            else:
                print(f"❌ Mood logging failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Mood logging error: {str(e)}")
            return False
    
    def test_log_stress(self):
        """Test stress logging endpoint"""
        print("\n=== Testing Stress Logging ===")
        
        stress_data = {
            "stress_level": 2,
            "triggers": ["work deadline", "traffic"],
            "coping_strategies": ["deep breathing", "meditation"],
            "notes": "Managed stress well with breathing exercises"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/wellness/stress", json=stress_data)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Stress logging successful")
                print(f"Stress Level: {data['stress_level']}")
                print(f"Triggers: {data['triggers']}")
                print(f"Coping Strategies: {data['coping_strategies']}")
                return True
            else:
                print(f"❌ Stress logging failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Stress logging error: {str(e)}")
            return False
    
    def test_log_productivity(self):
        """Test productivity logging endpoint"""
        print("\n=== Testing Productivity Logging ===")
        
        productivity_data = {
            "productivity_score": 8,
            "tasks_completed": 5,
            "focus_time_minutes": 120,
            "notes": "Very productive day, completed all major tasks"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/wellness/productivity", json=productivity_data)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Productivity logging successful")
                print(f"Productivity Score: {data['productivity_score']}")
                print(f"Tasks Completed: {data['tasks_completed']}")
                print(f"Focus Time: {data['focus_time_minutes']} minutes")
                return True
            else:
                print(f"❌ Productivity logging failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Productivity logging error: {str(e)}")
            return False
    
    def test_wellness_dashboard(self):
        """Test wellness dashboard endpoint"""
        print("\n=== Testing Wellness Dashboard ===")
        
        try:
            response = self.session.get(f"{API_BASE}/wellness/dashboard")
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Wellness dashboard successful")
                print(f"Wellness Score: {data['wellness_score']}")
                print(f"Habit Completion Rate: {data['habit_completion_rate']}%")
                print(f"Mood Average: {data['mood_average']}")
                print(f"Stress Average: {data['stress_average']}")
                print(f"Productivity Average: {data['productivity_average']}")
                print(f"Streak Count: {data['streak_count']}")
                return True
            else:
                print(f"❌ Wellness dashboard failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Wellness dashboard error: {str(e)}")
            return False
    
    def test_get_users(self):
        """Test get all users endpoint"""
        print("\n=== Testing Get All Users ===")
        
        try:
            response = self.session.get(f"{API_BASE}/social/users")
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Get users successful")
                print(f"Number of users: {len(data)}")
                
                # Store a user ID for friend testing (if available)
                if data:
                    self.friend_id = data[0]['id']
                    print(f"Sample user: {data[0]['full_name']} ({data[0]['email']})")
                
                return True
            else:
                print(f"❌ Get users failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Get users error: {str(e)}")
            return False
    
    def test_add_friend(self):
        """Test add friend endpoint"""
        print("\n=== Testing Add Friend ===")
        
        if not self.friend_id:
            print("❌ No friend ID available for testing")
            return False
        
        try:
            response = self.session.post(f"{API_BASE}/social/friends/{self.friend_id}")
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Add friend successful")
                print(f"Message: {data['message']}")
                return True
            else:
                print(f"❌ Add friend failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Add friend error: {str(e)}")
            return False
    
    def test_get_friends(self):
        """Test get friends endpoint"""
        print("\n=== Testing Get Friends ===")
        
        try:
            response = self.session.get(f"{API_BASE}/social/friends")
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Get friends successful")
                print(f"Number of friends: {len(data)}")
                
                for friend in data:
                    print(f"- {friend['full_name']} ({friend['email']})")
                
                return True
            else:
                print(f"❌ Get friends failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Get friends error: {str(e)}")
            return False
    
    def test_create_challenge(self):
        """Test challenge creation endpoint"""
        print("\n=== Testing Challenge Creation ===")
        
        challenge_data = {
            "name": "30-Day Meditation Challenge",
            "description": "Meditate for at least 10 minutes every day for 30 days",
            "category": "mental_health",
            "duration_days": 30,
            "is_active": True
        }
        
        try:
            response = self.session.post(f"{API_BASE}/challenges", json=challenge_data)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Challenge creation successful")
                print(f"Challenge ID: {data['id']}")
                print(f"Name: {data['name']}")
                print(f"Duration: {data['duration_days']} days")
                print(f"Category: {data['category']}")
                
                self.challenge_id = data['id']
                return True
            else:
                print(f"❌ Challenge creation failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Challenge creation error: {str(e)}")
            return False
    
    def test_get_challenges(self):
        """Test get challenges endpoint"""
        print("\n=== Testing Get Challenges ===")
        
        try:
            response = self.session.get(f"{API_BASE}/challenges")
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Get challenges successful")
                print(f"Number of challenges: {len(data)}")
                
                for challenge in data:
                    print(f"- {challenge['name']} ({challenge['duration_days']} days)")
                
                return True
            else:
                print(f"❌ Get challenges failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Get challenges error: {str(e)}")
            return False
    
    def test_join_challenge(self):
        """Test join challenge endpoint"""
        print("\n=== Testing Join Challenge ===")
        
        if not self.challenge_id:
            print("❌ No challenge ID available for joining")
            return False
        
        try:
            response = self.session.post(f"{API_BASE}/challenges/{self.challenge_id}/join")
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Join challenge successful")
                print(f"Message: {data['message']}")
                return True
            else:
                print(f"❌ Join challenge failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Join challenge error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting MindMate Backend API Tests")
        print("=" * 50)
        
        test_results = {}
        
        # Authentication Tests
        test_results['register'] = self.test_user_registration()
        test_results['login'] = self.test_user_login()
        test_results['get_current_user'] = self.test_get_current_user()
        
        # Habit Management Tests
        test_results['create_habit'] = self.test_create_habit()
        test_results['get_habits'] = self.test_get_habits()
        test_results['habit_checkin'] = self.test_habit_checkin()
        
        # Wellness Tracking Tests
        test_results['log_mood'] = self.test_log_mood()
        test_results['log_stress'] = self.test_log_stress()
        test_results['log_productivity'] = self.test_log_productivity()
        test_results['wellness_dashboard'] = self.test_wellness_dashboard()
        
        # Social Features Tests
        test_results['get_users'] = self.test_get_users()
        test_results['add_friend'] = self.test_add_friend()
        test_results['get_friends'] = self.test_get_friends()
        
        # Challenge Tests
        test_results['create_challenge'] = self.test_create_challenge()
        test_results['get_challenges'] = self.test_get_challenges()
        test_results['join_challenge'] = self.test_join_challenge()
        
        # Summary
        print("\n" + "=" * 50)
        print("🏁 TEST RESULTS SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for result in test_results.values() if result)
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name.replace('_', ' ').title()}: {status}")
        
        print(f"\nOverall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            print("🎉 All tests passed! Backend API is working correctly.")
            return True
        else:
            print("⚠️  Some tests failed. Please check the backend implementation.")
            return False

if __name__ == "__main__":
    tester = MindMateAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)