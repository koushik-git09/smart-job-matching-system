import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { X, Plus } from 'lucide-react';
import type { RecruiterProfile, JobSkill } from '@/app/types';

interface RecruiterProfileSetupProps {
  onComplete: (profile: RecruiterProfile) => void;
}

export function RecruiterProfileSetup({ onComplete }: RecruiterProfileSetupProps) {
  const [step, setStep] = useState(1);
  const [company, setCompany] = useState({ name: '', description: '', industry: '' });
  const [jobPosting, setJobPosting] = useState({
    title: '',
    description: '',
    experienceLevel: '',
    location: '',
    minSalary: '',
    maxSalary: '',
    type: 'Full-time'
  });
  const [requiredSkills, setRequiredSkills] = useState<JobSkill[]>([]);
  const [currentSkill, setCurrentSkill] = useState({
    name: '',
    priority: 'must-have' as const,
    experience: ''
  });

  const addSkill = () => {
    if (currentSkill.name && currentSkill.experience) {
      const newSkill: JobSkill = {
        name: currentSkill.name,
        priority: currentSkill.priority,
        minimumExperience: parseFloat(currentSkill.experience)
      };
      setRequiredSkills([...requiredSkills, newSkill]);
      setCurrentSkill({ name: '', priority: 'must-have', experience: '' });
    }
  };

  const removeSkill = (index: number) => {
    setRequiredSkills(requiredSkills.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    const profile: RecruiterProfile = {
      userId: '2',
      company: company.name,
      companyDescription: company.description,
      industry: company.industry,
      jobPostings: [{
        id: '1',
        title: jobPosting.title,
        description: jobPosting.description,
        requiredSkills,
        experienceLevel: jobPosting.experienceLevel,
        location: jobPosting.location,
        salaryRange: {
          min: parseInt(jobPosting.minSalary) || 0,
          max: parseInt(jobPosting.maxSalary) || 0
        },
        type: jobPosting.type,
        posted: new Date().toISOString().split('T')[0]
      }]
    };
    onComplete(profile);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded ${
                  s <= step ? 'bg-purple-600' : 'bg-gray-200'
                } ${s !== 1 ? 'ml-2' : ''}`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 text-center">
            Step {step} of 3
          </p>
        </div>

        {/* Step 1: Company Info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Company Name</Label>
                <Input
                  placeholder="e.g., Google"
                  value={company.name}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                />
              </div>

              <div>
                <Label>Industry</Label>
                <Select
                  value={company.industry}
                  onValueChange={(value) => setCompany({ ...company, industry: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Company Description</Label>
                <Textarea
                  placeholder="Brief description of your company..."
                  value={company.description}
                  onChange={(e) => setCompany({ ...company, description: e.target.value })}
                />
              </div>

              <Button onClick={() => setStep(2)} disabled={!company.name} className="w-full mt-6">
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Job Details */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Job Posting Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Job Title</Label>
                <Input
                  placeholder="e.g., Senior Data Scientist"
                  value={jobPosting.title}
                  onChange={(e) => setJobPosting({ ...jobPosting, title: e.target.value })}
                />
              </div>

              <div>
                <Label>Job Description</Label>
                <Textarea
                  placeholder="Describe the role, responsibilities, and requirements..."
                  value={jobPosting.description}
                  onChange={(e) => setJobPosting({ ...jobPosting, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Experience Level</Label>
                  <Select
                    value={jobPosting.experienceLevel}
                    onValueChange={(value) => setJobPosting({ ...jobPosting, experienceLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-2 years">Entry Level (0-2 years)</SelectItem>
                      <SelectItem value="3-5 years">Mid Level (3-5 years)</SelectItem>
                      <SelectItem value="5-8 years">Senior (5-8 years)</SelectItem>
                      <SelectItem value="8+ years">Lead (8+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Job Type</Label>
                  <Select
                    value={jobPosting.type}
                    onValueChange={(value) => setJobPosting({ ...jobPosting, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Location</Label>
                <Input
                  placeholder="e.g., San Francisco, CA or Remote"
                  value={jobPosting.location}
                  onChange={(e) => setJobPosting({ ...jobPosting, location: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Minimum Salary ($)</Label>
                  <Input
                    type="number"
                    placeholder="120000"
                    value={jobPosting.minSalary}
                    onChange={(e) => setJobPosting({ ...jobPosting, minSalary: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Maximum Salary ($)</Label>
                  <Input
                    type="number"
                    placeholder="180000"
                    value={jobPosting.maxSalary}
                    onChange={(e) => setJobPosting({ ...jobPosting, maxSalary: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!jobPosting.title} className="flex-1">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Required Skills */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Required Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <Label>Skill Name</Label>
                  <Input
                    placeholder="e.g., Python"
                    value={currentSkill.name}
                    onChange={(e) => setCurrentSkill({ ...currentSkill, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={currentSkill.priority}
                    onValueChange={(value: any) => setCurrentSkill({ ...currentSkill, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="must-have">Must-have</SelectItem>
                      <SelectItem value="good-to-have">Good-to-have</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Min. Experience (years)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="2"
                      value={currentSkill.experience}
                      onChange={(e) => setCurrentSkill({ ...currentSkill, experience: e.target.value })}
                    />
                    <Button onClick={addSkill}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {requiredSkills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant={skill.priority === 'must-have' ? 'default' : 'secondary'}
                    className="text-sm py-2 px-3"
                  >
                    {skill.name} ({skill.priority}) - {skill.minimumExperience}y+
                    <button onClick={() => removeSkill(index)} className="ml-2">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-4 mt-6">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={handleComplete} disabled={requiredSkills.length === 0} className="flex-1">
                  Complete Setup
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
