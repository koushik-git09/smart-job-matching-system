import type { 
  JobSeekerProfile, 
  RecruiterProfile, 
  SkillMatch, 
  CourseRecommendation,
  CareerPath,
  SkillRadarData,
  CandidateMatch
} from '@/app/types';

// Mock Job Seeker Profile
export const mockJobSeekerProfile: JobSeekerProfile = {
  userId: '1',
  education: [
    {
      id: '1',
      degree: 'Bachelor of Science',
      institution: 'MIT',
      year: '2020',
      field: 'Computer Science'
    }
  ],
  skills: [
    { id: '1', name: 'Python', level: 'advanced', yearsOfExperience: 3, category: 'Programming' },
    { id: '2', name: 'Machine Learning', level: 'intermediate', yearsOfExperience: 2, category: 'AI/ML' },
    { id: '3', name: 'Data Analysis', level: 'advanced', yearsOfExperience: 3, category: 'Data Science' },
    { id: '4', name: 'SQL', level: 'intermediate', yearsOfExperience: 2, category: 'Database' },
    { id: '5', name: 'TensorFlow', level: 'intermediate', yearsOfExperience: 1.5, category: 'AI/ML' },
    { id: '6', name: 'Pandas', level: 'advanced', yearsOfExperience: 3, category: 'Data Science' },
    { id: '7', name: 'JavaScript', level: 'intermediate', yearsOfExperience: 2, category: 'Programming' },
  ],
  experience: [
    {
      id: '1',
      title: 'Data Analyst',
      company: 'TechCorp',
      duration: '2020 - 2023',
      description: 'Analyzed large datasets, created visualizations, and built predictive models',
      skills: ['Python', 'SQL', 'Data Analysis', 'Pandas', 'Tableau']
    }
  ],
  careerGoals: {
    shortTerm: 'Transition to a Data Scientist role',
    longTerm: 'Lead an AI research team at a top tech company'
  },
  preferences: {
    preferredRoles: ['Data Scientist', 'Machine Learning Engineer', 'AI Researcher'],
    locations: ['San Francisco', 'Seattle', 'Remote'],
    salaryRange: { min: 100000, max: 150000 },
    workType: ['Full-time', 'Remote', 'Hybrid']
  },
  learningProgress: [
    {
      courseId: '1',
      courseTitle: 'Deep Learning Specialization',
      platform: 'Coursera',
      status: 'in-progress',
      progress: 65,
      startedDate: '2023-11-01',
      skillsImproved: ['Deep Learning', 'Neural Networks']
    },
    {
      courseId: '2',
      courseTitle: 'Advanced Machine Learning',
      platform: 'Udemy',
      status: 'completed',
      progress: 100,
      startedDate: '2023-08-01',
      completedDate: '2023-10-15',
      skillsImproved: ['Machine Learning', 'Model Optimization']
    }
  ]
};

