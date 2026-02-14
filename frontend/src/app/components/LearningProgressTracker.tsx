import { Progress } from "@/app/components/ui/progress";
import { Badge } from "@/app/components/ui/badge";
import { CheckCircle2, PlayCircle, Clock } from "lucide-react";
import type { CourseProgress } from "@/app/types";

interface LearningProgressTrackerProps {
  courses: CourseProgress[];
}

export function LearningProgressTracker({
  courses,
}: LearningProgressTrackerProps) {
  if (courses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No courses in progress yet.</p>
        <p className="text-sm">Start learning to boost your readiness score!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <div key={course.courseId} className="p-4 border rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-semibold">{course.courseTitle}</h4>
              <p className="text-sm text-gray-600">{course.platform}</p>
            </div>
            <Badge
              variant={course.status === "completed" ? "default" : "secondary"}
              className={course.status === "completed" ? "bg-green-600" : ""}
            >
              {course.status === "completed" && (
                <CheckCircle2 className="w-3 h-3 mr-1" />
              )}
              {course.status === "in-progress" && (
                <PlayCircle className="w-3 h-3 mr-1" />
              )}
              {course.status === "not-started" && (
                <Clock className="w-3 h-3 mr-1" />
              )}
              {course.status === "completed"
                ? "Completed"
                : course.status === "in-progress"
                  ? "In Progress"
                  : "Not Started"}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-medium">{course.progress}%</span>
            </div>
            <Progress value={course.progress} />
          </div>

          {/* Skills Improved */}
          <div>
            <p className="text-xs text-gray-600 mb-1">Skills Improved:</p>
            <div className="flex flex-wrap gap-1">
              {course.skillsImproved.map((skill, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Dates */}
          {course.startedDate && (
            <div className="mt-2 text-xs text-gray-500">
              Started: {new Date(course.startedDate).toLocaleDateString()}
              {course.completedDate &&
                ` • Completed: ${new Date(course.completedDate).toLocaleDateString()}`}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
