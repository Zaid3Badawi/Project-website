from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import bcrypt
import jwt
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from enum import Enum


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'mindmate-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Create the main app without a prefix
app = FastAPI(title="MindMate API", description="Comprehensive Wellness & Mental Health Platform")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Enums
class HabitCategory(str, Enum):
    EXERCISE = "exercise"
    NUTRITION = "nutrition"
    MENTAL_HEALTH = "mental_health"
    PRODUCTIVITY = "productivity"
    SOCIAL = "social"
    SLEEP = "sleep"
    LEARNING = "learning"

class MoodLevel(int, Enum):
    VERY_BAD = 1
    BAD = 2
    NEUTRAL = 3
    GOOD = 4
    EXCELLENT = 5

class StressLevel(int, Enum):
    VERY_LOW = 1
    LOW = 2
    MODERATE = 3
    HIGH = 4
    VERY_HIGH = 5

# Pydantic Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    age: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password: str  # Store hashed password
    full_name: str
    age: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    profile_picture: Optional[str] = None
    bio: Optional[str] = None
    friends: List[str] = Field(default_factory=list)
    total_wellness_score: float = 0.0

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    age: Optional[int] = None
    created_at: datetime
    profile_picture: Optional[str] = None
    bio: Optional[str] = None
    total_wellness_score: float

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class HabitCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: HabitCategory
    target_frequency: int = 1  # times per day
    is_active: bool = True

class Habit(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    description: Optional[str] = None
    category: HabitCategory
    target_frequency: int = 1
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    current_streak: int = 0
    best_streak: int = 0

class HabitCheckIn(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    habit_id: str
    user_id: str
    date: datetime = Field(default_factory=datetime.utcnow)
    completed: bool = True
    notes: Optional[str] = None

class MoodEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    mood_level: MoodLevel
    notes: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)

class StressEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    stress_level: StressLevel
    triggers: Optional[List[str]] = None
    coping_strategies: Optional[List[str]] = None
    notes: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)

class ProductivityEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    productivity_score: int  # 1-10 scale
    tasks_completed: int = 0
    focus_time_minutes: int = 0
    notes: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)

class Challenge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    category: HabitCategory
    duration_days: int
    participants: List[str] = Field(default_factory=list)
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class WellnessDashboard(BaseModel):
    user_id: str
    date_range: str
    wellness_score: float
    habit_completion_rate: float
    mood_average: float
    stress_average: float
    productivity_average: float
    streak_count: int
    active_challenges: int

# Utility Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Authentication Routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_dict = user_data.dict()
    user_dict['password'] = hash_password(user_data.password)
    user = User(**user_dict)
    
    await db.users.insert_one(user.dict())
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id, "email": user.email})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user.dict())
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user['id'], "email": user['email']})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user)
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(**current_user.dict())

# Habit Management Routes
@api_router.post("/habits", response_model=Habit)
async def create_habit(habit_data: HabitCreate, current_user: User = Depends(get_current_user)):
    habit_dict = habit_data.dict()
    habit_dict['user_id'] = current_user.id
    habit = Habit(**habit_dict)
    
    await db.habits.insert_one(habit.dict())
    return habit

@api_router.get("/habits", response_model=List[Habit])
async def get_user_habits(current_user: User = Depends(get_current_user)):
    habits = await db.habits.find({"user_id": current_user.id, "is_active": True}).to_list(100)
    return [Habit(**habit) for habit in habits]

@api_router.post("/habits/{habit_id}/checkin", response_model=HabitCheckIn)
async def check_in_habit(habit_id: str, completed: bool = True, notes: Optional[str] = None, current_user: User = Depends(get_current_user)):
    # Verify habit belongs to user
    habit = await db.habits.find_one({"id": habit_id, "user_id": current_user.id})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Create check-in
    checkin = HabitCheckIn(
        habit_id=habit_id,
        user_id=current_user.id,
        completed=completed,
        notes=notes
    )
    
    await db.habit_checkins.insert_one(checkin.dict())
    
    # Update habit streak (simplified logic)
    if completed:
        await db.habits.update_one(
            {"id": habit_id},
            {"$inc": {"current_streak": 1}}
        )
    
    return checkin

# Wellness Tracking Routes
@api_router.post("/wellness/mood", response_model=MoodEntry)
async def log_mood(mood_level: MoodLevel, notes: Optional[str] = None, current_user: User = Depends(get_current_user)):
    mood_entry = MoodEntry(
        user_id=current_user.id,
        mood_level=mood_level,
        notes=notes
    )
    
    await db.mood_entries.insert_one(mood_entry.dict())
    return mood_entry

