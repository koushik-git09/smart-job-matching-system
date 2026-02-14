import type { ReactElement } from "react";
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
import { getToken, logoutUser } from "@/services/auth";

function ProtectedRoute({ children }: { children: ReactElement }) {
  const token = getToken();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingPage
            onSelectUserType={() => {
              // Selection is handled via onLogin/onSignup buttons in the UI.
            }}
            onLogin={(role) =>
              navigate(
                role === "jobseeker" ? "/login/jobseeker" : "/login/recruiter",
              )
            }
            onSignup={(role) =>
              navigate(
                role === "jobseeker"
                  ? "/signup/jobseeker"
                  : "/signup/recruiter",
              )
            }
          />
        }
      />

      <Route
        path="/login/:role"
        element={
          <AuthLayout title="Welcome Back" subtitle="Login to continue">
            <LoginForm />
          </AuthLayout>
        }
      />

      <Route
        path="/signup/:role"
        element={
          <AuthLayout title="Create Account" subtitle="Sign up to continue">
            <SignupForm />
          </AuthLayout>
        }
      />

      <Route
        path="/seeker-dashboard"
        element={
          <ProtectedRoute>
            <JobSeekerDashboard
              profile={mockJobSeekerProfile}
              onLogout={() => {
                logoutUser();
                navigate("/");
              }}
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/recruiter-dashboard"
        element={
          <ProtectedRoute>
            <RecruiterDashboard
              profile={mockRecruiterProfile}
              onLogout={() => {
                logoutUser();
                navigate("/");
              }}
            />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
