"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import "../design.css";

type Participant = {
  id: string;
  name: string;
  email: string | null;
  is_checked_in: boolean;
  check_in_time: string | null;
};
type Ev = { name: string; expected_participants: number | null };

export default function DashboardPage() {
  const [eventId, setEventId] = useState<string | null | undefined>(undefined);
  const [ev, setEv] = useState<Ev | null>(null);
  const [list, setList] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("eventId");
    setEventId(id);
  }, []);

  const load = useCallback(async () => {
    if (!eventId) return;
    const [{ data: evData }, { data: pData }] = await Promise.all([
      supabase.from("events").select("name, expected_participants").eq("id", eventId).single(),
      supabase
        .from("participants")
        .select("id, name, email, is_checked_in, check_in_time")
        .eq("event_id", eventId)
        .order("check_in_time", { ascending: false, nullsFirst: false }),
    ]);
    if (evData) setEv(evData as Ev);
    setList((pData ?? []) as Participant[]);
    setUpdated(new Date());
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    if (eventId === undefined) return;
    if (!eventId) {
      setLoading(false);
      return;
    }
    load();
    const t = setInterval(load, 8000); // auto-refresh tiap 8 detik
    return () => clearInterval(t);
  }, [eventId, load]);

  if (eventId === null) {
    return (
      <div className="bd flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="material-symbols-outlined text-6xl" style={{ color: "var(--error)" }}>link_off</span>
        <h1 className="text-2xl font-bold">Link dashboard tidak valid</h1>
        <Link href="/create" className="rounded-lg px-6 py-3 font-bold" style={{ background: "var(--green)", color: "var(--on-green)" }}>Buat Event</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bd flex min-h-screen items-center justify-center">
        <p style={{ color: "var(--on-surface-variant)" }}>Memuat dashboard...</p>
      </div>
    );
  }

  const total = list.length;
  const checkedIn = list.filter((p) => p.is_checked_in).length;
  const belum = total - checkedIn;
  const cap = ev?.expected_participants ?? null;
  const sisa = cap !== null ? Math.max(cap - total, 0) : null;

  const stats = [
    { label: "Total Terdaftar", value: cap !== null ? `${total} / ${cap}` : `${total}`, icon: "groups", color: "var(--primary)" },
    { label: "Sudah Check-in", value: `${checkedIn}`, icon: "task_alt", color: "var(--green)" },
    { label: "Belum Check-in", value: `${belum}`, icon: "schedule", color: "var(--on-surface-variant)" },
    { label: "Kuota Sisa", value: sisa !== null ? `${sisa}` : "Unlimited", icon: "confirmation_number", color: sisa === 0 ? "var(--error)" : "var(--cyan)" },
  ];

  const initials = (name: string) =>
    name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="bd min-h-screen px-4 pt-6 pb-16 md:px-10">
      {/* Header */}
      <header className="mx-auto mb-8 flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Dashboard Event</p>
          <h1 className="text-2xl font-bold">{ev?.name ?? "Event"}</h1>
        </div>
        <div className="flex items-center gap-3">
          {updated && (
            <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
              Diperbarui {updated.toLocaleTimeString("id-ID")}
            </span>
          )}
          <button onClick={load} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--outline-variant)" }}>
            <span className="material-symbols-outlined text-base">refresh</span>
            Refresh
          </button>
        </div>
      </header>

      {/* Stat cards */}
      <div className="mx-auto mb-8 grid max-w-5xl grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-2xl p-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>{s.label}</p>
              <span className="material-symbols-outlined" style={{ color: s.color }}>{s.icon}</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Registrant list */}
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-4 text-lg font-bold">Daftar Peserta ({total})</h2>
        {total === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>
            Belum ada peserta yang daftar.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {list.map((p) => (
              <div key={p.id} className="glass flex items-center justify-between gap-3 rounded-xl p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold" style={{ background: "var(--surface-container)", color: "var(--primary)" }}>
                    {initials(p.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.name}</p>
                    {p.email && <p className="truncate text-xs" style={{ color: "var(--on-surface-variant)" }}>{p.email}</p>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {p.is_checked_in ? (
                    <>
                      <span className="flex items-center justify-end gap-1 text-sm font-semibold" style={{ color: "var(--green)" }}>
                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        Check-in
                      </span>
                      {p.check_in_time && (
                        <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                          {new Date(p.check_in_time).toLocaleTimeString("id-ID")}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="rounded-full px-3 py-1 text-xs" style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}>
                      Belum hadir
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
