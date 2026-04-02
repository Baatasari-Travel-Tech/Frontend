"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function VerifyPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);

    const res = await apiFetch("/api/v1/admin/verify", {
      method: "POST",
      body: JSON.stringify({ token }),
    });

    const data = await res.json();

    if (res.ok) {
      // 🔥 store JWT
      localStorage.setItem("admin_token", data.data.token);

      router.push("/admin/89a85e00a259b262c18c8081df7217fd/dashboard");
    } else {
      alert("Invalid code");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <h2 className="text-xl font-bold">Enter OTP</h2>

        <input
          maxLength={6}
          className="border p-3 text-center text-2xl"
          onChange={(e) => setToken(e.target.value)}
        />

        <button
          onClick={handleVerify}
          disabled={loading || token.length < 6}
          className="bg-black text-white px-6 py-3 rounded-lg"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </div>
    </div>
  );
}