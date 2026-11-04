"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CalendarCheck,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Target,
  Wand2,
  Tags,
  ExternalLink,
  Flame,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  Check,
  Award,
  Layers,
  ChevronRight,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  loadWeeklyPlan,
  toggleTaskCompletion,
  resetWeeklyPlanWithCurrentTrends,
  getTodayDayIndex,
  getTodayDayName,
  type WeeklyPlan,
  type DailyTask,
} from "@/lib/weekly-plan";

export default function WeeklyTargetPage() {
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "today" | "pending">("all");

  const todayIndex = getTodayDayIndex(); // 0 for Senin, 6 for Minggu
  const todayName = getTodayDayName();

  useEffect(() => {
    setPlan(loadWeeklyPlan());
  }, []);

  function handleToggle(taskId: string) {
    if (!plan) return;
    const updated = toggleTaskCompletion(plan.weekId, taskId);
    setPlan(updated);
    const task = updated.tasks.find((t) => t.id === taskId);
    if (task?.completed) {
      toast.success(`🎉 Hebat! Tugas hari ${task.dayName} selesai! Target mingguan semakin dekat.`);
    } else {
      toast.info(`Status tugas hari ${task?.dayName} dikembalikan ke belum selesai.`);
    }
  }

  function handleSyncTrends() {
    const refreshed = resetWeeklyPlanWithCurrentTrends();
    setPlan(refreshed);
    toast.success("Rencana mingguan berhasil disinkronkan dengan tren terbaru!");
  }

  if (!plan) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const completedCount = plan.tasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedCount / plan.tasks.length) * 100);

  const filteredTasks = plan.tasks.filter((t) => {
    if (activeFilter === "today") return t.dayOrder === todayIndex + 1;
    if (activeFilter === "pending") return !t.completed;
    return true;
  });

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Target Mingguan (Weekly Action Plan)"
        description="Panduan aksi terukur Senin sampai Minggu berdasarkan analisis tren aktif agar portofolio microstock Anda konsisten & cepat laku"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncTrends}
              className="h-8 text-xs font-medium cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Sinkronkan Tren Baru
            </Button>
            <Badge variant="secondary" className="text-xs py-1 px-2.5 font-medium">
              📅 {plan.weekRangeLabel}
            </Badge>
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Weekly Goal & Progress Banner */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-amber-500/5 shadow-xs">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs bg-primary font-semibold">
                    Minggu {plan.weekId}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-amber-300 text-amber-800 dark:text-amber-300 bg-amber-50/50">
                    🔥 Tren Utama: {plan.category}
                  </Badge>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <span>Tema Mingguan: {plan.mainTheme}</span>
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  🎯 <strong>Target Utama:</strong> {plan.weeklyGoal}
                </p>
              </div>

              <div className="bg-background/80 dark:bg-muted/40 p-3.5 rounded-xl border shrink-0 text-center sm:text-right min-w-44 space-y-1">
                <div className="text-xs text-muted-foreground font-medium">Progres Minggu Ini</div>
                <div className="text-2xl font-bold text-primary flex items-center justify-center sm:justify-end gap-1">
                  <span>{completedCount} / 7</span>
                  <span className="text-xs font-normal text-muted-foreground">Hari ({progressPercent}%)</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {progressPercent === 100
                    ? "🎉 Semua target tercapai!"
                    : `Hari ini: ${todayName} (Hari ke-${todayIndex + 1})`}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Pemenuhan Jadwal Kerja Harian</span>
                <span className="font-semibold text-foreground">{progressPercent}% Selesai</span>
              </div>
              <Progress value={progressPercent} className="h-2.5" />
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-border/60">
              <span className="text-xs text-muted-foreground mr-1">Tampilkan:</span>
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors border cursor-pointer",
                  activeFilter === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                )}
              >
                Semua Hari (7 Hari Penuh)
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("today")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors border cursor-pointer flex items-center gap-1",
                  activeFilter === "today"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                )}
              >
                <Sparkles className="h-3 w-3 text-amber-500" />
                Khusus Hari Ini ({todayName})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("pending")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors border cursor-pointer",
                  activeFilter === "pending"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                )}
              >
                Belum Selesai ({7 - completedCount})
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 7 Days Timeline Schedule */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              <span>Jadwal Rutinitas Kerja Harian (Senin — Minggu)</span>
            </h3>
            <span className="text-xs text-muted-foreground">
              Klik kotak centang untuk menandai tugas selesai
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredTasks.map((task) => {
              const isToday = task.dayOrder === todayIndex + 1;
              return (
                <Card
                  key={task.id}
                  className={cn(
                    "transition-all duration-200 overflow-hidden border",
                    task.completed
                      ? "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-300/60 dark:border-emerald-800/40 opacity-90"
                      : isToday
                      ? "border-primary ring-2 ring-primary/20 bg-card shadow-sm"
                      : "bg-card hover:border-border/90"
                  )}
                >
                  <CardContent className="p-4 sm:p-5 space-y-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggle(task.id)}
                          className={cn(
                            "mt-0.5 h-6 w-6 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0",
                            task.completed
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                              : "border-input bg-background hover:bg-muted hover:border-primary/50"
                          )}
                          title={task.completed ? "Tandai belum selesai" : "Tandai selesai"}
                        >
                          {task.completed ? <Check className="h-4 w-4 stroke-[3]" /> : null}
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary">
                              {task.dayName} • {task.phase}
                            </span>
                            {isToday && (
                              <Badge className="text-[10px] py-0 h-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold animate-pulse">
                                HARI INI
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] py-0 h-4 border-muted-foreground/30">
                              {task.category}
                            </Badge>
                          </div>
                          <h4
                            className={cn(
                              "text-base font-bold text-foreground transition-colors",
                              task.completed && "line-through text-muted-foreground"
                            )}
                          >
                            {task.title}
                          </h4>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="shrink-0">
                        {task.isExternalLink ? (
                          <a
                            href={task.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              buttonVariants({ variant: isToday ? "default" : "outline", size: "sm" }),
                              "h-8 text-xs font-semibold cursor-pointer shadow-xs"
                            )}
                          >
                            <span>{task.actionLabel}</span>
                            <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                          </a>
                        ) : (
                          <Link
                            href={task.actionUrl}
                            className={cn(
                              buttonVariants({ variant: isToday ? "default" : "outline", size: "sm" }),
                              "h-8 text-xs font-semibold shadow-xs"
                            )}
                          >
                            <span>{task.actionLabel}</span>
                            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Step-by-step checklist ("Harus ngapain aja") */}
                    <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1.5 border border-border/50">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-primary" />
                        <span>Langkah Aksi Hari {task.dayName} (Harus Ngapain Aja):</span>
                      </div>
                      <ul className="space-y-1 pl-1 text-muted-foreground leading-relaxed">
                        {task.actionItems.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-primary font-bold mt-0.5">•</span>
                            <span className={task.completed ? "line-through opacity-80" : ""}>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Footer Details: Target Terukur & Tips */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-border/50 text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <Award className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>
                          Target Terukur: <strong className="text-primary">{task.targetOutput}</strong>
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 italic">
                        <Lightbulb className="h-3 w-3 text-amber-500 shrink-0" />
                        <span>{task.tips}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
