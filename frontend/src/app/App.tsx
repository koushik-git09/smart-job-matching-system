import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { LandingPage } from "@/app/components/LandingPage";
import { JobSeekerDashboard } from "@/app/components/JobSeekerDashboard";
import { RecruiterDashboard } from "@/app/components/RecruiterDashboard";
import { LoginForm } from "@/app/components/auth/LoginForm";
import { SignupForm } from "@/app/components/auth/SignupForm";
import { AuthLayout } from "@/app/components/auth/AuthLayout";
import {
  mockJobSeekerProfile,
  mockRecruiterProfile,
} from "@/app/data/mockData";
import type { AuthRole } from "@/app/auth/types";

function AppRoutes() {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* Landing */}
      <Route
        path="/"
        element={
          <LandingPage
            onDemoMode={(type) =>
              navigate(
                type === "jobseeker"
                  ? "/seeker-dashboard"
                  : "/recruiter-dashboard",
              )
            }
            onLogin={(role: AuthRole) =>
              navigate(
                role === "jobseeker" ? "/login/jobseeker" : "/login/recruiter",
              )
            }
            onSignup={(role: AuthRole) =>
              navigate(
                role === "jobseeker"
                  ? "/signup/jobseeker"
                  : "/signup/recruiter",
              )
            }
          />
        }
      />

      {/* Login */}
      <Route
        path="/login/:role"
        element={
          <AuthLayout title="Welcome Back" subtitle="Login to continue">
            <LoginForm />
          </AuthLayout>
        }
      />

      {/* Signup */}
      <Route
        path="/signup/:role"
        element={
          <AuthLayout title="Create Account" subtitle="Sign up to continue">
            <SignupForm />
          </AuthLayout>
        }
      />

      {/* Dashboards */}
      <Route
        path="/seeker-dashboard"
        element={
          <JobSeekerDashboard
            profile={mockJobSeekerProfile}
            onLogout={() => navigate("/")}
          />
        }
      />

      <Route
        path="/recruiter-dashboard"
        element={
          <RecruiterDashboard
            profile={mockRecruiterProfile}
            onLogout={() => navigate("/")}
          />
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
