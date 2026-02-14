import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Progress } from '@/app/components/ui/progress';
import { CheckCircle2, AlertCircle, TrendingUp, ExternalLink } from 'lucide-react';
import type { SkillMatch } from '@/app/types';

interface JobMatchCardProps {
  match: SkillMatch;
}

export function JobMatchCard({ match }: JobMatchCardProps) {
  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-blue-600 bg-blue-100';
    return 'text-orange-600 bg-orange-100';
  };

  const getReadinessMessage = (score: number) => {
    if (score >= 85) return 'You are ready to apply!';
    if (score >= 70) return 'Almost ready - complete 1-2 courses';
    if (score >= 50) return 'Build more skills before applying';
    return 'Focus on fundamental skill development';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl">{match.jobTitle}</CardTitle>
            <p className="text-gray-600 mt-1">{match.company}</p>
          </div>
          <Badge className={getMatchColor(match.matchPercentage)}>
            {match.matchPercentage}% Match
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Match Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Overall Match</span>
            <span className="text-sm text-gray-600">{match.matchPercentage}%</span>
          </div>
          <Progress value={match.matchPercentage} />
        </div>

        {/* Readiness Score */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="font-medium">Job Readiness Score: {match.readinessScore}%</span>
          </div>
          <p className="text-sm text-gray-600">{getReadinessMessage(match.readinessScore)}</p>
        </div>

        {/* Strength Areas */}
        <div>
          <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Your Strengths ({match.strengthAreas.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {match.strengthAreas.map((skill, idx) => (
              <Badge key={idx} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Missing Skills */}
        {match.missingSkills.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Missing Skills ({match.missingSkills.length})
            </h4>
            <div className="space-y-2">
              {match.missingSkills.map((gap, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <span className="font-medium text-sm">{gap.skillName}</span>
                    <p className="text-xs text-gray-600">
                      Required: {gap.requiredLevel} • {gap.estimatedLearningTime}
                    </p>
                  </div>
                  <Badge variant={gap.priority === 'critical' ? 'destructive' : 'outline'}>
                    {gap.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weak Skills */}
        {match.weakSkills.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-orange-600 mb-2 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Skills to Improve ({match.weakSkills.length})
            </h4>
            <div className="space-y-2">
              {match.weakSkills.map((gap, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                  <div>
                    <span className="font-medium text-sm">{gap.skillName}</span>
                    <p className="text-xs text-gray-600">
                      Current: {gap.currentLevel} → Required: {gap.requiredLevel}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">{gap.estimatedLearningTime}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button className="flex-1">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Job Posting
          </Button>
          <Button variant="outline" className="flex-1">
            Save for Later
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
