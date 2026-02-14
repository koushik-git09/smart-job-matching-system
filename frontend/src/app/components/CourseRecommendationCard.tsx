import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Star, Clock, TrendingUp, ExternalLink, BookmarkPlus } from 'lucide-react';
import type { CourseRecommendation } from '@/app/types';

interface CourseRecommendationCardProps {
  course: CourseRecommendation;
}

export function CourseRecommendationCard({ course }: CourseRecommendationCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{course.title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{course.platform}</p>
          </div>
          <Badge variant="secondary">{course.level}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Course Info */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{course.rating}</span>
          </div>
        </div>

        {/* Readiness Boost */}
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="font-medium text-green-700">
              +{course.readinessBoost}% Readiness Boost
            </span>
          </div>
        </div>

        {/* Skills Covered */}
        <div>
          <h4 className="text-sm font-medium mb-2">Skills You'll Learn</h4>
          <div className="flex flex-wrap gap-2">
            {course.skillsCovered.map((skill, idx) => (
              <Badge key={idx} variant="outline">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button className="flex-1">
            <ExternalLink className="w-4 h-4 mr-2" />
            Enroll Now
          </Button>
          <Button variant="outline" size="icon">
            <BookmarkPlus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
