"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Occupant } from "@/lib/types";

const EXTRA_MAINTENANCE_PER_ADDITIONAL_CAR = 2000;

const formatAmount = (value: string | number | undefined): string =>
  `₨ ${parseFloat(String(value || "0")).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

export default function CarMaintenancePage() {
  const qc = useQueryClient();
  const [editors, setEditors] = useState<Record<number, { carCount: number }>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: api.getTenants,
  });

  useEffect(() => {
    if (tenants.length === 0) return;
    setEditors((prev) => {
      const next: Record<number, { carCount: number }> = {};
      tenants.forEach((t) => {
        next[t.id] = prev[t.id] ?? { carCount: t.car_count ?? 1 };
      });
      return next;
    });
  }, [tenants]);

  const totals = useMemo(() => {
    return tenants.reduce(
      (acc, tenant) => {
        acc.extra += parseFloat(tenant.extra_car_charges || "0");
        acc.total += parseFloat(tenant.total_monthly_maintenance || "0");
        return acc;
      },
      { extra: 0, total: 0 },
    );
  }, [tenants]);

  const saveRow = async (tenant: Occupant) => {
    const editor = editors[tenant.id];
    if (!editor) return;
    const normalizedCars = Math.max(0, Number(editor.carCount || 0));

    try {
      setSavingId(tenant.id);
      await api.updateCarMaintenance(tenant.id, {
        car_count: normalizedCars,
        extra_car_maintenance_fee: EXTRA_MAINTENANCE_PER_ADDITIONAL_CAR.toFixed(2),
      });
      qc.invalidateQueries({ queryKey: ["tenants"] });
      setToast({ type: "success", message: `Updated parking for Unit ${tenant.unit.unit_no}` });
    } catch (err) {
      setToast({ type: "error", message: (err as Error).message || "Failed to update." });
    } finally {
      setSavingId(null);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Parking & Vehicle Maintenance
        </h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
          First vehicle included in base maintenance. Additional vehicles incur ₨ 2,000/month.
        </p>
      </div>

      {toast && (
        <div
          className={`rounded-xl px-4 py-3 text-xs font-medium border flex items-center justify-between ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300"
              : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300"
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-black dark:hover:text-white">✕</button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d131f] p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Total Extra Vehicle Charges
          </p>
          <p className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {formatAmount(totals.extra)}
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Monthly incremental parking fees</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d131f] p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Total Monthly Collections (Base + Cars)
          </p>
          <p className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {formatAmount(totals.total)}
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Combined expected monthly dues</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d131f] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-zinc-400 font-bold uppercase text-[10px] bg-slate-50 dark:bg-white/[0.02]">
                <th className="py-3 px-4">Flat #</th>
                <th className="py-3 px-4">Resident</th>
                <th className="py-3 px-4 text-right">Base Fee</th>
                <th className="py-3 px-4 text-center">Vehicles Count</th>
                <th className="py-3 px-4 text-right">Extra Cars Fee</th>
                <th className="py-3 px-4 text-right">Total Maintenance</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4"><div className="h-5 bg-slate-200 dark:bg-white/[0.03] rounded" /></td>
                  </tr>
                ))
              ) : (
                tenants.map((t, idx) => {
                  const carCount = editors[t.id]?.carCount ?? (t.car_count || 1);
                  const isSaving = savingId === t.id;
                  return (
                    <tr key={`${t.id}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">{t.unit.unit_no}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-zinc-100">{t.name}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700 dark:text-zinc-300">
                        {formatAmount(parseFloat(t.monthly_maintenance_fee || "0"))}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-white/[0.04] p-1 rounded-lg border border-slate-200 dark:border-white/10">
                          <button
                            type="button"
                            onClick={() =>
                              setEditors((prev) => ({
                                ...prev,
                                [t.id]: { carCount: Math.max(0, carCount - 1) },
                              }))
                            }
                            className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-black dark:bg-white/10 dark:hover:bg-white/20 dark:text-white flex items-center justify-center font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-slate-900 dark:text-white">{carCount}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditors((prev) => ({
                                ...prev,
                                [t.id]: { carCount: carCount + 1 },
                              }))
                            }
                            className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-black dark:bg-white/10 dark:hover:bg-white/20 dark:text-white flex items-center justify-center font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-zinc-300">
                        {formatAmount(Math.max(0, carCount - 1) * EXTRA_MAINTENANCE_PER_ADDITIONAL_CAR)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatAmount(
                          parseFloat(t.monthly_maintenance_fee || "0") +
                            Math.max(0, carCount - 1) * EXTRA_MAINTENANCE_PER_ADDITIONAL_CAR
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => saveRow(t)}
                          className="rounded-lg bg-slate-100 hover:bg-black hover:text-white text-slate-800 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white dark:hover:text-black px-3 py-1.5 text-xs font-bold transition-colors press-feedback disabled:opacity-50"
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
