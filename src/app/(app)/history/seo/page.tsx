"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tags, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { loadSeoHistory, clearSeoHistory, type SeoSession } from "@/lib/history";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

const PLATFORM_LABELS: Record<string, string> = {
  adobe: "Adobe Stock",
  shutterstock: "Shutterstock",
  vecteezy: "Vecteezy",
};

export default function HistorySeoPage() {
  const [sessions, setSessions] = useState<SeoSession[]>([]);
  const [selected, setSelected] = useState<SeoSession | null>(null);

  useEffect(() => { setSessions(loadSeoHistory()); }, []);

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Disalin!");
  }

  function handleClear() {
    clearSeoHistory();
    setSessions([]);
    toast.success("Riwayat dihapus.");
  }

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Riwayat Generator SEO"
        description="Hasil generate metadata SEO yang pernah dibuat"
        actions={
          sessions.length > 0 ? (
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus Semua
            </Button>
          ) : undefined
        }
      />

      <div className="flex-1 p-6">
        {sessions.length === 0 ? (
          <Card className="flex items-center justify-center min-h-64">
            <CardContent className="text-center text-muted-foreground py-12">
              <Tags className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Belum ada riwayat SEO.</p>
              <p className="text-sm">Generate metadata pertamamu di halaman Generator SEO.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sessions.map((s) => (
              <Card
                key={s.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelected(s)}
              >
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">{PLATFORM_LABELS[s.platform] ?? s.platform}</Badge>
                    <Badge variant="outline" className="text-xs">{s.assetType}</Badge>
                  </div>
                  <p className="text-sm font-medium line-clamp-2">{s.items[0]?.result.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.items.length > 1 ? `${s.items.length} aset` : s.items[0]?.fileName}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {selected && PLATFORM_LABELS[selected.platform]} · {selected?.assetType}
              {selected && selected.items.length > 1 && ` · ${selected.items.length} aset`}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">{selected && formatDate(selected.createdAt)}</p>
          </DialogHeader>
          <div className="overflow-y-auto space-y-4 pr-1">
            {selected?.items.map((entry, i) => (
              <div key={i} className="border rounded-md p-3 space-y-3">
                {selected.items.length > 1 && (
                  <p className="text-xs font-semibold text-muted-foreground truncate">{entry.fileName}</p>
                )}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Judul</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => handleCopy(entry.result.title)}>
                      <Copy className="h-3 w-3 mr-1" />Copy
                    </Button>
                  </div>
                  <p className="text-sm bg-muted rounded px-2 py-1.5">{entry.result.title}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deskripsi</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => handleCopy(entry.result.description)}>
                      <Copy className="h-3 w-3 mr-1" />Copy
                    </Button>
                  </div>
                  <p className="text-sm bg-muted rounded px-2 py-1.5 leading-relaxed">{entry.result.description}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Keywords ({entry.result.keywords.length})</span>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => handleCopy(entry.result.keywords.join(", "))}>
                        <Copy className="h-3 w-3 mr-1" />Koma
                      </Button>
                      <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => handleCopy(entry.result.keywords.join("; "))}>
                        <Copy className="h-3 w-3 mr-1" />Titik koma
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.result.keywords.map((kw, j) => (
                      <Badge key={kw} variant={j < 10 ? "default" : "secondary"} className="text-xs cursor-pointer" onClick={() => handleCopy(kw)}>
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
