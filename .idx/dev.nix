"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUp, Mic, Plus, Settings } from "lucide-react";

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <main className="flex flex-col h-screen bg-[#131314] text-white">
      {/* 🔹 Top Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          VEDA
        </h1>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings />
          </Button>
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold">
            {user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-600"
          >
            Logout
          </Button>
        </div>
      </header>

      {/* 🔹 Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="bg-gray-800 p-4 rounded-2xl max-w-3xl">
          👋 Hello {user?.email || "there"}! I’m VEDA. Ask me anything or
          explore the hubs.
        </div>
        {/* Example User Message */}
        <div className="flex justify-end">
          <div className="bg-purple-600 p-4 rounded-2xl max-w-3xl">
            Example user message here...
          </div>
        </div>
      </div>

      {/* 🔹 Input Box */}
      <div className="px-6 py-4 border-t border-gray-800">
        <div className="flex items-center gap-2 bg-[#1e1f20] rounded-full px-4 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:bg-gray-700 rounded-full"
          >
            <Plus />
          </Button>
          <Input
            placeholder="Ask VEDA..."
            className="flex-1 bg-transparent border-none text-lg text-gray-200 placeholder-gray-500 focus:ring-0 focus:outline-none"
          />
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:bg-gray-700 rounded-full"
          >
            <Mic />
          </Button>
          <Button
            size="icon"
            className="bg-purple-600 hover:bg-purple-700 rounded-full"
          >
            <ArrowUp className="text-white" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          VEDA may display inaccurate info. Always verify important information.
        </p>
      </div>
    </main>
  );
}
