"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Wand2,
  Tags,
  AlertTriangle,
  Settings,
  Sparkles,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { loadSettings } from "@/lib/settings";
import type { TrendData } from "@/app/api/trend/route";

const chartConfig = {
  score: { label: "Trend Score", color: "oklch(0.4341 0.0392 41.9938)" },
};

function StatSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

function EmptyState({ onGoSettings }: { onGoSettings?: () => void }) {
  return (
    <Card className="col-span-full">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <Settings className="h-10 w-10 text-muted-foreground opacity-40" />
        <p className="font-medium">Belum ada API key</p>
        <p className="text-sm text-muted-foreground">Tambahkan Gemini API key di Settings untuk melihat data tren real-time.</p>
        <Link href="/settings" className={cn(buttonVariants({ size: "sm" }), "mt-2")}>
          Ke Settings
        </Link>
      </CardContent>
    </Card>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="col-span-full border-red-200 bg-red-50">
      <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <p className="font-medium text-red-700">Gagal memuat data tren</p>
        <p className="text-sm text-red-600">{message}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Coba Lagi
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [platform, setPlatform] = useState("all");
  const [assetType, setAssetType] = useState("all");
  const [region, setRegion] = useState("global");
  const [data, setData] = useState<TrendData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noKeys, setNoKeys] = useState(false);

  const fetchTrends = useCallback(async () => {
    const settings = loadSettings();
    if (settings.geminiKeys.length === 0) {
      setNoKeys(true);
      return;
    }
    setNoKeys(false);
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keys: settings.geminiKeys,
          model: settings.geminiModel,
          platform,
          assetType,
          region,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat data");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  }, [platform, assetType, region]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const isEmpty = !isLoading && !data && !error;

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Trend Dashboard"
        description="Analisis tren real-time aset microstock via Gemini AI + Google Search"
        actions={
          <div className="flex items-center gap-2">
            {data && (
              <span className="text-xs text-muted-foreground">
                Diperbarui: {data.updatedAt}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={fetchTrends} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              {isLoading ? "Memuat..." : "Refresh"}
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={platform} onValueChange={(v) => v && setPlatform(v)}
            items={{ all: "Semua Platform", adobe: "Adobe Stock", shutterstock: "Shutterstock", vecteezy: "Vecteezy" }}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Platform</SelectItem>
              <SelectItem value="adobe">Adobe Stock</SelectItem>
              <SelectItem value="shutterstock">Shutterstock</SelectItem>
              <SelectItem value="vecteezy">Vecteezy</SelectItem>
            </SelectContent>
          </Select>

          <Select value={assetType} onValueChange={(v) => v && setAssetType(v)}
            items={{ all: "Semua Tipe", photo: "Foto", vector: "Vector", video: "Video" }}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="photo">Foto</SelectItem>
              <SelectItem value="vector">Vector</SelectItem>
              <SelectItem value="video">Video</SelectItem>
            </SelectContent>
          </Select>

          <Select value={region} onValueChange={(v) => v && setRegion(v)}
            items={{ global: "Global", id: "Indonesia", us: "USA", eu: "Europe", as: "Asia" }}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global</SelectItem>
              <SelectItem value="id">Indonesia</SelectItem>
              <SelectItem value="us">USA</SelectItem>
              <SelectItem value="eu">Europe</SelectItem>
              <SelectItem value="as">Asia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* No keys state */}
        {noKeys && (
          <div className="grid">
            <EmptyState />
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="grid">
            <ErrorState message={error} onRetry={fetchTrends} />
          </div>
        )}

        {/* AI Summary */}
        {(isLoading || data) && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-3 flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              {isLoading ? (
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <p className="text-sm">{data?.summary}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        {(isLoading || data) && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
            ) : (
              [
                { label: "Keyword Rising", value: String(data!.stats.risingCount), change: "saat ini", trend: "up" },
                { label: "Avg Trend Score", value: String(data!.stats.avgTrendScore), change: "dari 100", trend: "up" },
                { label: "Kategori Saturated", value: String(data!.stats.saturatedCount), change: "terlalu kompetitif", trend: "down" },
                { label: "Peluang Baru", value: String(data!.stats.opportunitiesCount), change: "siap dieksplor", trend: "up" },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardHeader className="pb-2"><CardDescription>{stat.label}</CardDescription></CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {stat.trend === "up"
                        ? <TrendingUp className="h-3 w-3 text-green-500" />
                        : <TrendingDown className="h-3 w-3 text-red-500" />}
                      <span className="text-xs text-muted-foreground">{stat.change}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Chart + Categories */}
        {(isLoading || data) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Tren 6 Bulan Terakhir</CardTitle>
                <CardDescription>Estimasi indeks tren konten microstock</CardDescription>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <ChartContainer config={chartConfig} className="h-64 w-full">
                    <LineChart data={data!.trendChart} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={28} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="score" stroke="var(--color-score)" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kategori Teratas</CardTitle>
                <CardDescription>Berdasarkan trend score saat ini</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-12" /></div>
                        <Skeleton className="h-1.5 w-full" />
                      </div>
                    ))
                  : data!.categories.map((cat) => (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{cat.name}</span>
                          <div className="flex items-center gap-2">
                            {cat.growth > 0
                              ? <span className="text-green-600 text-xs">+{cat.growth}%</span>
                              : <span className="text-red-500 text-xs">{cat.growth}%</span>}
                            <span className="text-muted-foreground text-xs">{cat.score}</span>
                          </div>
                        </div>
                        <Progress value={cat.score} className="h-1.5" />
                      </div>
                    ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Keywords */}
        {(isLoading || data) && (
          <Tabs defaultValue="rising">
            <TabsList>
              <TabsTrigger value="rising">
                <TrendingUp className="h-4 w-4 mr-1" />Rising Keywords
              </TabsTrigger>
              <TabsTrigger value="saturated">
                <TrendingDown className="h-4 w-4 mr-1" />Saturated
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rising" className="mt-3">
              <Card>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="divide-y">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3 gap-4">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {data!.risingKeywords.map((kw, i) => (
                        <div key={kw.keyword} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-sm font-medium text-muted-foreground w-5 shrink-0">{i + 1}</span>
                            <div className="min-w-0">
                              <span className="font-medium text-sm">{kw.keyword}</span>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <Badge variant="outline" className="text-xs py-0 h-4">{kw.platform}</Badge>
                                <span className="text-xs text-muted-foreground truncate">{kw.reason}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right hidden sm:block">
                              <div className="text-sm font-semibold">{kw.score}</div>
                              <div className="text-xs text-green-600">{kw.change}</div>
                            </div>
                            <div className="flex gap-1">
                              <Link href={`/prompt?keyword=${encodeURIComponent(kw.keyword)}`}
                                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 text-xs")}>
                                <Wand2 className="h-3 w-3 mr-1" />Prompt
                              </Link>
                              <Link href={`/seo?keyword=${encodeURIComponent(kw.keyword)}`}
                                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 text-xs")}>
                                <Tags className="h-3 w-3 mr-1" />SEO
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="saturated" className="mt-3">
              <Card>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="divide-y">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3 gap-4">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {data!.saturatedKeywords.map((kw) => (
                        <div key={kw.keyword} className="flex items-center justify-between px-4 py-3">
                          <div>
                            <span className="font-medium text-sm">{kw.keyword}</span>
                            <div className="text-xs text-muted-foreground mt-0.5">{kw.reason}</div>
                            <div className="text-xs text-muted-foreground">Kompetisi: {kw.competition}%</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-semibold text-muted-foreground">{kw.score}</div>
                            <div className="text-xs text-red-500">{kw.change}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
