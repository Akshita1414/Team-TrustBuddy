from pydantic import BaseModel, Field
from typing import List, Optional

class User(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    password: str = Field(..., min_length=3, max_length=128)
    history: Optional[List[dict]] = Field(default_factory=list)

class UserLogin(BaseModel):
    username: str
    password: str

class UserSignup(BaseModel):
    username: str
    password: str 