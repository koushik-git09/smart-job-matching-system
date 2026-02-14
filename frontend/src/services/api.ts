import { getToken } from "./auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function uploadResume(file: File) {
  const token = getToken();

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/resume/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
}

export async function matchJob(jobId: string) {
  const token = getToken();

  const response = await fetch(`${BASE_URL}/match/job/${jobId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}

export async function getJobSeekerDashboard() {
  const token = getToken();

  const response = await fetch(`${BASE_URL}/jobseeker-dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}

export async function getLearningCourses(): Promise<{ courses: any[] }> {
  const token = getToken();

  const response = await fetch(`${BASE_URL}/learning/courses`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}

export async function saveLearningCourse(
  courseId: string,
  payload: {
    courseTitle: string;
    platform: string;
    skillsImproved: string[];
    status: "not-started" | "in-progress" | "completed";
    progress: number;
    startedDate?: string | null;
    completedDate?: string | null;
  },
): Promise<any> {
  const token = getToken();

  const response = await fetch(`${BASE_URL}/learning/courses/${courseId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}
