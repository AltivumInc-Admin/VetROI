from datetime import datetime
from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field, validator


class Branch(str, Enum):
    ARMY = "army"
    NAVY = "navy"
    MARINE_CORPS = "marine_corps"
    AIR_FORCE = "air_force"
    SPACE_FORCE = "space_force"
    COAST_GUARD = "coast_guard"


class Education(str, Enum):
    HIGH_SCHOOL = "high_school"
    ASSOCIATE = "associate"
    BACHELOR = "bachelor"
    MASTER = "master"
    DOCTORATE = "doctorate"


class USState(str, Enum):
    AL = "AL"
    AK = "AK"
    AZ = "AZ"
    AR = "AR"
    CA = "CA"
    CO = "CO"
    CT = "CT"
    DE = "DE"
    FL = "FL"
    GA = "GA"
    HI = "HI"
    ID = "ID"
    IL = "IL"
    IN = "IN"
    IA = "IA"
    KS = "KS"
    KY = "KY"
    LA = "LA"
    ME = "ME"
    MD = "MD"
    MA = "MA"
    MI = "MI"
    MN = "MN"
    MS = "MS"
    MO = "MO"
    MT = "MT"
    NE = "NE"
    NV = "NV"
    NH = "NH"
    NJ = "NJ"
    NM = "NM"
    NY = "NY"
    NC = "NC"
    ND = "ND"
    OH = "OH"
    OK = "OK"
    OR = "OR"
    PA = "PA"
    RI = "RI"
    SC = "SC"
    SD = "SD"
    TN = "TN"
    TX = "TX"
    UT = "UT"
    VT = "VT"
    VA = "VA"
    WA = "WA"
    WV = "WV"
    WI = "WI"
    WY = "WY"


class VeteranRequest(BaseModel):
    branch: Branch
    code: str = Field(..., min_length=1, max_length=20)
    homeState: USState
    relocate: bool
    relocateState: Optional[USState] = None
    education: Education
    skills: Optional[List[str]] = Field(default_factory=list)
    clearance: Optional[str] = None
    
    @validator('relocateState')
    def validate_relocate_state(cls, v, values):
        if values.get('relocate') and not v:
            raise ValueError('relocateState is required when relocate is true')
        return v


class Career(BaseModel):
    title: str
    soc: str
    summary: str
    median_salary: int = Field(..., alias="medianSalary")
    match_reason: str = Field(..., alias="matchReason")
    next_step: str = Field(..., alias="nextStep")
    
    class Config:
        populate_by_name = True


class RecommendationResponse(BaseModel):
    session_id: str = Field(..., alias="sessionId")
    recommendations: List[Career]
    timestamp: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }