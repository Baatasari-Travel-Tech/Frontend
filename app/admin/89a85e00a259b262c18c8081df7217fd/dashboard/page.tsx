/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("admin_token");

      if (!token) {
        router.push("/admin/89a85e00a259b262c18c8081df7217fd/login");
        return;
      }

      const res = await apiFetch("/api/v1/admin/dashboard");

      if (!res.ok) {
        localStorage.removeItem("admin_token");
        router.push("/admin/89a85e00a259b262c18c8081df7217fd/login");
        return;
      }

      const result = await res.json();
      setData(result.data);
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>{data.message}</p>
    </div>
  );
}