@api_router.post("/wellness/stress", response_model=StressEntry)
async def log_stress(stress_data: StressEntry, current_user: User = Depends(get_current_user)):
    stress_data.user_id = current_user.id
    await db.stress_entries.insert_one(stress_data.dict())
    return stress_data

@api_router.post("/wellness/productivity", response_model=ProductivityEntry)
async def log_productivity(productivity_data: ProductivityEntry, current_user: User = Depends(get_current_user)):
    productivity_data.user_id = current_user.id
    await db.productivity_entries.insert_one(productivity_data.dict())
    return productivity_data

@api_router.get("/wellness/dashboard")
async def get_wellness_dashboard(current_user: User = Depends(get_current_user)):
    # Get recent data (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # Get habit completion rate
    habits = await db.habits.find({"user_id": current_user.id, "is_active": True}).to_list(100)
    checkins = await db.habit_checkins.find({
        "user_id": current_user.id,
        "date": {"$gte": thirty_days_ago}
    }).to_list(1000)
    
    habit_completion_rate = len([c for c in checkins if c.get('completed', False)]) / max(len(checkins), 1) * 100
    
    # Get mood average
    mood_entries = await db.mood_entries.find({
        "user_id": current_user.id,
        "date": {"$gte": thirty_days_ago}
    }).to_list(100)
    mood_avg = sum([m['mood_level'] for m in mood_entries]) / max(len(mood_entries), 1) if mood_entries else 3
    
    # Get stress average
    stress_entries = await db.stress_entries.find({
        "user_id": current_user.id,
        "date": {"$gte": thirty_days_ago}
    }).to_list(100)
    stress_avg = sum([s['stress_level'] for s in stress_entries]) / max(len(stress_entries), 1) if stress_entries else 3
    
    # Get productivity average
    productivity_entries = await db.productivity_entries.find({
        "user_id": current_user.id,
        "date": {"$gte": thirty_days_ago}
    }).to_list(100)
    productivity_avg = sum([p['productivity_score'] for p in productivity_entries]) / max(len(productivity_entries), 1) if productivity_entries else 5
    
    # Calculate overall wellness score
    wellness_score = (
        (habit_completion_rate / 100) * 0.3 +  # 30% weight for habits
        (mood_avg / 5) * 0.3 +  # 30% weight for mood
        ((6 - stress_avg) / 5) * 0.2 +  # 20% weight for stress (inverted)
        (productivity_avg / 10) * 0.2  # 20% weight for productivity
    ) * 100
    
    return WellnessDashboard(
        user_id=current_user.id,
        date_range="Last 30 days",
        wellness_score=round(wellness_score, 1),
        habit_completion_rate=round(habit_completion_rate, 1),
        mood_average=round(mood_avg, 1),
        stress_average=round(stress_avg, 1),
        productivity_average=round(productivity_avg, 1),
        streak_count=max([h.get('current_streak', 0) for h in habits], default=0),
        active_challenges=0  # TODO: implement challenges
    )

# Social Features Routes
@api_router.get("/social/users", response_model=List[UserResponse])
async def get_users(current_user: User = Depends(get_current_user)):
    users = await db.users.find({"id": {"$ne": current_user.id}}).to_list(50)
    return [UserResponse(**user) for user in users]

@api_router.post("/social/friends/{friend_id}")
async def add_friend(friend_id: str, current_user: User = Depends(get_current_user)):
    # Add friend to current user's friend list
    await db.users.update_one(
        {"id": current_user.id},
        {"$addToSet": {"friends": friend_id}}
    )
    
    # Add current user to friend's friend list (mutual friendship)
    await db.users.update_one(
        {"id": friend_id},
        {"$addToSet": {"friends": current_user.id}}
    )
    
    return {"message": "Friend added successfully"}

@api_router.get("/social/friends", response_model=List[UserResponse])
async def get_friends(current_user: User = Depends(get_current_user)):
    friends = await db.users.find({"id": {"$in": current_user.friends}}).to_list(100)
    return [UserResponse(**friend) for friend in friends]

# Challenge Routes
@api_router.post("/challenges", response_model=Challenge)
async def create_challenge(challenge_data: Challenge, current_user: User = Depends(get_current_user)):
    challenge_data.created_by = current_user.id
    await db.challenges.insert_one(challenge_data.dict())
    return challenge_data

@api_router.get("/challenges", response_model=List[Challenge])
async def get_challenges():
    challenges = await db.challenges.find({"is_active": True}).to_list(50)
    return [Challenge(**challenge) for challenge in challenges]

@api_router.post("/challenges/{challenge_id}/join")
async def join_challenge(challenge_id: str, current_user: User = Depends(get_current_user)):
    await db.challenges.update_one(
        {"id": challenge_id},
        {"$addToSet": {"participants": current_user.id}}
    )
    return {"message": "Joined challenge successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
