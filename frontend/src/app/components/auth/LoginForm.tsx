import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Loader2, LogIn, Mail, Lock } from "lucide-react";
import { motion } from "motion/react";
import type { AuthRole } from "@/app/auth/types";
import { loginWithOptions } from "@/app/auth/authService";

export function LoginForm() {
  const navigate = useNavigate();
  const { role } = useParams<{ role: AuthRole }>();

  const userRole: AuthRole = role === "recruiter" ? "recruiter" : "jobseeker";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
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
      await loginWithOptions(userRole, { email, password }, { rememberMe });

      // 🔥 Directly go to dashboard (NO profile forcing)
      navigate(
        userRole === "jobseeker" ? "/seeker-dashboard" : "/recruiter-dashboard",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
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
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
            <Input
              id="email"
              type="email"
              className="pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              className="pl-9"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={rememberMe}
              onCheckedChange={(v) => setRememberMe(Boolean(v))}
            />
            <Label className="text-sm text-gray-700">Remember me</Label>
          </div>
        </div>

        <Button
          type="submit"
          className={`w-full ${accents}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <LogIn className="mr-2 size-4" />
          )}
          Login
        </Button>

        <div className="text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <button
            type="button"
            className="font-medium underline underline-offset-4"
            onClick={() =>
              navigate(
                userRole === "jobseeker"
                  ? "/signup/jobseeker"
                  : "/signup/recruiter",
              )
            }
          >
            Sign up
          </button>
        </div>
      </div>
    </motion.form>
  );
}
