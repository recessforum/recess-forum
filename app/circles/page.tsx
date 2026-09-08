"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Plus, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { Circle } from "@/lib/types";
import { CreateCircleModal } from "@/components/CreateCircleModal";

export default function CirclesPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [circles, setCircles] = useState<Circle[] | null>(null);
  const [myCircleIds, setMyCircleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [circlesRes, mineRes] = await Promise.all([
        fetch("/api/circles"),
        fetch("/api/circles/mine"),
      ]);
      const circlesData = await circlesRes.json();
      const mineData = await mineRes.json();
      setCircles(circlesData.circles);
      setMyCircleIds(mineData.circleIds);
      setLoading(false);
    })();
  }, []);

  const toggleJoin = async (circle: Circle) => {
    if (!profile) { router.push("/login"); return; }
    setJoiningId(circle.id);
    const isMember = myCircleIds.includes(circle.id);
    const res = await fetch(`/api/circles/${circle.id}/${isMember ? "leave" : "join"}`, { method: "POST" });
    if (res.ok) {
      setMyCircleIds((ids) => (isMember ? ids.filter((i) => i !== circle.id) : [...ids, circle.id]));
      setCircles((cs) => cs && cs.map((c) => (c.id === circle.id ? { ...c, memberCount: c.memberCount + (isMember ? -1 : 1) } : c)));
    }
    setJoiningId(null);
  };

  const handleCreate = async (input: { name: string; description: string; state: string | null }) => {
    const res = await fetch("/api/circles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "failed");
    setShowCreate(false);
    if (data.circle) router.push(`/circles/${data.circle.id}`);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 flex items-center justify-center gap-2 text-[#9A968A] text-[14px]">
        <Loader2 size={16} className="animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 w-full">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-[22px] font-semibold text-[#1C1B19]">Circles</h1>
        {profile && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#26364A] text-white text-[13px] font-medium hover:bg-[#1e2c3d] transition-colors">
            <Plus size={15} /> Create a circle
          </button>
        )}
      </div>
      <p className="text-[13px] text-[#9A968A] mb-6">Smaller groups within Recess Forum — join the ones that fit you. Circle posts still show up in search and the main feed.</p>

      {(circles || []).length === 0 ? (
        <p className="text-[14px] text-[#9A968A] italic">No circles yet — be the first to start one.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {(circles || []).map((c) => {
            const isMember = myCircleIds.includes(c.id);
            return (
              <div key={c.id} className="border border-[#E6E3DA] bg-white p-4 flex items-start gap-4">
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => router.push(`/circles/${c.id}`)}>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-semibold text-[#1C1B19]">{c.name}</h3>
                    {c.state && (
                      <span className="flex items-center gap-0.5 text-[12px] text-[#9A968A]">
                        <MapPin size={11} /> {c.state}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-[#5B584F] line-clamp-2 mb-1.5">{c.description}</p>
                  <span className="flex items-center gap-1 text-[12px] text-[#9A968A]">
                    <Users size={12} /> {c.memberCount} member{c.memberCount === 1 ? "" : "s"}
                  </span>
                </div>
                <button disabled={joiningId === c.id} onClick={() => toggleJoin(c)}
                  className={`shrink-0 px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-40 ${
                    isMember
                      ? "border border-[#E6E3DA] text-[#5B584F] hover:text-[#B23B3B] hover:border-[#B23B3B]"
                      : "bg-[#26364A] text-white hover:bg-[#1e2c3d]"
                  }`}>
                  {isMember ? "Leave" : "Join"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && <CreateCircleModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} />}
    </div>
  );
}
