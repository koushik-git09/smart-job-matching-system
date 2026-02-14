const BASE_URL = "http://127.0.0.1:8000";

export async function uploadResume(file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/resume/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  return response.json();
}

export async function matchJob(jobId: string, token: string) {
  const response = await fetch(`${BASE_URL}/match/job/${jobId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.json();
}
