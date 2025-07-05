"use client"

import { useState } from "react"
import { CheckCircle, Hash, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Component() {
    const [isGenerating, setIsGenerating] = useState(false)

    const handleGenerateQuestions = () => {
        setIsGenerating(true)
        // Simulate API call
        setTimeout(() => {
            setIsGenerating(false)
            alert("Questions generated successfully!")
        }, 2000)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                {/* Success Animation */}
                <div className="text-center">
                    <div
                        className="inline-flex items-center justify-center w-24 h-24 bg-green-900/30 border border-green-500/20 rounded-full mb-6"
                        style={{
                            animation: "bounce-in 0.6s ease-out",
                        }}
                    >
                        <CheckCircle
                            className="w-14 h-14 text-green-400"
                            style={{
                                animation: "check-draw 0.8s ease-out 0.3s both",
                            }}
                        />
                    </div>
                    <h1
                        className="text-3xl font-bold text-white mb-3"
                        style={{
                            animation: "fade-up 0.6s ease-out 0.4s both",
                        }}
                    >
                        Payment Successful!
                    </h1>
                    <p
                        className="text-gray-300 text-lg"
                        style={{
                            animation: "fade-up 0.6s ease-out 0.5s both",
                        }}
                    >
                        Your transaction has been processed successfully.
                    </p>
                </div>

                {/* Transaction Details Card */}
                <Card
                    className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm shadow-2xl"
                    style={{
                        animation: "slide-up 0.6s ease-out 0.6s both",
                    }}
                >
                    <CardHeader className="pb-4">
                        <CardTitle className="flex text-center items-center gap-2 text-xl text-white">
                            <Hash className="w-5 h-5 text-blue-400" />
                            Transaction Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/30">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Transaction ID</span>
                                <span className="font-mono text-green-400 font-semibold">
                                    TXN-2024-{Math.random().toString().slice(2, 8)}
                                </span>
                            </div>
                        </div>

                        <div className="bg-green-900/20 border border-green-500/20 p-4 rounded-lg">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-green-300 font-medium">Payment Confirmed</p>
                                    <p className="text-green-400/80 text-sm mt-1">
                                        Your payment has been securely processed and confirmed. A confirmation email will be sent shortly.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Generate Questions Button */}
                <div
                    className="space-y-4"
                    style={{
                        animation: "fade-up 0.6s ease-out 0.8s both",
                    }}
                >
                    <Button
                        className="w-full bg-white text-black font-medium py-4 h-auto transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                        onClick={() => window.location.href = '/generate'}
                    >
                        Generate Questions
                    </Button>

                    <p className="text-center text-sm text-gray-500">Get personalized questions based on your purchase</p>
                </div>

            </div>

            {/* Custom CSS Animations */}
            <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes check-draw {
          0% {
            transform: scale(0) rotate(45deg);
            opacity: 0;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes fade-up {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slide-up {
          0% {
            transform: translateY(30px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
        </div>
    )
}