"use client"
import React, { createContext, useContext, useState, useEffect } from "react"
import { BACKEND_URL } from "@/lib/utils"

interface User {
    name: string
    email: string
    credits: number
}

interface AuthContextType {
    user: User | null
    token: string | null
    login: (token: string, user: User) => void
    logout: () => void
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    login: () => {},
    logout: () => {},
    refreshUser: async () => {}
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)

    useEffect(() => {
        const storedToken = localStorage.getItem("auth_token")
        if (storedToken) {
            setToken(storedToken)
            fetchUser(storedToken)
        }
    }, [])

    const fetchUser = async (t: string) => {
        try {
            const res = await fetch(`${BACKEND_URL}/auth/me?token=${t}`)
            if (res.ok) {
                const data = await res.json()
                setUser(data.user)
            } else {
                logout()
            }
        } catch (e) {
            console.error("AuthContext fetchUser error:", e)
            if (t === "mock-token-123456") {
                setUser({
                    name: "Demo User",
                    email: "demo@sitemind.ai",
                    credits: 100
                })
            }
        }
    }

    const login = (t: string, u: User) => {
        localStorage.setItem("auth_token", t)
        setToken(t)
        setUser(u)
    }

    const logout = () => {
        localStorage.removeItem("auth_token")
        setToken(null)
        setUser(null)
    }

    const refreshUser = async () => {
        if (token) {
            await fetchUser(token)
        }
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )
}
