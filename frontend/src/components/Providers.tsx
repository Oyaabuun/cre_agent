"use client"

import React from "react"
import { AuthProvider } from "@/lib/AuthContext"

import { PayPalScriptProvider } from "@paypal/react-paypal-js"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <PayPalScriptProvider options={{ 
                clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "AaR-0pKSaZYK_5Xsee2eStvm2YAuGTe43qs9Ng57CGtUiWD0jFned_JJ-w7oEls37i-svnV2AgGTQe-1", 
                currency: "USD" 
            }}>
                {children}
            </PayPalScriptProvider>
        </AuthProvider>
    )
}
