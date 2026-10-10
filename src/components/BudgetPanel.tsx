import React, { useState, useEffect } from "react";
import {
  IndianRupee,
  PieChart,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Info,
} from "lucide-react";
import { BudgetBreakdown } from "../types/trip";

interface BudgetPanelProps {
  budget: BudgetBreakdown;
  onBufferChange?: (newBufferPercent: number) => void;
}

export const BudgetPanel: React.FC<BudgetPanelProps> = ({
  budget,
  onBufferChange,
}) => {
  const [editingBuffer, setEditingBuffer] = useState(false);
  const [bufferSlider, setBufferSlider] = useState(budget.bufferPercent || 10);

  useEffect(
    () => setBufferSlider(budget.bufferPercent),
    [budget.bufferPercent],
  );

  // Calculate percentages for the segmented bar
  const total = Math.max(1, budget.totalBudgetPaise);
  const planned = budget.plannedTotalPaise;
  const plannedPct = Math.min(100, Math.round((planned / total) * 100));

  // Category sums
  const stayCost =
    budget.items.find((i) => i.category === "STAY")?.amountPaise || 0;
  const transCost =
    budget.items.find((i) => i.category === "TRANSPORT")?.amountPaise || 0;
  const foodCost =
    budget.items.find((i) => i.category === "FOOD")?.amountPaise || 0;
  const actCost =
    budget.items.find((i) => i.category === "ACTIVITIES")?.amountPaise || 0;
  const buffCost = budget.bufferPaise || 0;

  const stayPct = Math.round((stayCost / total) * 100);
  const transPct = Math.round((transCost / total) * 100);
  const foodPct = Math.round((foodCost / total) * 100);
  const actPct = Math.round((actCost / total) * 100);
  const buffPct = Math.round((buffCost / total) * 100);

  return (
    <div className="neymo-card p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#cbd7cf] pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#b95d36]">
            ROOM FOR WHAT MATTERS
          </span>
          <h3 className="font-display font-bold text-lg text-[var(--text)]">
            Your weekend budget
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-[var(--text-muted)] block">
              Provisional subtotal
            </span>
            <span className="text-base font-extrabold text-[var(--text)]">
              ₹{(budget.plannedTotalPaise / 100).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="text-right border-l border-[#cbd7cf] pl-3">
            <span className="text-xs text-[var(--text-muted)] block">
              Target Cap
            </span>
            <span className="text-base font-bold text-[#245c4f]">
              ₹{(budget.totalBudgetPaise / 100).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Accessible Segmented Bar */}
      <div className="space-y-2">
        <div className="w-full h-4 rounded-full bg-[#d8e2da] overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${stayPct}%` }}
            title={`Stay: ₹${(stayCost / 100).toLocaleString("en-IN")} (${stayPct}%)`}
            className="bg-[#245c4f] h-full"
          />
          <div
            style={{ width: `${transPct}%` }}
            title={`Transport: ₹${(transCost / 100).toLocaleString("en-IN")} (${transPct}%)`}
            className="bg-[#3b826e] h-full"
          />
          <div
            style={{ width: `${foodPct}%` }}
            title={`Food: ₹${(foodCost / 100).toLocaleString("en-IN")} (${foodPct}%)`}
            className="bg-[#b95d36] h-full"
          />
          <div
            style={{ width: `${actPct}%` }}
            title={`Activities: ₹${(actCost / 100).toLocaleString("en-IN")} (${actPct}%)`}
            className="bg-[#e08960] h-full"
          />
          <div
            style={{ width: `${buffPct}%` }}
            title={`Buffer (${budget.bufferPercent}%): ₹${(buffCost / 100).toLocaleString("en-IN")}`}
            className="bg-[#789a8b] h-full"
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-[var(--text-muted)] pt-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#245c4f]" /> Stay (
              {stayPct}%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3b826e]" />{" "}
              Transport ({transPct}%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#b95d36]" /> Meals (
              {foodPct}%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e08960]" /> Sights
              ({actPct}%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#789a8b]" /> Buffer
              ({buffPct}%)
            </span>
          </div>

          <span className="font-semibold text-[var(--text)]">
            {plannedPct}% of budget estimated
          </span>
        </div>
      </div>

      {/* Exact Itemized Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-[#cbd7cf] text-[var(--text-muted)] font-semibold">
              <th className="py-2 pr-3">Item / Category</th>
              <th className="py-2 px-3">Calculation Basis</th>
              <th className="py-2 px-3 text-right">Amount (₹)</th>
              <th className="py-2 pl-3">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#cbd7cf]/60">
            {budget.items.map((item, idx) => (
              <tr key={idx} className="hover:bg-[#e4ede6]/60 transition-colors">
                <td className="py-2.5 pr-3">
                  <span className="font-bold text-[var(--text)] block">
                    {item.label}
                  </span>
                  {item.notes && (
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {item.notes}
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-[var(--text-muted)]">
                  {item.basis === "PER_PERSON" ? "Per Person" : "Group Total"}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-[var(--text)]">
                  ₹{(item.amountPaise / 100).toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 pl-3">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      item.isEstimate
                        ? "bg-[#ebf0ec] text-[#607a70]"
                        : "bg-[#d8e7dc] text-[#245c4f]"
                    }`}
                  >
                    {item.isEstimate ? "Estimate" : "Sourced"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Contingency Buffer Editor & Feasibility Banner */}
      <div className="p-4 bg-[#e5ede6] rounded-2xl border border-[#cbd8cf] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            {budget.isFeasible ? (
              <CheckCircle2 className="w-4 h-4 text-[#245c4f]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#b95d36]" />
            )}
            <span className="font-bold text-[var(--text)]">
              {budget.isFeasible
                ? "Within provisional subtotal"
                : "Known costs over budget"}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            {budget.feasibilityNotes}
          </p>
        </div>

        {/* Editable 10% Buffer Slider */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-[var(--text-muted)] block">
              Contingency Buffer
            </span>
            <span className="font-bold text-[#245c4f]">
              {budget.bufferPercent}%
            </span>
          </div>
          {onBufferChange && (
            <div className="flex items-center gap-2">
              <input
                aria-label="Contingency buffer percentage"
                type="range"
                min="0"
                max="20"
                step="5"
                value={bufferSlider}
                onChange={(e) => setBufferSlider(parseInt(e.target.value, 10))}
                className="w-20 accent-[#245c4f]"
              />
              <button
                className="text-xs underline"
                disabled={bufferSlider === budget.bufferPercent}
                onClick={() => onBufferChange(bufferSlider)}
              >
                Apply {bufferSlider}%
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
