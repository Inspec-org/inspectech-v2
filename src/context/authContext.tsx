"use client";
import React, { createContext, useState, useEffect, ReactNode } from "react";
import Cookies from "js-cookie";
import { usePathname, useRouter } from "next/navigation";
import { buildRequestBody, apiRequest } from "@/utils/apiWrapper";

// Types
export interface User {
  email: string;
  username?: string;
  avatar?: string;
  role?: string;
  _id?: string;
}

interface UserContextType {
  user: User | null;
  session_id: string;
  setUser: (user: User | null) => void;
  login: (session_id: string) => void;
  logout: () => void;
  loading: boolean;
}

interface UserProviderProps {
  children: ReactNode;
}

// Context
export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  session_id: "",
  login: () => {},
  logout: () => {},
  loading: true,
});

// Provider
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [session_id, setSession_id] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const pathname = usePathname();
  const router = useRouter();
  const payload = buildRequestBody({});

  const fetchUser = async (sessionId: string) => {
    try {
      const response = await apiRequest("/api/auth/fetch_user", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      });

      

      if (!response.ok) {
        // if ([401, 403].includes(response.status)) {
        //   ;
        //   setUser(null);
        //   Cookies.remove("session_id");
        //   localStorage.removeItem("session_id");
        //   setSession_id("");
        // }
        throw new Error("Failed to fetch Admin");
      }

      const data = await response.json();
      
      setUser(data.user);
    } catch (err) {
      ;
      // Clear invalid session
      setUser(null);
      Cookies.remove("session_id");
      localStorage.removeItem("session_id");
      setSession_id("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedSession = localStorage.getItem("session_id") || Cookies.get("session_id");
    
    if (savedSession?.trim()) {
      setSession_id(savedSession);
      setLoading(true);
      fetchUser(savedSession);
    } else {
      setUser(null);
      setLoading(false);
    }
  }, []);

  const login = (sessionId: string) => {
    setLoading(true);
    Cookies.set("session_id", sessionId); 
    localStorage.setItem("session_id", sessionId);
    setSession_id(sessionId);
    fetchUser(sessionId);
  };

  const logout = () => {
    fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
    }).finally(() => {
      Cookies.remove("session_id");
      localStorage.clear();
      sessionStorage.clear();
      setSession_id("");
      setUser(null);
      router.replace("/signin");
    });
  };

  return (
    <UserContext.Provider value={{ user, setUser, session_id, login, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};
