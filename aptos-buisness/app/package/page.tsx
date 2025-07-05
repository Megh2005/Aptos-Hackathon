'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Brain, DollarSign, UserIcon, CheckCircle, ArrowRight } from "lucide-react"
import { onAuthStateChanged, User } from 'firebase/auth'
import { doc, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase/init'

const QuizConfigurationPage = () => {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [initializing, setInitializing] = useState(true)
    const [calculatedPrice, setCalculatedPrice] = useState(0)

    // Form state
    const [formData, setFormData] = useState({
        numberOfQuestions: '',
        difficultyLevel: ''
    })

    const questionOptions = [
        { value: '10', label: '10 Questions', description: 'Quick assessment' },
        { value: '20', label: '20 Questions', description: 'Standard evaluation' },
        { value: '30', label: '30 Questions', description: 'Comprehensive test' }
    ]

    const difficultyOptions = [
        { value: 'easy', label: 'Easy', description: 'Basic level questions', color: 'text-green-400' },
        { value: 'medium', label: 'Medium', description: 'Intermediate level', color: 'text-yellow-400' },
        { value: 'hard', label: 'Hard', description: 'Advanced level', color: 'text-red-400' }
    ]

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user)
                setInitializing(false)
            } else {
                // Redirect to auth if not authenticated
                router.push('/auth')
            }
        })

        return () => unsubscribe()
    }, [router])

    // Calculate price based on selections
    useEffect(() => {
        if (formData.numberOfQuestions && formData.difficultyLevel) {
            const basePrice = calculatePrice(formData.numberOfQuestions, formData.difficultyLevel)
            setCalculatedPrice(basePrice)
        } else {
            setCalculatedPrice(0)
        }
    }, [formData.numberOfQuestions, formData.difficultyLevel])

    const calculatePrice = (questions: string, difficulty: string) => {
        const questionCount = parseInt(questions)

        // Base price ranges for different combinations
        const priceRanges = {
            '10-easy': [8, 15],
            '10-medium': [12, 22],
            '10-hard': [18, 30],
            '20-easy': [15, 28],
            '20-medium': [22, 40],
            '20-hard': [35, 55],
            '30-easy': [20, 38],
            '30-medium': [32, 58],
            '30-hard': [48, 75]
        }

        const key = `${questionCount}-${difficulty}`
        const range = priceRanges[key as keyof typeof priceRanges] || [10, 50]

        // Generate random price within the range
        const randomPrice = Math.random() * (range[1] - range[0]) + range[0]

        // Round to 2 decimal places
        return Math.round(randomPrice * 100) / 100
    }

    const handleQuestionChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            numberOfQuestions: value
        }))
    }

    const handleDifficultyChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            difficultyLevel: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (!user) {
                throw new Error('User not authenticated')
            }

            // Validate form
            if (!formData.numberOfQuestions || !formData.difficultyLevel) {
                throw new Error('Please select both number of questions and difficulty level')
            }

            // Prepare quiz configuration data - add directly to user document
            const quizConfigData = {
                numberOfQuestions: parseInt(formData.numberOfQuestions),
                difficultyLevel: formData.difficultyLevel,
                calculatedPrice: calculatedPrice,
                configuredAt: new Date().toISOString(),
                status: 'configured'
            }

            // Reference to the user's document in the company collection
            const userDocRef = doc(db, 'company', user.uid)

            // Update the user's document with quiz configuration fields directly
            await updateDoc(userDocRef, quizConfigData)

            console.log('✅ Quiz configuration saved successfully to company collection for user:', user.uid)

            // Redirect to next page (payment or quiz start)
            router.replace("/success")

        } catch (error: any) {
            console.error('❌ Error saving quiz configuration:', error)

            // If document doesn't exist, create it with the quiz configuration
            if (error.code === 'not-found') {
                try {
                    const userDocRef = doc(db, 'company', user?.uid || '')
                    await setDoc(userDocRef, {
                        userEmail: user?.email || null,
                        numberOfQuestions: parseInt(formData.numberOfQuestions),
                        difficultyLevel: formData.difficultyLevel,
                        calculatedPrice: calculatedPrice,
                        configuredAt: new Date().toISOString(),
                        status: 'configured'
                    }, { merge: true })

                    console.log('✅ Quiz configuration saved successfully to new company document for user:', user?.uid)
                    router.replace("/success")
                } catch (createError: any) {
                    console.error('❌ Error creating company document:', createError)
                    setError(createError.message || 'Failed to save quiz configuration')
                }
            } else {
                setError(error.message || 'Failed to save quiz configuration')
            }
        } finally {
            setLoading(false)
        }
    }

    if (initializing) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        )
    }

    if (!user) {
        return null // Will redirect to auth
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center p-4">
            <div className="w-full max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                        <Brain className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Configure Your Quiz
                    </h1>
                    <p className="text-xl text-gray-400">
                        Customize your assessment experience
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* User Info Card */}
                    <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <UserIcon className="h-5 w-5" />
                                Your Account
                            </CardTitle>
                            <CardDescription className="text-gray-400">
                                Currently logged in as
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                                    <UserIcon className="h-4 w-4 text-blue-400" />
                                    <div>
                                        <p className="text-sm text-gray-400">Name</p>
                                        <p className="text-white">{user.displayName || 'Not provided'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                                    <CheckCircle className="h-4 w-4 text-green-400" />
                                    <div>
                                        <p className="text-sm text-gray-400">Email</p>
                                        <p className="text-white">{user.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Price Display */}
                            {calculatedPrice > 0 && (
                                <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-lg border border-blue-500/30">
                                    <div className="flex items-center gap-2 mb-2">
                                        <DollarSign className="h-5 w-5 text-green-400" />
                                        <h3 className="text-white font-semibold">Estimated Cost</h3>
                                    </div>
                                    <p className="text-3xl font-bold text-green-400">${calculatedPrice}</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Based on your selections
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quiz Configuration Form */}
                    <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Brain className="h-5 w-5" />
                                Quiz Settings
                            </CardTitle>
                            <CardDescription className="text-gray-400">
                                Choose your preferences
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {error && (
                                    <Alert className="bg-red-900/20 border-red-800">
                                        <AlertDescription className="text-red-400">
                                            {error}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Number of Questions */}
                                <div className="space-y-4">
                                    <Label className="text-white text-lg font-semibold">
                                        Number of Questions
                                    </Label>
                                    <RadioGroup
                                        value={formData.numberOfQuestions}
                                        onValueChange={handleQuestionChange}
                                        className="space-y-3"
                                    >
                                        {questionOptions.map((option) => (
                                            <div key={option.value} className="flex items-center space-x-3">
                                                <RadioGroupItem
                                                    value={option.value}
                                                    id={`questions-${option.value}`}
                                                    className="border-gray-600 text-blue-500"
                                                />
                                                <Label
                                                    htmlFor={`questions-${option.value}`}
                                                    className="text-white cursor-pointer flex-1 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-medium">{option.label}</p>
                                                            <p className="text-sm text-gray-400">{option.description}</p>
                                                        </div>
                                                    </div>
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                {/* Difficulty Level */}
                                <div className="space-y-4">
                                    <Label className="text-white text-lg font-semibold">
                                        Difficulty Level
                                    </Label>
                                    <RadioGroup
                                        value={formData.difficultyLevel}
                                        onValueChange={handleDifficultyChange}
                                        className="space-y-3"
                                    >
                                        {difficultyOptions.map((option) => (
                                            <div key={option.value} className="flex items-center space-x-3">
                                                <RadioGroupItem
                                                    value={option.value}
                                                    id={`difficulty-${option.value}`}
                                                    className="border-gray-600 text-blue-500"
                                                />
                                                <Label
                                                    htmlFor={`difficulty-${option.value}`}
                                                    className="text-white cursor-pointer flex-1 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className={`font-medium ${option.color}`}>{option.label}</p>
                                                            <p className="text-sm text-gray-400">{option.description}</p>
                                                        </div>
                                                    </div>
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading || !formData.numberOfQuestions || !formData.difficultyLevel}
                                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Configuring Quiz...
                                        </>
                                    ) : (
                                        <>
                                            Continue to Payment
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-gray-500 text-sm">
                        Your quiz configuration will be saved securely. Price may vary based on current rates.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default QuizConfigurationPage