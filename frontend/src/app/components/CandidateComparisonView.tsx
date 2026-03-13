import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Progress } from "@/app/components/ui/progress";
import { X, CheckCircle2, AlertCircle, Trophy } from "lucide-react";
import type { CandidateMatch } from "@/app/types";
import { CandidateActionButtons } from "@/app/components/CandidateActionButtons";

interface CandidateComparisonViewProps {
  candidates: CandidateMatch[];
  onRemoveCandidate: (id: string) => void;
  onDownloadResume?: (candidateId: string) => void;
  onToggleSaved?: (candidateId: string) => void;
  onContactCandidate?: (candidateId: string) => void;
}

export function CandidateComparisonView({
  candidates,
  onRemoveCandidate,
  onDownloadResume,
  onToggleSaved,
  onContactCandidate,
}: CandidateComparisonViewProps) {
  // Find the best candidate
  const bestCandidateId = candidates.reduce(
    (best, current) =>
      current.matchPercentage > best.matchPercentage ? current : best,
    candidates[0],
  ).candidateId;

  const exportCsv = () => {
    const rows = [
      [
        "candidateId",
        "email",
        "candidateName",
        "jobTitle",
        "matchPercentage",
        "readinessScore",
        "matchingSkillsCount",
        "missingSkillsCount",
        "saved",
      ],
      ...candidates.map((c) => [
        c.candidateId,
        (c.email || "").toString(),
        c.candidateName,
        c.jobTitle,
        String(c.matchPercentage),
        String(c.readinessScore),
        String(c.strengthAreas?.length ?? 0),
        String(c.missingSkills?.length ?? 0),
        String(Boolean(c.saved)),
      ]),
    ];

    const csv = rows
      .map((r) =>
        r.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `candidate-comparison-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const scheduleInterviews = () => {
    const emails = candidates
      .map((c) => (c.email || c.candidateId || "").toString())
      .filter((x) => x.includes("@"));
    if (emails.length === 0) return;
    const to = emails.join(",");
    const subject = encodeURIComponent("Interview Invitation");
    const body = encodeURIComponent(
      "Hi,\n\nWe would like to schedule an interview. Please share your availability.\n\nThanks",
    );
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Candidate Comparison</h2>
          <p className="text-gray-600">
            Compare {candidates.length} candidates side-by-side
          </p>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {candidates.map((candidate) => (
          <Card
            key={candidate.candidateId}
            className={
              candidate.candidateId === bestCandidateId
                ? "border-green-500 border-2"
                : ""
            }
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {candidate.candidateName}
                    {candidate.candidateId === bestCandidateId && (
                      <Trophy className="w-5 h-5 text-yellow-500" />
                    )}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveCandidate(candidate.candidateId)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {candidate.candidateId === bestCandidateId && (
                <Badge className="bg-green-600 w-fit">Best Match</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Match Score */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Match Score</span>
                  <span className="text-lg font-bold text-blue-600">
                    {candidate.matchPercentage}%
                  </span>
                </div>
                <Progress value={candidate.matchPercentage} />
              </div>

              {/* Readiness Score */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Readiness</span>
                  <span className="text-lg font-bold text-purple-600">
                    {candidate.readinessScore}%
                  </span>
                </div>
                <Progress value={candidate.readinessScore} />
              </div>

              {/* Matching Skills */}
              <div>
                <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Matching Skills ({candidate.strengthAreas.length})
                </h4>
                <div className="flex flex-wrap gap-1">
                  {candidate.strengthAreas.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Missing Skills */}
              <div>
                <h4 className="text-sm font-medium text-orange-600 mb-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Missing ({candidate.missingSkills.length})
                </h4>
                <div className="flex flex-wrap gap-1">
                  {candidate.missingSkills.slice(0, 3).map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {candidate.missingSkills.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{candidate.missingSkills.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t">
                <div className="pt-4">
                  <CandidateActionButtons
                    saved={Boolean(candidate.saved)}
                    onContact={
                      onContactCandidate
                        ? () => onContactCandidate(candidate.candidateId)
                        : () => {
                            const email = (
                              candidate.email ||
                              candidate.candidateId ||
                              ""
                            ).toString();
                            if (!email.includes("@")) return;
                            const subject = encodeURIComponent(
                              `Regarding ${candidate.jobTitle}`,
                            );
                            window.location.href = `mailto:${email}?subject=${subject}`;
                          }
                    }
                    disableContact={Boolean(
                      onContactCandidate
                        ? false
                        : !(candidate.email || candidate.candidateId || "")
                            .toString()
                            .includes("@"),
                    )}
                    onResumeData={
                      onDownloadResume
                        ? () => onDownloadResume(candidate.candidateId)
                        : undefined
                    }
                    disableResumeData={!onDownloadResume}
                    onSave={
                      onToggleSaved
                        ? () => onToggleSaved(candidate.candidateId)
                        : undefined
                    }
                    disableSave={!onToggleSaved}
                  />

                  {!onContactCandidate &&
                  !(candidate.email || candidate.candidateId || "")
                    .toString()
                    .includes("@") ? (
                    <p className="mt-2 text-xs text-gray-500">
                      Contact info not available for this candidate.
                    </p>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Metric</th>
                  {candidates.map((candidate) => (
                    <th
                      key={candidate.candidateId}
                      className="text-left p-3 font-medium"
                    >
                      {candidate.candidateName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm font-medium">Overall Match</td>
                  {candidates.map((candidate) => (
                    <td key={candidate.candidateId} className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {candidate.matchPercentage}%
                        </span>
                        <Progress
                          value={candidate.matchPercentage}
                          className="w-20"
                        />
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm font-medium">Readiness Score</td>
                  {candidates.map((candidate) => (
                    <td key={candidate.candidateId} className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {candidate.readinessScore}%
                        </span>
                        <Progress
                          value={candidate.readinessScore}
                          className="w-20"
                        />
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm font-medium">Matching Skills</td>
                  {candidates.map((candidate) => (
                    <td key={candidate.candidateId} className="p-3">
                      <Badge variant="secondary">
                        {candidate.strengthAreas.length}
                      </Badge>
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm font-medium">Missing Skills</td>
                  {candidates.map((candidate) => (
                    <td key={candidate.candidateId} className="p-3">
                      <Badge variant="outline">
                        {candidate.missingSkills.length}
                      </Badge>
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm font-medium">Recommendation</td>
                  {candidates.map((candidate) => (
                    <td key={candidate.candidateId} className="p-3">
                      {candidate.readinessScore >= 85 ? (
                        <Badge className="bg-green-600">
                          Highly Recommended
                        </Badge>
                      ) : candidate.readinessScore >= 70 ? (
                        <Badge className="bg-blue-600">Good Candidate</Badge>
                      ) : (
                        <Badge variant="secondary">Needs Development</Badge>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button className="w-full" onClick={scheduleInterviews}>
          Schedule Interviews with Selected
        </Button>
        <Button variant="outline" className="w-full" onClick={exportCsv}>
          Export Comparison
        </Button>
      </div>
    </div>
  );
}
