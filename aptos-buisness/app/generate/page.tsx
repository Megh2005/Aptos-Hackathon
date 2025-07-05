"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Brain, Globe, Database, CheckCircle } from 'lucide-react';
import { db } from '@/firebase/init';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

type Company = {
  id: string;
  companyName: string;
  companyDescription: string;
  companyWebsite: string;
  difficultyLevel: string;
  numberOfQuestions: number;
  [key: string]: any; // for any additional fields
};

type Question = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

const QuestionGeneratorPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      const companiesRef = collection(db, 'company');
      const snapshot = await getDocs(companiesRef);
      const companiesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          companyName: data.companyName || '',
          companyDescription: data.companyDescription || '',
          companyWebsite: data.companyWebsite || '',
          difficultyLevel: data.difficultyLevel || '',
          numberOfQuestions: data.numberOfQuestions || 0,
          ...data
        };
      });
      setCompanies(companiesData);
    } catch (err) {
      setError('Failed to load companies from Firebase');
      console.error('Error loading companies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const scrapeWebsite = async (url: string): Promise<string> => {
    try {
      setStatus('Scraping website content...');

      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to scrape website');
      }

      const data = await response.json();
      return data.content;
    } catch (err) {
      console.error('Error scraping website:', err);
      throw new Error('Failed to scrape website content');
    }
  };

  const generateQuestionsWithGemini = async (content: string, company: Company): Promise<Question[]> => {
    try {
      setStatus('Generating questions with Gemini AI...');

      const prompt = `Based on the following company information and website content, you must generate ${company.numberOfQuestions} multiple-choice questions with difficulty level: ${company.difficultyLevel}.

Company: ${company.companyName}
Description: ${company.companyDescription}
Website: ${company.companyWebsite}
Website Content: ${content}

Please generate questions that test knowledge about:
1. Company background and mission
2. Products/services offered
3. Industry knowledge
4. Technical concepts related to their field

Format each question as JSON with this structure:
{
  "question": "Question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Why this answer is correct"
}

Return only a valid JSON array of ${company.numberOfQuestions} questions. Make sure the JSON is properly formatted and parseable.`;

      const response = await fetch('/api/gemini/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          companyData: company
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate questions');
      }

      const data = await response.json();
      return data.questions;
    } catch (err) {
      console.error('Error generating questions:', err);
      throw new Error('Failed to generate questions with Gemini AI');
    }
  };

  const saveQuestionsToFirebase = async (questions: Question[], companyId: string): Promise<boolean> => {
    try {
      setStatus('Saving questions to Firebase...');

      const questionsRef = collection(db, 'questions');
      const savePromises = questions.map((question: Question) =>
        addDoc(questionsRef, {
          ...question,
          companyId,
          createdAt: serverTimestamp(),
          isActive: true
        })
      );

      await Promise.all(savePromises);
      setStatus('Questions saved successfully!');
      return true;
    } catch (err) {
      console.error('Error saving questions:', err);
      throw new Error('Failed to save questions to Firebase');
    }
  };

  const handleGenerateQuestions = async () => {
    if (!selectedCompany) {
      setError('Please select a company first');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedQuestions([]);
    setStatus('');

    try {
      const company = companies.find(c => c.id === selectedCompany);

      if (!company) {
        throw new Error('Selected company not found');
      }

      // Step 1: Scrape website
      const websiteContent = await scrapeWebsite(company.companyWebsite);

      // Step 2: Generate questions with Gemini
      const questions = await generateQuestionsWithGemini(websiteContent, company);

      // Step 3: Save to Firebase
      await saveQuestionsToFirebase(questions, company.id);

      setGeneratedQuestions(questions);
      setStatus(`Successfully generated and saved ${questions.length} questions!`);
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Failed to generate questions'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedCompanyData = companies.find(c => c.id === selectedCompany);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AI Question Generator
          </h1>
          <p className="text-gray-400">Generate intelligent questions from company websites using Gemini AI</p>
        </div>

        {/* Company Selection */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Select Company
            </CardTitle>
            <CardDescription>Choose a company to generate questions for</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-select">Company</Label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCompanyData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-gray-300">{selectedCompanyData.companyDescription}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Website</Label>
                  <p className="text-blue-400">{selectedCompanyData.companyWebsite}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Difficulty Level</Label>
                  <p className="text-gray-300 capitalize">{selectedCompanyData.difficultyLevel}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Number of Questions</Label>
                  <p className="text-gray-300">{selectedCompanyData.numberOfQuestions}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generation Controls */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Generate Questions
            </CardTitle>
            <CardDescription>
              AI will scrape the company website and generate relevant questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGenerateQuestions}
              disabled={!selectedCompany || isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Generate Questions
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Status Messages */}
        {status && (
          <Alert className="bg-green-900 border-green-700">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-200">{status}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="bg-red-900 border-red-700">
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {/* Generated Questions */}
        {generatedQuestions.length > 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Generated Questions</CardTitle>
              <CardDescription>
                {generatedQuestions.length} questions generated and saved to Firebase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedQuestions.map((q, index) => (
                <div key={index} className="p-4 bg-gray-800 rounded-lg space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                      Q{index + 1}
                    </span>
                    <h3 className="font-medium text-white">{q.question}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-12">
                    {q.options.map((option: string, optIndex: number) => (
                      <div
                        key={optIndex}
                        className={`p-2 rounded border ${optIndex === q.correctAnswer
                          ? 'bg-green-900 border-green-700 text-green-200'
                          : 'bg-gray-700 border-gray-600 text-gray-300'
                          }`}
                      >
                        <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span> {option}
                      </div>
                    ))}
                  </div>

                  <div className="ml-12 text-sm text-gray-400">
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QuestionGeneratorPage;