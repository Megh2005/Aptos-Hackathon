'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Building2, Globe, User as LucideUser, Mail, Camera, ArrowRight, CheckCircle, Edit } from "lucide-react"
import { onAuthStateChanged, User } from 'firebase/auth'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase/init'

interface CompanyData {
    companyName: string
    companyWebsite: string
    companyDescription: string
    onboardingCompleted: boolean
    onboardingCompletedAt?: string
}

const OnboardingPage = () => {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [initializing, setInitializing] = useState(true)
    const [dataExists, setDataExists] = useState(false)
    const [existingData, setExistingData] = useState<CompanyData | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        companyName: '',
        companyWebsite: '',
        companyDescription: ''
    })

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user)
                await fetchExistingData(user.uid)
                setInitializing(false)
            } else {
                // Redirect to auth if not authenticated
                router.push('/auth')
            }
        })

        return () => unsubscribe()
    }, [router])

    const fetchExistingData = async (userId: string) => {
        try {
            const userDocRef = doc(db, 'company', userId)
            const docSnap = await getDoc(userDocRef)

            if (docSnap.exists()) {
                const data = docSnap.data() as CompanyData
                // Check if the required fields exist and onboarding is completed
                if (data.companyName && data.onboardingCompleted) {
                    setExistingData(data)
                    setDataExists(true)
                    setFormData({
                        companyName: data.companyName,
                        companyWebsite: data.companyWebsite || '',
                        companyDescription: data.companyDescription || ''
                    })
                }
            }
        } catch (error) {
            console.error('Error fetching existing data:', error)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
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
            if (!formData.companyName.trim()) {
                throw new Error('Company name is required')
            }

            // Update user document in Firestore
            const userDocRef = doc(db, 'company', user.uid)
            await updateDoc(userDocRef, {
                companyName: formData.companyName.trim(),
                companyWebsite: formData.companyWebsite.trim(),
                companyDescription: formData.companyDescription.trim(),
                onboardingCompleted: true,
                onboardingCompletedAt: new Date().toISOString()
            })

            console.log('✅ Company information updated successfully')

            // Redirect to dashboard or next page
            router.push('/package')

        } catch (error: any) {
            console.error('❌ Error updating company info:', error)
            setError(error.message || 'Failed to save company information')
        } finally {
            setLoading(false)
        }
    }

    const handleContinue = () => {
        router.push('/package')
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
                        <Building2 className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                        {dataExists ? 'Welcome Back!' : 'Welcome to Your Journey'}
                    </h1>
                    <p className="text-xl text-gray-400">
                        {dataExists ? 'Your company profile is all set up' : 'Let\'s set up your company profile to get started'}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* User Info Card */}
                    <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <LucideUser className="h-5 w-5" />
                                Your Profile
                            </CardTitle>
                            <CardDescription className="text-gray-400">
                                Information from your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* User Details */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                                    <LucideUser className="h-4 w-4 text-blue-400" />
                                    <div>
                                        <p className="text-sm text-gray-400">Full Name</p>
                                        <p className="text-white">{user.displayName || 'Not provided'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                                    <Mail className="h-4 w-4 text-green-400" />
                                    <div>
                                        <p className="text-sm text-gray-400">Email Address</p>
                                        <p className="text-white">{user.email}</p>
                                    </div>
                                </div>
                                {dataExists && existingData?.onboardingCompletedAt && (
                                    <div className="flex items-center gap-3 p-3 bg-green-800/20 rounded-lg border border-green-800">
                                        <CheckCircle className="h-4 w-4 text-green-400" />
                                        <div>
                                            <p className="text-sm text-gray-400">Profile Completed</p>
                                            <p className="text-white text-sm">
                                                {new Date(existingData.onboardingCompletedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Company Info Form/Display */}
                    <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Company Information
                                {dataExists && (
                                    <CheckCircle className="h-5 w-5 text-green-400 ml-auto" />
                                )}
                            </CardTitle>
                            <CardDescription className="text-gray-400">
                                {dataExists ? 'Your company information' : 'Tell us about your company'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {dataExists ? (
                                // Display existing data (non-editable)
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-white">Company Name</Label>
                                            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                                                <p className="text-white">{existingData?.companyName}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-white flex items-center gap-2">
                                                <Globe className="h-4 w-4" />
                                                Company Website
                                            </Label>
                                            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                                                <p className="text-white">
                                                    {existingData?.companyWebsite || 'Not provided'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-white">Company Description</Label>
                                            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 min-h-[120px]">
                                                <p className="text-white whitespace-pre-wrap">
                                                    {existingData?.companyDescription || 'No description provided'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleContinue}
                                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 transition-all duration-200 transform hover:scale-[1.02]"
                                    >
                                        Continue to Next Step
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                // Show editable form
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {error && (
                                        <Alert className="bg-red-900/20 border-red-800">
                                            <AlertDescription className="text-red-400">
                                                {error}
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="companyName" className="text-white">
                                            Company Name *
                                        </Label>
                                        <Input
                                            id="companyName"
                                            name="companyName"
                                            value={formData.companyName}
                                            onChange={handleInputChange}
                                            placeholder="Enter your company name"
                                            className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="companyWebsite" className="text-white flex items-center gap-2">
                                            <Globe className="h-4 w-4" />
                                            Company Website
                                        </Label>
                                        <Input
                                            id="companyWebsite"
                                            name="companyWebsite"
                                            value={formData.companyWebsite}
                                            onChange={handleInputChange}
                                            placeholder="https://your-company.com"
                                            className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                                            type="url"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="companyDescription" className="text-white">
                                            Company Description
                                        </Label>
                                        <Textarea
                                            id="companyDescription"
                                            name="companyDescription"
                                            value={formData.companyDescription}
                                            onChange={handleInputChange}
                                            placeholder="Tell us about your company, what you do, and your goals..."
                                            className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 min-h-[120px] resize-none"
                                            rows={5}
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 transition-all duration-200 transform hover:scale-[1.02]"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Setting up your profile...
                                            </>
                                        ) : (
                                            <>
                                                Complete Setup
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-gray-500 text-sm">
                        {dataExists
                            ? 'Your information is secure and ready to use'
                            : 'Your information is secure and will be used to personalize your experience'
                        }
                    </p>
                </div>
            </div>
        </div>
    )
}

export default OnboardingPage