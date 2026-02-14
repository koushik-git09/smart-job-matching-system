import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { CheckCircle2, ArrowRight, Target, Clock } from 'lucide-react';
import type { CareerPath } from '@/app/types';

interface CareerPathViewProps {
  careerPath: CareerPath;
}

export function CareerPathView({ careerPath }: CareerPathViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Your Career Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Current Role</p>
              <p className="text-xl font-bold">{careerPath.currentRole}</p>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Target Role</p>
              <p className="text-xl font-bold">{careerPath.targetRole}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Estimated Timeline: {careerPath.estimatedTimeline}</span>
          </div>
        </CardContent>
      </Card>

      {/* Career Steps */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Recommended Career Path</h3>
        {careerPath.intermediateSteps.map((step, index) => {
          const isReady = step.readiness >= 85;
          const isAlmostReady = step.readiness >= 70;
          
          return (
            <Card key={index} className={isReady ? 'border-green-500 bg-green-50' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600">
                        {index + 1}
                      </div>
                      <h4 className="text-xl font-bold">{step.role}</h4>
                    </div>
                    <p className="text-gray-600 ml-11">{step.recommendedAction}</p>
                  </div>
                  {isReady && (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  )}
                </div>

                {/* Readiness */}
                <div className="ml-11">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Readiness Score</span>
                    <span className="text-sm text-gray-600">{step.readiness}%</span>
                  </div>
                  <Progress value={step.readiness} className="mb-4" />

                  {/* Status Badge */}
                  <div className="mb-4">
                    {isReady ? (
                      <Badge className="bg-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Ready to Apply
                      </Badge>
                    ) : isAlmostReady ? (
                      <Badge className="bg-blue-600">Almost Ready</Badge>
                    ) : (
                      <Badge variant="secondary">Build More Skills</Badge>
                    )}
                  </div>

                  {/* Skills Needed */}
                  {step.skillsNeeded.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Skills to Develop:</p>
                      <div className="flex flex-wrap gap-2">
                        {step.skillsNeeded.map((skill, idx) => (
                          <Badge key={idx} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
