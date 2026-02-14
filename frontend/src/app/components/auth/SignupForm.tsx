import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Loader2, UserPlus, Mail, Lock, User } from "lucide-react";
import { motion } from "motion/react";
import type { AuthRole } from "@/app/auth/types";
import { signUp } from "@/app/auth/authService";

export function SignupForm() {
  const navigate = useNavigate();
  const { role } = useParams<{ role: AuthRole }>();

  const userRole: AuthRole = role === "recruiter" ? "recruiter" : "jobseeker";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const accents = useMemo(
    () =>
      userRole === "jobseeker"
        ? "bg-blue-600 hover:bg-blue-700"
        : "bg-purple-600 hover:bg-purple-700",
    [userRole],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signUp({
        role: userRole,
        name,
        email,
        password,
      });

      // 🔥 After signup → go to login
      navigate(
        userRole === "jobseeker" ? "/login/jobseeker" : "/login/recruiter",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.08 }}
      onSubmit={onSubmit}
    >
      <div className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                userRole === "jobseeker" ? "Jane Doe" : "Alex Recruiter"
              }
              className="pl-9"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9"
              required
              minLength={6}
            />
          </div>
          <p className="text-xs text-gray-500">Min 6 characters (demo-only).</p>
        </div>

        <Button
          type="submit"
          className={`w-full ${accents}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <UserPlus className="mr-2 size-4" />
          )}
          Create account
        </Button>

        <div className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <button
            type="button"
            className="font-medium underline underline-offset-4"
            onClick={() =>
              navigate(
                userRole === "jobseeker"
                  ? "/login/jobseeker"
                  : "/login/recruiter",
              )
            }
          >
            Log in
          </button>
        </div>
      </div>
    </motion.form>
  );
}
