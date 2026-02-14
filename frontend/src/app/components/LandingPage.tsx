import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import {
  Briefcase,
  Users,
  Target,
  TrendingUp,
  BookOpen,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import type { AuthRole } from "@/app/auth/types";

interface LandingPageProps {
  onSelectUserType: (type: "jobseeker" | "recruiter") => void;
  onDemoMode?: (type: "jobseeker" | "recruiter") => void;
  onLogin?: (role: AuthRole) => void;
  onSignup?: (role: AuthRole) => void;
}

export function LandingPage({
  onSelectUserType,
  onDemoMode,
  onLogin,
  onSignup,
}: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI-Powered Job Matching & Skill Gap Analysis
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Stop applying blindly. Understand your readiness, identify skill
            gaps, and get personalized learning paths to land your dream job.
          </p>
          {onDemoMode && (
            <div className="flex gap-3 justify-center mb-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => onDemoMode("jobseeker")}
                className="bg-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Try Job Seeker Demo
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onDemoMode("recruiter")}
                className="bg-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Try Recruiter Demo
              </Button>
            </div>
          )}
        </motion.div>

        {/* User Type Selection */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05, duration: 0.45, ease: "easeOut" }}
          >
            <Card className="border-2 hover:border-blue-500 transition-all hover:shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">I'm a Job Seeker</h2>
                <p className="text-gray-600 mb-6">
                  Get AI-powered job matching, skill gap analysis, and
                  personalized learning recommendations
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => onLogin?.("jobseeker")}
                  >
                    Login
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    size="lg"
                    onClick={() => onSignup?.("jobseeker")}
                  >
                    Sign up
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05, duration: 0.45, ease: "easeOut" }}
          >
            <Card className="border-2 hover:border-purple-500 transition-all hover:shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">I'm a Recruiter</h2>
                <p className="text-gray-600 mb-6">
                  Find the best candidates with intelligent matching and
                  detailed skill assessments
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    size="lg"
                    onClick={() => onLogin?.("recruiter")}
                  >
                    Login
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    size="lg"
                    onClick={() => onSignup?.("recruiter")}
                  >
                    Sign up
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Our Platform?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <Target className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Smart Skill Matching</h3>
                <p className="text-gray-600">
                  Advanced NLP analyzes resumes and job descriptions to provide
                  accurate matching beyond simple keywords
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <TrendingUp className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Skill Gap Analysis</h3>
                <p className="text-gray-600">
                  Know exactly what skills you're missing and which ones need
                  improvement for your target role
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <BookOpen className="w-12 h-12 text-purple-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  Personalized Learning
                </h3>
                <p className="text-gray-600">
                  Get course recommendations tailored to your skill gaps with
                  estimated readiness boost
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <BarChart3 className="w-12 h-12 text-orange-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Job Readiness Score</h3>
                <p className="text-gray-600">
                  Track your progress with a dynamic score that updates as you
                  complete courses and gain experience
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <TrendingUp className="w-12 h-12 text-pink-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Career Path Guidance</h3>
                <p className="text-gray-600">
                  Get AI-powered career path recommendations with intermediate
                  steps to reach your dream role
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Users className="w-12 h-12 text-indigo-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  Better Hiring Decisions
                </h3>
                <p className="text-gray-600">
                  Recruiters can find candidates with the right skills and see
                  detailed readiness assessments
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
