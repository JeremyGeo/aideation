"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Loader2 } from "lucide-react"; 

const Home = () => {
  const [loading, setLoading] = useState(false);

  const handleGetStarted = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/check-auth");
      if (response.ok) {
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/sign-in";
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
    }

    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-r min-h-screen grainy from-rose-100 to-teal-100">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <h1 className="font-semibold text-7xl text-center">
          AI <span className="text-green-600 font-bold">note taking</span>{" "}
          assistant.
        </h1>
        <div className="mt-4"></div>
        <h2 className="font-semibold text-3xl text-center text-slate-700">
        </h2>
        <div className="mt-8"></div>

        <div className="flex justify-center">
          <Button
            className="bg-green-600"
            onClick={handleGetStarted}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              "Get Started"
            )}
            <ArrowRight className="ml-2 w-5 h-5" strokeWidth={3} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
