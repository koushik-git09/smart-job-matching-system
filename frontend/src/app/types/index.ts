// User Types
export type UserType = 'jobseeker' | 'recruiter';

export interface User {
  id: string;
  name: string;
  email: string;
  type: UserType;
}

// Job Seeker Profile
export interface JobSeekerProfile {
  userId: string;
  education: Education[];
  skills: Skill[];
  experience: Experience[];
  careerGoals: CareerGoals;
  preferences: JobPreferences;
  learningProgress: CourseProgress[];
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  year: string;
  field: string;
}

export interface Skill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience: number;
  category: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  duration: string;
  description: string;
  skills: string[];
}

export interface CareerGoals {
  shortTerm: string;
  longTerm: string;
}

export interface JobPreferences {
  preferredRoles: string[];
  locations: string[];
  salaryRange: {
    min: number;
    max: number;
  };
  workType: string[];
}

// Recruiter Profile
export interface RecruiterProfile {
  userId: string;
  company: string;
  companyDescription: string;
  industry: string;
  jobPostings: JobPosting[];
}

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  requiredSkills: JobSkill[];
  experienceLevel: string;
  location: string;
  salaryRange: {
    min: number;
    max: number;
  };
  type: string;
  posted: string;
}

export interface JobSkill {
  name: string;
  priority: 'must-have' | 'good-to-have';
  minimumExperience: number;
}

// Matching & Analysis
export interface SkillMatch {
  jobId: string;
  jobTitle: string;
  company: string;
  matchPercentage: number;
  strengthAreas: string[];
  missingSkills: SkillGap[];
  weakSkills: SkillGap[];
  readinessScore: number;
}

export interface SkillGap {
  skillName: string;
  priority: 'critical' | 'optional';
  currentLevel: string | null;
  requiredLevel: string;
  estimatedLearningTime: string;
}

// Course Recommendations
export interface CourseRecommendation {
  id: string;
  title: string;
  platform: string;
  duration: string;
  level: string;
  skillsCovered: string[];
  readinessBoost: number;
  url: string;
  rating: number;
}

export interface CourseProgress {
  courseId: string;
  courseTitle: string;
  platform: string;
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number;
  startedDate?: string;
  completedDate?: string;
  skillsImproved: string[];
}

// Career Path
export interface CareerPath {
  currentRole: string;
  targetRole: string;
  readiness: number;
  intermediateSteps: CareerStep[];
  estimatedTimeline: string;
}

export interface CareerStep {
  role: string;
  readiness: number;
  skillsNeeded: string[];
  recommendedAction: string;
}

// Dashboard Data
export interface JobSeekerDashboard {
  readinessScore: number;
  skillRadarData: SkillRadarData[];
  recommendedJobs: SkillMatch[];
  skillGaps: SkillGap[];
  courseRecommendations: CourseRecommendation[];
  careerPath: CareerPath;
  learningProgress: CourseProgress[];
}

export interface SkillRadarData {
  skill: string;
  current: number;
  required: number;
}

export interface RecruiterDashboard {
  totalCandidates: number;
  topMatches: CandidateMatch[];
  activeJobs: number;
}

export interface CandidateMatch {
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  matchPercentage: number;
  readinessScore: number;
  strengthAreas: string[];
  missingSkills: string[];
}
