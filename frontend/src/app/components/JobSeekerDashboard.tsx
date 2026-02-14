import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import {
  TrendingUp,
  Target,
  BookOpen,
  Briefcase,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { SkillRadarChart } from "@/app/components/SkillRadarChart";
import { JobMatchCard } from "@/app/components/JobMatchCard";
import { CourseRecommendationCard } from "@/app/components/CourseRecommendationCard";
import { CareerPathView } from "@/app/components/CareerPathView";
import { LearningProgressTracker } from "@/app/components/LearningProgressTracker";
import { ResumeUpload } from "@/app/components/ResumeUpload";
import {
  mockJobMatches,
  mockCourseRecommendations,
  mockCareerPath,
  mockSkillRadarData,
  mockJobSeekerProfile,
} from "@/app/data/mockData";
import type { JobSeekerProfile } from "@/app/types";
import { useEffect } from "react";
import { matchJob } from "@/services/api";

interface JobSeekerDashboardProps {
  profile: JobSeekerProfile;
  onLogout: () => void;
}

export function JobSeekerDashboard({
  profile,
  onLogout,
}: JobSeekerDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showResumeUpload, setShowResumeUpload] = useState(false);

  // Calculate overall readiness score (average of top 3 job matches)
  const overallReadinessScore = Math.round(
    mockJobMatches
      .slice(0, 3)
      .reduce((sum, match) => sum + match.readinessScore, 0) / 3,
  );

  // Get all skill gaps
  const allSkillGaps = mockJobMatches.flatMap((match) => match.missingSkills);
  const criticalGaps = allSkillGaps.filter(
    (gap) => gap.priority === "critical",
  );
  const uniqueCriticalGaps = Array.from(
    new Set(criticalGaps.map((gap) => gap.skillName)),
  ).map((name) => criticalGaps.find((gap) => gap.skillName === name)!);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Career Readiness Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome back! Track your progress and find your next
                opportunity.
              </p>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Resume Upload Dialog */}
      <ResumeUpload
        open={showResumeUpload}
        onClose={() => setShowResumeUpload(false)}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Readiness Score</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {overallReadinessScore}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <Progress value={overallReadinessScore} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Matched Jobs</p>
                  <p className="text-3xl font-bold text-green-600">
                    {mockJobMatches.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Skills to Improve
                  </p>
                  <p className="text-3xl font-bold text-orange-600">
                    {uniqueCriticalGaps.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Learning Progress
                  </p>
                  <p className="text-3xl font-bold text-purple-600">
                    {profile.learningProgress.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Job Matches</TabsTrigger>
            <TabsTrigger value="skills">Skill Analysis</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="career">Career Path</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Skill Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Skill Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <SkillRadarChart data={mockSkillRadarData} />
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span>Your Skills</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full" />
                      <span>Required Skills</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Job Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Job Matches</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockJobMatches.slice(0, 3).map((job) => (
                    <div
                      key={job.jobId}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{job.jobTitle}</h4>
                          <p className="text-sm text-gray-600">{job.company}</p>
                        </div>
                        <Badge
                          variant={
                            job.matchPercentage >= 80 ? "default" : "secondary"
                          }
                        >
                          {job.matchPercentage}% Match
                        </Badge>
                      </div>
                      <Progress value={job.matchPercentage} className="mb-2" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Readiness: {job.readinessScore}%
                        </span>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setActiveTab("jobs")}
                        >
                          View Details <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Critical Skill Gaps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Critical Skill Gaps to Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {uniqueCriticalGaps.slice(0, 6).map((gap, index) => (
                    <div
                      key={index}
                      className="p-4 bg-orange-50 border border-orange-200 rounded-lg"
                    >
                      <h4 className="font-semibold mb-1">{gap.skillName}</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Required: {gap.requiredLevel}
                      </p>
                      <p className="text-xs text-gray-500">
                        ⏱ Est. learning time: {gap.estimatedLearningTime}
                      </p>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full mt-4"
                  onClick={() => setActiveTab("courses")}
                >
                  View Recommended Courses
                </Button>
              </CardContent>
            </Card>

            {/* Learning Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Current Learning Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <LearningProgressTracker courses={profile.learningProgress} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Job Matches Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Job Recommendations</h2>
              <Button onClick={() => setShowResumeUpload(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Resume
              </Button>
            </div>
            {mockJobMatches.map((job) => (
              <JobMatchCard key={job.jobId} match={job} />
            ))}
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Skills Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  <SkillRadarChart data={mockSkillRadarData} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skill Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.skills.map((skill) => (
                    <div key={skill.id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{skill.name}</span>
                        <Badge variant="outline">{skill.level}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={
                            skill.level === "expert"
                              ? 100
                              : skill.level === "advanced"
                                ? 75
                                : skill.level === "intermediate"
                                  ? 50
                                  : 25
                          }
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-600">
                          {skill.yearsOfExperience}y
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Skill Gaps by Job */}
            <Card>
              <CardHeader>
                <CardTitle>Skill Gaps by Target Role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockJobMatches.map((job) => (
                    <div key={job.jobId}>
                      <h4 className="font-semibold mb-3">
                        {job.jobTitle} at {job.company}
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Strength Areas
                          </h5>
                          <div className="space-y-1">
                            {job.strengthAreas.map((skill, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="mr-2 mb-1"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-orange-600 mb-2 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Missing Skills
                          </h5>
                          <div className="space-y-1">
                            {job.missingSkills.map((gap, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="mr-2 mb-1"
                              >
                                {gap.skillName}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Recommended Courses</h2>
              <p className="text-gray-600">
                Based on your skill gaps and career goals, here are personalized
                course recommendations
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {mockCourseRecommendations.map((course) => (
                <CourseRecommendationCard key={course.id} course={course} />
              ))}
            </div>
          </TabsContent>

          {/* Career Path Tab */}
          <TabsContent value="career" className="space-y-6">
            <CareerPathView careerPath={mockCareerPath} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