// Mock Job Matches
export const mockJobMatches: SkillMatch[] = [
  {
    jobId: '1',
    jobTitle: 'Data Scientist',
    company: 'Google',
    matchPercentage: 78,
    strengthAreas: ['Python', 'Data Analysis', 'Machine Learning', 'Pandas'],
    missingSkills: [
      { 
        skillName: 'Deep Learning', 
        priority: 'critical', 
        currentLevel: null, 
        requiredLevel: 'intermediate',
        estimatedLearningTime: '3 months'
      },
      { 
        skillName: 'PyTorch', 
        priority: 'critical', 
        currentLevel: null, 
        requiredLevel: 'intermediate',
        estimatedLearningTime: '2 months'
      }
    ],
    weakSkills: [
      { 
        skillName: 'TensorFlow', 
        priority: 'optional', 
        currentLevel: 'intermediate', 
        requiredLevel: 'advanced',
        estimatedLearningTime: '2 months'
      }
    ],
    readinessScore: 75
  },
  {
    jobId: '2',
    jobTitle: 'Machine Learning Engineer',
    company: 'Amazon',
    matchPercentage: 65,
    strengthAreas: ['Python', 'Machine Learning', 'TensorFlow'],
    missingSkills: [
      { 
        skillName: 'MLOps', 
        priority: 'critical', 
        currentLevel: null, 
        requiredLevel: 'intermediate',
        estimatedLearningTime: '3 months'
      },
      { 
        skillName: 'Docker', 
        priority: 'critical', 
        currentLevel: null, 
        requiredLevel: 'intermediate',
        estimatedLearningTime: '1 month'
      },
      { 
        skillName: 'Kubernetes', 
        priority: 'optional', 
        currentLevel: null, 
        requiredLevel: 'beginner',
        estimatedLearningTime: '2 months'
      }
    ],
    weakSkills: [],
    readinessScore: 62
  },
  {
    jobId: '3',
    jobTitle: 'Senior Data Analyst',
    company: 'Microsoft',
    matchPercentage: 92,
    strengthAreas: ['Python', 'SQL', 'Data Analysis', 'Pandas'],
    missingSkills: [],
    weakSkills: [
      { 
        skillName: 'Power BI', 
        priority: 'optional', 
        currentLevel: null, 
        requiredLevel: 'intermediate',
        estimatedLearningTime: '1 month'
      }
    ],
    readinessScore: 90
  },
  {
    jobId: '4',
    jobTitle: 'AI Research Scientist',
    company: 'OpenAI',
    matchPercentage: 52,
    strengthAreas: ['Python', 'Machine Learning'],
    missingSkills: [
      { 
        skillName: 'Deep Learning', 
        priority: 'critical', 
        currentLevel: null, 
        requiredLevel: 'advanced',
        estimatedLearningTime: '6 months'
      },
      { 
        skillName: 'Research Publications', 
        priority: 'critical', 
        currentLevel: null, 
        requiredLevel: 'advanced',
        estimatedLearningTime: '12 months'
      },
      { 
        skillName: 'PyTorch', 
        priority: 'critical', 
        currentLevel: null, 
        requiredLevel: 'advanced',
        estimatedLearningTime: '4 months'
      }
    ],
    weakSkills: [],
    readinessScore: 48
  }
];

// Mock Course Recommendations
export const mockCourseRecommendations: CourseRecommendation[] = [
  {
    id: '1',
    title: 'Deep Learning Specialization',
    platform: 'Coursera',
    duration: '3 months',
    level: 'Intermediate',
    skillsCovered: ['Deep Learning', 'Neural Networks', 'CNNs', 'RNNs'],
    readinessBoost: 15,
    url: 'https://coursera.org/specializations/deep-learning',
    rating: 4.9
  },
  {
    id: '2',
    title: 'PyTorch for Deep Learning',
    platform: 'Udemy',
    duration: '2 months',
    level: 'Intermediate',
    skillsCovered: ['PyTorch', 'Deep Learning', 'Computer Vision'],
    readinessBoost: 12,
    url: 'https://udemy.com/pytorch-deep-learning',
    rating: 4.7
  },
  {
    id: '3',
    title: 'MLOps Fundamentals',
    platform: 'Coursera',
    duration: '2 months',
    level: 'Intermediate',
    skillsCovered: ['MLOps', 'Docker', 'CI/CD', 'Model Deployment'],
    readinessBoost: 18,
    url: 'https://coursera.org/learn/mlops',
    rating: 4.8
  },
  {
    id: '4',
    title: 'Advanced TensorFlow',
    platform: 'Coursera',
    duration: '2 months',
    level: 'Advanced',
    skillsCovered: ['TensorFlow', 'Model Optimization', 'TensorFlow Extended'],
    readinessBoost: 8,
    url: 'https://coursera.org/specializations/tensorflow-advanced',
    rating: 4.6
  }
];

