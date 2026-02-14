import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  LogOut,
  Plus,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { CandidateMatchCard } from '@/app/components/CandidateMatchCard';
import { CandidateComparisonView } from '@/app/components/CandidateComparisonView';
import { mockCandidateMatches } from '@/app/data/mockData';
import type { RecruiterProfile } from '@/app/types';

interface RecruiterDashboardProps {
  profile: RecruiterProfile;
  onLogout: () => void;
}

export function RecruiterDashboard({ profile, onLogout }: RecruiterDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);

  // Calculate stats
  const totalCandidates = mockCandidateMatches.length;
  const highMatchCandidates = mockCandidateMatches.filter(c => c.matchPercentage >= 80).length;
  const averageMatch = Math.round(
    mockCandidateMatches.reduce((sum, c) => sum + c.matchPercentage, 0) / totalCandidates
  );

  const toggleCandidateSelection = (id: string) => {
    setSelectedCandidates(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Recruiter Dashboard</h1>
              <p className="text-sm text-gray-600">{profile.company} • {profile.industry}</p>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Candidates</p>
                  <p className="text-3xl font-bold text-blue-600">{totalCandidates}</p>
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
                  <p className="text-3xl font-bold text-green-600">{highMatchCandidates}</p>
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
                  <p className="text-3xl font-bold text-purple-600">{averageMatch}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <Progress value={averageMatch} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Jobs</p>
                  <p className="text-3xl font-bold text-orange-600">{profile.jobPostings.length}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="compare">
              Compare ({selectedCandidates.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Active Job Postings */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Active Job Postings</CardTitle>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Job Posting
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {profile.jobPostings.map((job) => (
                  <div key={job.id} className="p-4 border rounded-lg mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">{job.title}</h4>
                        <p className="text-sm text-gray-600">{job.location} • {job.type}</p>
                      </div>
                      <Badge>{job.experienceLevel}</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{job.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {job.requiredSkills.filter(s => s.priority === 'must-have').length} Must-have skills
                        </Badge>
                        <Badge variant="outline">
                          {job.requiredSkills.filter(s => s.priority === 'good-to-have').length} Good-to-have skills
                        </Badge>
                      </div>
                      <Button variant="link">View Details</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Matching Candidates */}
            <Card>
              <CardHeader>
                <CardTitle>Top Matching Candidates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockCandidateMatches.slice(0, 3).map((candidate) => (
                    <div key={candidate.candidateId} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{candidate.candidateName}</h4>
                          <p className="text-sm text-gray-600">
                            Applied for: {candidate.jobTitle}
                          </p>
                        </div>
                        <Badge variant={candidate.matchPercentage >= 80 ? 'default' : 'secondary'}>
                          {candidate.matchPercentage}% Match
                        </Badge>
                      </div>
                      <Progress value={candidate.matchPercentage} className="mb-2" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Readiness: {candidate.readinessScore}%</span>
                        <Button variant="link" size="sm" onClick={() => setActiveTab('candidates')}>
                          View Full Profile
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Candidates Tab */}
          <TabsContent value="candidates" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">All Candidates</h2>
              <div className="flex gap-3">
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {mockCandidateMatches.map((candidate) => (
              <CandidateMatchCard
                key={candidate.candidateId}
                candidate={candidate}
                isSelected={selectedCandidates.includes(candidate.candidateId)}
                onToggleSelect={() => toggleCandidateSelection(candidate.candidateId)}
              />
            ))}
          </TabsContent>

          {/* Compare Tab */}
          <TabsContent value="compare">
            {selectedCandidates.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold mb-2">No Candidates Selected</h3>
                  <p className="text-gray-600 mb-6">
                    Select 2 or more candidates from the Candidates tab to compare them side-by-side
                  </p>
                  <Button onClick={() => setActiveTab('candidates')}>
                    Go to Candidates
                  </Button>
                </CardContent>
              </Card>
            ) : selectedCandidates.length === 1 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold mb-2">Select More Candidates</h3>
                  <p className="text-gray-600 mb-6">
                    You've selected 1 candidate. Select at least one more to compare.
                  </p>
                  <Button onClick={() => setActiveTab('candidates')}>
                    Select More Candidates
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <CandidateComparisonView
                candidates={mockCandidateMatches.filter(c => 
                  selectedCandidates.includes(c.candidateId)
                )}
                onRemoveCandidate={toggleCandidateSelection}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
