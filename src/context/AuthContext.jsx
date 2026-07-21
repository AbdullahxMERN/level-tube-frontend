"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/services/api";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function initAuth() {
      // Initialize auth state from local storage on client mount
      const storedUser = api.getUser();
      const storedToken = api.getToken();

      if (storedUser && storedToken) {
        setUser(storedUser);
        setToken(storedToken);

        // Proactively verify/refresh the access token on app load,
        // since it may have silently expired (e.g. after 15 minutes).
        // getCurrentUser() hits a route protected by verifyJwt, so an
        // expired token will trigger api.js's built-in 401 -> refresh -> retry flow.
        try {
          const response = await api.auth.getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data);
            if (typeof window !== "undefined") {
              localStorage.setItem(
                "currentUser",
                JSON.stringify(response.data),
              );
            }
          }
        } catch (err) {
          console.warn("Session expired, logging out", err);
          setUser(null);
          setToken(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("currentUser");
          }
        }
      }

      setLoading(false);
    }

    initAuth();
  }, []);

  const login = async (usernameOrEmail, password) => {
    setLoading(true);
    try {
      const response = await api.auth.login(usernameOrEmail, password);
      if (response.success && response.data) {
        setUser(response.data.user);
        setToken(response.data.accessToken);
        router.push("/");
        return { success: true };
      }
      return { success: false, error: response.message };
    } catch (err) {
      return { success: false, error: err.message || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      const response = await api.auth.register(formData);
      if (response.success && response.data) {
        setUser(response.data.user);
        setToken(response.data.accessToken);
        router.push("/"); // go straight to homepage, not /login
        return { success: true };
      }
      return { success: false, error: response.message };
    } catch (err) {
      return { success: false, error: err.message || "Registration failed" };
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (idToken) => {
    setLoading(true);
    try {
      const response = await api.auth.googleLogin(idToken);
      if (response.success && response.data) {
        setUser(response.data.user);
        setToken(response.data.accessToken);
        router.push("/");
        return { success: true };
      }
      return { success: false, error: response.message };
    } catch (err) {
      return { success: false, error: err.message || "Google sign-in failed" };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.auth.logout();
    } catch (err) {
      console.warn("Logout failed, clearing local storage anyway", err);
    } finally {
      setUser(null);
      setToken(null);
      setLoading(false);
      router.push("/login");
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.auth.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
        if (typeof window !== "undefined") {
          localStorage.setItem("currentUser", JSON.stringify(response.data));
        }
      }
    } catch (err) {
      console.error("Failed to sync current user status", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        googleLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
