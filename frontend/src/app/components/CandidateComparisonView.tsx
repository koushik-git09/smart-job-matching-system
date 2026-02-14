import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Progress } from '@/app/components/ui/progress';
import { X, CheckCircle2, AlertCircle, Trophy } from 'lucide-react';
import type { CandidateMatch } from '@/app/types';

interface CandidateComparisonViewProps {
  candidates: CandidateMatch[];
  onRemoveCandidate: (id: string) => void;
}

export function CandidateComparisonView({ candidates, onRemoveCandidate }: CandidateComparisonViewProps) {
  // Find the best candidate
  const bestCandidateId = candidates.reduce((best, current) => 
    current.matchPercentage > best.matchPercentage ? current : best
  , candidates[0]).candidateId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Candidate Comparison</h2>
          <p className="text-gray-600">Compare {candidates.length} candidates side-by-side</p>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(candidates.length, 3)}, 1fr)` }}>
        {candidates.map((candidate) => (
          <Card key={candidate.candidateId} className={candidate.candidateId === bestCandidateId ? 'border-green-500 border-2' : ''}>
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
                  <span className="text-lg font-bold text-blue-600">{candidate.matchPercentage}%</span>
                </div>
                <Progress value={candidate.matchPercentage} />
              </div>

              {/* Readiness Score */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Readiness</span>
                  <span className="text-lg font-bold text-purple-600">{candidate.readinessScore}%</span>
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
                    <th key={candidate.candidateId} className="text-left p-3 font-medium">
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
                        <span className="font-semibold">{candidate.matchPercentage}%</span>
                        <Progress value={candidate.matchPercentage} className="w-20" />
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm font-medium">Readiness Score</td>
                  {candidates.map((candidate) => (
                    <td key={candidate.candidateId} className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{candidate.readinessScore}%</span>
                        <Progress value={candidate.readinessScore} className="w-20" />
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm font-medium">Matching Skills</td>
                  {candidates.map((candidate) => (
                    <td key={candidate.candidateId} className="p-3">
                      <Badge variant="secondary">{candidate.strengthAreas.length}</Badge>
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm font-medium">Missing Skills</td>
                  {candidates.map((candidate) => (
                    <td key={candidate.candidateId} className="p-3">
                      <Badge variant="outline">{candidate.missingSkills.length}</Badge>
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm font-medium">Recommendation</td>
                  {candidates.map((candidate) => (
                    <td key={candidate.candidateId} className="p-3">
                      {candidate.readinessScore >= 85 ? (
                        <Badge className="bg-green-600">Highly Recommended</Badge>
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
      <div className="flex gap-3">
        <Button className="flex-1">
          Schedule Interviews with Selected
        </Button>
        <Button variant="outline">
          Export Comparison
        </Button>
      </div>
    </div>
  );
}
