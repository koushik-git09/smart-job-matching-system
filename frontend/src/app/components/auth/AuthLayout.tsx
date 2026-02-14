import { ReactNode } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/app/components/ui/card";
import { Briefcase, Users } from "lucide-react";
import { motion } from "motion/react";
import type { AuthRole } from "@/app/auth/types";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const { role } = useParams<{ role: AuthRole }>();

  const userRole: AuthRole = role === "recruiter" ? "recruiter" : "jobseeker";

  const accent =
    userRole === "jobseeker"
      ? "from-blue-600 to-cyan-600"
      : "from-purple-600 to-pink-600";

  const Icon = userRole === "jobseeker" ? Briefcase : Users;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-14">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="max-w-lg mx-auto"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border shadow-sm">
              <span
                className={`inline-flex items-center justify-center size-8 rounded-full bg-gradient-to-r ${accent} text-white`}
              >
                <Icon className="size-4" />
              </span>
              <span className="text-sm font-medium text-gray-700">
                {userRole === "jobseeker" ? "Job seeker" : "Recruiter"} portal
              </span>
            </div>

            <h1
              className={`mt-5 text-3xl font-bold bg-gradient-to-r ${accent} bg-clip-text text-transparent`}
            >
              {title}
            </h1>

            <p className="text-gray-600 mt-2">{subtitle}</p>
          </div>

          <Card className="border-2 shadow-lg">
            <CardContent className="p-6">{children}</CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
