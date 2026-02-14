import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Progress } from '@/app/components/ui/progress';
import { Checkbox } from '@/app/components/ui/checkbox';
import { CheckCircle2, AlertCircle, Mail, Phone, Download } from 'lucide-react';
import type { CandidateMatch } from '@/app/types';

interface CandidateMatchCardProps {
  candidate: CandidateMatch;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export function CandidateMatchCard({ candidate, isSelected, onToggleSelect }: CandidateMatchCardProps) {
  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-blue-600 bg-blue-100';
    return 'text-orange-600 bg-orange-100';
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow ${isSelected ? 'border-blue-500 border-2' : ''}`}>
      <CardHeader>
        <div className="flex items-start gap-4">
          {onToggleSelect && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelect}
              className="mt-1"
            />
          )}
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{candidate.candidateName}</CardTitle>
                <p className="text-gray-600 mt-1">Applied for: {candidate.jobTitle}</p>
              </div>
              <Badge className={getMatchColor(candidate.matchPercentage)}>
                {candidate.matchPercentage}% Match
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Match Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Skill Match</span>
            <span className="text-sm text-gray-600">{candidate.matchPercentage}%</span>
          </div>
          <Progress value={candidate.matchPercentage} />
        </div>

        {/* Readiness Score */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Job Readiness Score</span>
            <span className="text-sm text-gray-600">{candidate.readinessScore}%</span>
          </div>
          <Progress value={candidate.readinessScore} />
        </div>

        {/* Recommendation */}
        <div className={`p-3 rounded-lg ${
          candidate.readinessScore >= 85 ? 'bg-green-50' :
          candidate.readinessScore >= 70 ? 'bg-blue-50' : 'bg-orange-50'
        }`}>
          <p className="text-sm font-medium">
            {candidate.readinessScore >= 85 ? '✅ Highly recommended - Ready to start immediately' :
             candidate.readinessScore >= 70 ? '👍 Good candidate - May need brief onboarding' :
             '⚠️ Skills need development - Consider for junior roles'}
          </p>
        </div>

        {/* Strength Areas */}
        <div>
          <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Matching Skills ({candidate.strengthAreas.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {candidate.strengthAreas.map((skill, idx) => (
              <Badge key={idx} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Missing Skills */}
        {candidate.missingSkills.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-orange-600 mb-2 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Missing Skills ({candidate.missingSkills.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {candidate.missingSkills.map((skill, idx) => (
                <Badge key={idx} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button className="flex-1">
            <Mail className="w-4 h-4 mr-2" />
            Contact
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Resume
          </Button>
          <Button variant="outline" size="icon">
            <Phone className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
