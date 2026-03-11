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

export async function getCurrentUser(): Promise<{ name: string; email: string; role: string }> {
  const token = getToken();

  const response = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}

export async function getRecommendedJobs(): Promise<{ jobs: any[] }> {
  const token = getToken();

  const response = await fetch(`${BASE_URL}/jobs/recommended`, {
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

export async function getRecruiterProfile(): Promise<any> {
  const token = getToken();

  const response = await fetch(`${BASE_URL}/recruiter/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}

export async function saveRecruiterProfile(payload: {
  company: string;
  companyDescription?: string;
  industry?: string;
}): Promise<any> {
  const token = getToken();

  const response = await fetch(`${BASE_URL}/recruiter/profile`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}

export async function createRecruiterJobPosting(payload: any): Promise<any> {
  const token = getToken();

  const response = await fetch(`${BASE_URL}/recruiter/job-postings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let err: any = null;
    try {
      err = await response.json();
    } catch {
      // ignore
    }
    throw new Error(err?.detail || err?.message || "Failed to post job");
  }

  return response.json();
}

export async function getCandidateMatches(jobId?: string): Promise<{ matches: any[] }> {
  const token = getToken();
  const qs = jobId ? `?job_id=${encodeURIComponent(jobId)}` : "";

  const response = await fetch(`${BASE_URL}/recruiter/candidate-matches${qs}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}

export type RecruiterDashboardPayload = {
  profile: {
    email: string;
    company: string;
    industry: string;
  };
  activeJobs: any[];
  metrics: {
    totalCandidates: number;
    highMatch: number;
    averageMatch: number;
    activeJobs: number;
  };
  candidates: any[];
  savedCandidateIds: string[];
};

export async function getRecruiterDashboard(): Promise<RecruiterDashboardPayload> {
  const token = getToken();

  const response = await fetch(`${BASE_URL}/recruiter/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let err: any = null;
    try {
      err = await response.json();
    } catch {
      // ignore
    }
    throw new Error(err?.detail || err?.message || "Failed to load recruiter dashboard");
  }

  return response.json();
}

export async function toggleSavedCandidate(candidateId: string): Promise<{ saved: boolean; candidateId: string }> {
  const token = getToken();
  const cid = encodeURIComponent(candidateId);

  const response = await fetch(`${BASE_URL}/recruiter/saved-candidates/${cid}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    let err: any = null;
    try {
      err = await response.json();
    } catch {
      // ignore
    }
    throw new Error(err?.detail || err?.message || "Failed to update saved candidate");
  }

  return response.json();
}

export async function setRecruiterJobStatus(jobId: string, status: "active" | "closed" | "draft") {
  const token = getToken();
  const jid = encodeURIComponent(jobId);

  const response = await fetch(`${BASE_URL}/recruiter/job-postings/${jid}/status`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    let err: any = null;
    try {
      err = await response.json();
    } catch {
      // ignore
    }
    throw new Error(err?.detail || err?.message || "Failed to update job status");
  }

  return response.json();
}

export async function getCandidateResume(candidateId: string): Promise<any> {
  const token = getToken();
  const cid = encodeURIComponent(candidateId);

  const response = await fetch(`${BASE_URL}/recruiter/candidate-resume/${cid}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    let err: any = null;
    try {
      err = await response.json();
    } catch {
      // ignore
    }
    throw new Error(err?.detail || err?.message || "Failed to fetch candidate resume data");
  }

  return response.json();
}