// Mock Career Path
export const mockCareerPath: CareerPath = {
  currentRole: 'Data Analyst',
  targetRole: 'AI Research Scientist',
  readiness: 48,
  intermediateSteps: [
    {
      role: 'Senior Data Analyst',
      readiness: 90,
      skillsNeeded: ['Power BI'],
      recommendedAction: 'Apply now - you are ready!'
    },
    {
      role: 'Data Scientist',
      readiness: 75,
      skillsNeeded: ['Deep Learning', 'PyTorch'],
      recommendedAction: 'Complete 2-3 courses, then apply'
    },
    {
      role: 'Machine Learning Engineer',
      readiness: 62,
      skillsNeeded: ['MLOps', 'Docker', 'Kubernetes'],
      recommendedAction: 'Gain practical experience in ML deployment'
    },
    {
      role: 'AI Research Scientist',
      readiness: 48,
      skillsNeeded: ['Deep Learning', 'Research Publications', 'PyTorch', 'Advanced Mathematics'],
      recommendedAction: 'Build strong research portfolio over 12-18 months'
    }
  ],
  estimatedTimeline: '18-24 months'
};

// Mock Skill Radar Data
export const mockSkillRadarData: SkillRadarData[] = [
  { skill: 'Python', current: 90, required: 85 },
  { skill: 'Machine Learning', current: 70, required: 85 },
  { skill: 'Deep Learning', current: 40, required: 80 },
  { skill: 'Data Analysis', current: 88, required: 75 },
  { skill: 'SQL', current: 65, required: 70 },
  { skill: 'TensorFlow', current: 60, required: 75 },
  { skill: 'Statistics', current: 72, required: 80 },
];

// Mock Recruiter Profile
export const mockRecruiterProfile: RecruiterProfile = {
  userId: '2',
  company: 'Google',
  companyDescription: 'Leading technology company focused on innovation',
  industry: 'Technology',
  jobPostings: [
    {
      id: '1',
      title: 'Data Scientist',
      description: 'We are looking for a talented Data Scientist to join our team...',
      requiredSkills: [
        { name: 'Python', priority: 'must-have', minimumExperience: 3 },
        { name: 'Machine Learning', priority: 'must-have', minimumExperience: 2 },
        { name: 'Deep Learning', priority: 'must-have', minimumExperience: 2 },
        { name: 'PyTorch', priority: 'must-have', minimumExperience: 1 },
        { name: 'TensorFlow', priority: 'good-to-have', minimumExperience: 1 },
      ],
      experienceLevel: '3-5 years',
      location: 'San Francisco, CA',
      salaryRange: { min: 120000, max: 180000 },
      type: 'Full-time',
      posted: '2024-01-15'
    }
  ]
};

// Mock Candidate Matches (for Recruiter Dashboard)
export const mockCandidateMatches: CandidateMatch[] = [
  {
    candidateId: '1',
    candidateName: 'Sarah Johnson',
    jobId: '1',
    jobTitle: 'Data Scientist',
    matchPercentage: 88,
    readinessScore: 85,
    strengthAreas: ['Python', 'Machine Learning', 'Deep Learning', 'PyTorch'],
    missingSkills: []
  },
  {
    candidateId: '2',
    candidateName: 'Alex Chen',
    jobId: '1',
    jobTitle: 'Data Scientist',
    matchPercentage: 78,
    readinessScore: 75,
    strengthAreas: ['Python', 'Data Analysis', 'Machine Learning'],
    missingSkills: ['Deep Learning', 'PyTorch']
  },
  {
    candidateId: '3',
    candidateName: 'Michael Brown',
    jobId: '1',
    jobTitle: 'Data Scientist',
    matchPercentage: 72,
    readinessScore: 68,
    strengthAreas: ['Python', 'TensorFlow', 'Data Analysis'],
    missingSkills: ['PyTorch', 'Advanced ML']
  },
  {
    candidateId: '4',
    candidateName: 'Emily Davis',
    jobId: '1',
    jobTitle: 'Data Scientist',
    matchPercentage: 65,
    readinessScore: 62,
    strengthAreas: ['Python', 'Machine Learning'],
    missingSkills: ['Deep Learning', 'PyTorch', 'Production Experience']
  }
];
