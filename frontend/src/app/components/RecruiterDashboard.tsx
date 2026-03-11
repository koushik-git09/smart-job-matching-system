import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Briefcase,
  Download,
  Filter,
  LogOut,
  Plus,
  Search,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

import { CandidateComparisonView } from "@/app/components/CandidateComparisonView";
import { CandidateMatchCard } from "@/app/components/CandidateMatchCard";
import type {
  CandidateMatch,
  JobPosting,
  RecruiterDashboardPayload,
} from "@/app/types";
import {
  createRecruiterJobPosting,
  getCandidateResume,
  getRecruiterDashboard,
  setRecruiterJobStatus,
  toggleSavedCandidate,
} from "@/services/api";

interface RecruiterDashboardProps {
  onLogout: () => void;
}

export function RecruiterDashboard({ onLogout }: RecruiterDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);

  const [dashboard, setDashboard] = useState<RecruiterDashboardPayload | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const [jobDetails, setJobDetails] = useState<JobPosting | null>(null);
  const [jobActionId, setJobActionId] = useState<string | null>(null);

  const [newJob, setNewJob] = useState({
    title: "",
    company: "",
    location: "",
    type: "",
    description: "",
    external_apply_link: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);

  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [filterHighMatch, setFilterHighMatch] = useState(false);
  const [filterSavedOnly, setFilterSavedOnly] = useState(false);

  const profile = dashboard?.profile ?? null;
  const jobs = dashboard?.activeJobs ?? [];
  const candidates = (dashboard?.candidates ?? []) as CandidateMatch[];
  const metrics = dashboard?.metrics ?? {
    totalCandidates: 0,
    highMatch: 0,
    averageMatch: 0,
    activeJobs: 0,
  };

  const refresh = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const d = await getRecruiterDashboard();
      setDashboard(d);
    } catch (e: any) {
      setDashboard(null);
      setLoadError(e?.message || "Failed to load recruiter dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (profile?.company && !newJob.company) {
      setNewJob((prev) => ({ ...prev, company: profile.company }));
    }
  }, [profile, newJob.company]);

  const filteredCandidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...candidates];

    if (filterHighMatch) {
      list = list.filter((c) => (c.matchPercentage ?? 0) >= 80);
    }
    if (filterSavedOnly) {
      list = list.filter((c) => Boolean(c.saved));
    }
    if (q) {
      list = list.filter((c) => {
        const hay = `${c.candidateName} ${c.candidateId} ${c.jobTitle}`.toLowerCase();
        return hay.includes(q);
      });
    }

    list.sort((a, b) => (b.matchPercentage ?? 0) - (a.matchPercentage ?? 0));
    return list;
  }, [candidates, filterHighMatch, filterSavedOnly, query]);

  const toggleCandidateSelection = (id: string) => {
    setSelectedCandidates((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id],
    );
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    setRequiredSkills((prev) => Array.from(new Set([...prev, s])));
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setRequiredSkills((prev) => prev.filter((x) => x !== skill));
  };

  const submitNewJob = async () => {
    setPostError(null);
    const title = newJob.title.trim();
    const company = newJob.company.trim();

    if (!title) {
      setPostError("Job title is required");
      return;
    }
    if (!company) {
      setPostError("Company is required");
      return;
    }
    if (requiredSkills.length === 0) {
      setPostError("Add at least one required skill");
      return;
    }

    setPosting(true);
    try {
      await createRecruiterJobPosting({
        title,
        company,
        location: newJob.location.trim(),
        type: newJob.type.trim(),
        description: newJob.description.trim(),
        external_apply_link: newJob.external_apply_link.trim(),
        required_skills: requiredSkills,
      });

      setPostDialogOpen(false);
      setNewJob({
        title: "",
        company: profile?.company ?? "",
        location: "",
        type: "",
        description: "",
        external_apply_link: "",
      });
      setRequiredSkills([]);
      setSkillInput("");
      await refresh();
    } catch (e: any) {
      setPostError(e?.message || "Failed to post job");
    } finally {
      setPosting(false);
    }
  };

  const downloadCandidateResumeData = async (candidateId: string) => {
    setActionError(null);
    try {
      const data = await getCandidateResume(candidateId);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `candidate-${candidateId}-resume-analysis.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setActionError(e?.message || "Failed to download resume data");
    }
  };

  const handleToggleSavedCandidate = async (candidateId: string) => {
    setActionError(null);
    try {
      const res = await toggleSavedCandidate(candidateId);
      setDashboard((prev) => {
        if (!prev) return prev;
        const nextCandidates = prev.candidates.map((c) =>
          c.candidateId === candidateId ? { ...c, saved: res.saved } : c,
        );
        const nextSaved = res.saved
          ? Array.from(new Set([...(prev.savedCandidateIds ?? []), res.candidateId]))
          : (prev.savedCandidateIds ?? []).filter((x) => x !== res.candidateId);
        return {
          ...prev,
          candidates: nextCandidates,
          savedCandidateIds: nextSaved,
        };
      });
    } catch (e: any) {
      setActionError(e?.message || "Failed to update saved candidate");
    }
  };

  const exportCandidatesCsv = () => {
    const rows = [
      [
        "candidateId",
        "candidateName",
        "jobTitle",
        "matchPercentage",
        "readinessScore",
        "saved",
      ],
      ...filteredCandidates.map((c) => [
        c.candidateId,
        c.candidateName,
        c.jobTitle,
        String(c.matchPercentage ?? 0),
        String(c.readinessScore ?? 0),
        String(Boolean(c.saved)),
      ]),
    ];

    const csv = rows
      .map((r) =>
        r
          .map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recruiter-candidates-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold">Recruiter Dashboard</h1>
              <p className="text-sm text-gray-600">
                {profile?.company ?? ""} {profile?.industry ? `• ${profile.industry}` : ""}
              </p>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {loadError ? (
          <Card className="mb-6">
            <CardContent className="p-4 text-sm text-red-600">
              {loadError}
              <div className="mt-3">
                <Button variant="outline" onClick={refresh}>
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {actionError ? (
          <Card className="mb-6">
            <CardContent className="p-4 text-sm text-red-600">
              {actionError}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Candidates</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {loading ? "—" : metrics.totalCandidates}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">High Match (80%+)</p>
                  <p className="text-3xl font-bold text-green-600">
                    {loading ? "—" : metrics.highMatch}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Average Match</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {loading ? "—" : `${metrics.averageMatch}%`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <Progress value={loading ? 0 : metrics.averageMatch} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Jobs</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {loading ? "—" : metrics.activeJobs}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex w-full overflow-x-auto justify-start gap-2 mb-6">
            <TabsTrigger value="overview" className="whitespace-nowrap min-w-[120px]">
              Overview
            </TabsTrigger>
            <TabsTrigger value="candidates" className="whitespace-nowrap min-w-[120px]">
              Candidates
            </TabsTrigger>
            <TabsTrigger value="compare" className="whitespace-nowrap min-w-[140px]">
              Compare ({selectedCandidates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <CardTitle>Active Job Postings</CardTitle>
                  <Button onClick={() => setPostDialogOpen(true)} disabled={loading}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Job Posting
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-sm text-gray-600">Loading jobs…</div>
                ) : jobs.length === 0 ? (
                  <div className="text-sm text-gray-600">
                    No active job postings yet. Create your first job to start seeing candidate matches.
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id} className="p-4 border rounded-lg mb-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                        <div>
                          <h4 className="font-semibold text-lg">{job.title}</h4>
                          <p className="text-sm text-gray-600">
                            {job.location} • {job.type}
                          </p>
                        </div>
                        {job.experienceLevel ? <Badge>{job.experienceLevel}</Badge> : null}
                      </div>

                      <p className="text-sm text-gray-700 mb-3">{job.description}</p>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">
                            {job.requiredSkills.filter((s) => s.priority === "must-have").length} Must-have skills
                          </Badge>
                          <Badge variant="outline">
                            {job.requiredSkills.filter((s) => s.priority === "good-to-have").length} Good-to-have skills
                          </Badge>
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setJobDetails(job)}>
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            disabled={jobActionId === job.id}
                            onClick={async () => {
                              setActionError(null);
                              setJobActionId(job.id);
                              try {
                                await setRecruiterJobStatus(job.id, "closed");
                                await refresh();
                              } catch (e: any) {
                                setActionError(e?.message || "Failed to close job");
                              } finally {
                                setJobActionId(null);
                              }
                            }}
                          >
                            {jobActionId === job.id ? "Closing…" : "Close"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Dialog open={Boolean(jobDetails)} onOpenChange={(o) => !o && setJobDetails(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{jobDetails?.title ?? "Job Details"}</DialogTitle>
                  <DialogDescription>
                    {(profile?.company ?? "").toString()} {jobDetails?.location ? `• ${jobDetails.location}` : ""} {jobDetails?.type ? `• ${jobDetails.type}` : ""}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {jobDetails?.description ?? ""}
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Required Skills</div>
                    <div className="flex flex-wrap gap-2">
                      {(jobDetails?.requiredSkills ?? []).map((s, idx) => (
                        <Badge key={`${s.name}-${idx}`} variant="secondary">
                          {s.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setJobDetails(null)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Post a New Job</DialogTitle>
                  <DialogDescription>
                    This creates a document in Firestore `jobs` and associates it with your recruiter account.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {postError ? <div className="text-sm text-red-600">{postError}</div> : null}

                  <div className="space-y-2">
                    <Label>Job Title</Label>
                    <Input
                      value={newJob.title}
                      onChange={(e) => setNewJob((p) => ({ ...p, title: e.target.value }))}
                      placeholder="e.g., Frontend Developer Intern"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input
                      value={newJob.company}
                      onChange={(e) => setNewJob((p) => ({ ...p, company: e.target.value }))}
                      placeholder="e.g., TechNova"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={newJob.location}
                        onChange={(e) => setNewJob((p) => ({ ...p, location: e.target.value }))}
                        placeholder="e.g., Chennai"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Job Type</Label>
                      <Input
                        value={newJob.type}
                        onChange={(e) => setNewJob((p) => ({ ...p, type: e.target.value }))}
                        placeholder="e.g., Internship"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newJob.description}
                      onChange={(e) => setNewJob((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Brief role description"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>External Apply Link</Label>
                    <Input
                      value={newJob.external_apply_link}
                      onChange={(e) => setNewJob((p) => ({ ...p, external_apply_link: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Required Skills</Label>
                    <div className="flex gap-2">
                      <Input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        placeholder="e.g., react"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSkill();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={addSkill}>
                        Add
                      </Button>
                    </div>

                    {requiredSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {requiredSkills.map((s) => (
                          <Badge key={s} variant="secondary" className="gap-2">
                            {s}
                            <button
                              type="button"
                              className="inline-flex"
                              onClick={() => removeSkill(s)}
                              aria-label={`Remove ${s}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setPostDialogOpen(false)} disabled={posting}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={submitNewJob} disabled={posting}>
                    {posting ? "Posting…" : "Post Job"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Card>
              <CardHeader>
                <CardTitle>Top Matching Candidates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-sm text-gray-600">Loading candidates…</div>
                  ) : candidates.length === 0 ? (
                    <div className="text-sm text-gray-600">
                      No candidates found yet. Candidates appear once jobseekers upload resumes.
                    </div>
                  ) : (
                    candidates.slice(0, 3).map((candidate) => (
                      <div
                        key={candidate.candidateId}
                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{candidate.candidateName}</h4>
                            <p className="text-sm text-gray-600">Applied for: {candidate.jobTitle}</p>
                          </div>
                          <Badge variant={candidate.matchPercentage >= 80 ? "default" : "secondary"}>
                            {candidate.matchPercentage}% Match
                          </Badge>
                        </div>
                        <Progress value={candidate.matchPercentage} className="mb-2" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Readiness: {candidate.readinessScore}%</span>
                          <Button variant="link" size="sm" onClick={() => setActiveTab("candidates")}>
                            View Full Profile
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="candidates" className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <h2 className="text-2xl font-bold">All Candidates</h2>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex gap-2">
                  <Input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, email, or job"
                    className="w-full sm:w-64"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      searchRef.current?.focus();
                    }}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Filters</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={filterHighMatch}
                      onCheckedChange={(v) => setFilterHighMatch(Boolean(v))}
                    >
                      High match (80%+)
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={filterSavedOnly}
                      onCheckedChange={(v) => setFilterSavedOnly(Boolean(v))}
                    >
                      Saved only
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  onClick={exportCandidatesCsv}
                  disabled={loading || filteredCandidates.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {loading ? (
              <Card>
                <CardContent className="p-6 text-sm text-gray-600">Loading candidates…</CardContent>
              </Card>
            ) : filteredCandidates.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-gray-600">
                  No candidates match the current filters.
                </CardContent>
              </Card>
            ) : (
              filteredCandidates.map((candidate) => (
                <CandidateMatchCard
                  key={candidate.candidateId}
                  candidate={candidate}
                  isSelected={selectedCandidates.includes(candidate.candidateId)}
                  onToggleSelect={() => toggleCandidateSelection(candidate.candidateId)}
                  onToggleSaved={() => handleToggleSavedCandidate(candidate.candidateId)}
                  onDownloadResume={() => downloadCandidateResumeData(candidate.candidateId)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="compare">
            {selectedCandidates.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold mb-2">No Candidates Selected</h3>
                  <p className="text-gray-600 mb-6">
                    Select 2 or more candidates from the Candidates tab to compare them side-by-side.
                  </p>
                  <Button onClick={() => setActiveTab("candidates")}>Go to Candidates</Button>
                </CardContent>
              </Card>
            ) : selectedCandidates.length === 1 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold mb-2">Select More Candidates</h3>
                  <p className="text-gray-600 mb-6">
                    You&apos;ve selected 1 candidate. Select at least one more to compare.
                  </p>
                  <Button onClick={() => setActiveTab("candidates")}>Select More Candidates</Button>
                </CardContent>
              </Card>
            ) : (
              <CandidateComparisonView
                candidates={candidates.filter((c) => selectedCandidates.includes(c.candidateId))}
                onRemoveCandidate={toggleCandidateSelection}
                onDownloadResume={downloadCandidateResumeData}
                onToggleSaved={handleToggleSavedCandidate}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
