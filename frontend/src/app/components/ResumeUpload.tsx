import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Progress } from '@/app/components/ui/progress';
import { Badge } from '@/app/components/ui/badge';
import { Upload, FileText, CheckCircle2, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';

interface ResumeUploadProps {
  open: boolean;
  onClose: () => void;
  onSkillsExtracted?: (skills: string[]) => void;
}

export function ResumeUpload({ open, onClose, onSkillsExtracted }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionComplete, setExtractionComplete] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    skills: string[];
    experience: string[];
    education: string[];
    certifications: string[];
  } | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.doc') || droppedFile.name.endsWith('.docx'))) {
      setFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const processResume = async () => {
    if (!file) return;

    setIsProcessing(true);
    
    // Simulate NLP processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock extracted data
    const mockData = {
      skills: [
        'Python', 'Machine Learning', 'Data Analysis', 'SQL', 'TensorFlow',
        'Pandas', 'NumPy', 'Scikit-learn', 'Git', 'Docker'
      ],
      experience: [
        'Data Analyst at TechCorp (2020-2023)',
        'Junior Data Scientist at StartupXYZ (2019-2020)'
      ],
      education: [
        'B.S. Computer Science, MIT (2019)',
        'Machine Learning Certification, Coursera (2021)'
      ],
      certifications: [
        'AWS Certified Machine Learning',
        'Google Data Analytics Professional Certificate'
      ]
    };

    setExtractedData(mockData);
    setIsProcessing(false);
    setExtractionComplete(true);
    
    if (onSkillsExtracted) {
      onSkillsExtracted(mockData.skills);
    }
  };

  const handleReset = () => {
    setFile(null);
    setIsProcessing(false);
    setExtractionComplete(false);
    setExtractedData(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload & Analyze Resume</DialogTitle>
        </DialogHeader>

        {!extractionComplete ? (
          <div className="space-y-6">
            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              {!file ? (
                <>
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Drop your resume here</p>
                  <p className="text-sm text-gray-600 mb-4">or</p>
                  <Button asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Browse Files
                    </label>
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileSelect}
                  />
                  <p className="text-xs text-gray-500 mt-4">
                    Supports PDF, DOC, DOCX (Max 10MB)
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-center gap-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleReset}
                    disabled={isProcessing}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Processing */}
            {isProcessing && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Analyzing your resume...</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Extracting skills</span>
                    <span className="text-gray-600">In progress...</span>
                  </div>
                  <Progress value={75} />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {file && !isProcessing && (
              <div className="flex gap-3">
                <Button onClick={processResume} className="flex-1">
                  Analyze Resume with AI
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Remove
                </Button>
              </div>
            )}

            {/* Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  What we'll extract:
                </h4>
                <ul className="text-sm text-gray-700 space-y-1 ml-6">
                  <li>• Technical skills and proficiency levels</li>
                  <li>• Years of experience for each skill</li>
                  <li>• Education and certifications</li>
                  <li>• Work experience and roles</li>
                  <li>• Tools and technologies used</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900">Resume analyzed successfully!</h4>
                <p className="text-sm text-green-700">
                  We've extracted key information from your resume using AI-powered NLP.
                </p>
              </div>
            </div>

            {/* Extracted Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Extracted Skills ({extractedData?.skills.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {extractedData?.skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Experience */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Work Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {extractedData?.experience.map((exp, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-sm">{exp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Education */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Education</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {extractedData?.education.map((edu, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">{edu}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Certifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Certifications</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {extractedData?.certifications.map((cert, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5" />
                      <span className="text-sm">{cert}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={onClose} className="flex-1">
                Update Profile with Extracted Data
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Upload Different Resume
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
