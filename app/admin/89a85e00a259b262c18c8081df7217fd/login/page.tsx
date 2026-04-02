"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    const res = await apiFetch("/api/v1/admin/login", {
      method: "POST",
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push("/admin/89a85e00a259b262c18c8081df7217fd/verify");
    } else {
      alert("Invalid credentials");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Portal</h1>

        <div className="space-y-5">
          <input
            placeholder="Username"
            className="w-full border p-3 rounded-lg"
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border p-3 rounded-lg"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
