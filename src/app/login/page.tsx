"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Layers, Loader2, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/dashboard";

  const [accessKey, setAccessKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanKey = accessKey.trim().toUpperCase();

    if (!cleanKey) {
      toast.error("Silakan masukkan Access Key Anda.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: cleanKey }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Access key tidak valid.");
      }

      toast.success("Akses berhasil! Membuka studio...");
      router.push(from);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal masuk.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md mb-2">
            <Layers className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Microstock Asset Studio</h1>
          <p className="text-sm text-muted-foreground">
            Portal Riset, Generator Prompt, dan SEO Microstock
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border/60 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              Masuk dengan Access Key
            </CardTitle>
            <CardDescription>
              Masukkan kunci akses rahasia Anda untuk membuka dasbor dan generator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="access-key" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Access Key (Kapital)
                </Label>
                <div className="relative">
                  <Input
                    id="access-key"
                    type={showKey ? "text" : "password"}
                    placeholder="WR-XXXX-XXXX-XXXX"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                    className="font-mono tracking-widest uppercase pr-10 h-11 text-sm font-medium"
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-10 font-medium" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    Buka Studio
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>

              <div className="pt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                <span>Sesi aktif otomatis selama 30 hari di peramban ini</span>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} wildanrahayu.online &middot; Private Studio
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

