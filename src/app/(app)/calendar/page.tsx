"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Globe, Wand2, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { addDays, format, isSameDay, isWithinInterval } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";

type SeasonalEvent = {
  id: string;
  name: string;
  country: string;
  countryName: string;
  category: "religi" | "nasional" | "komersial" | "musim";
  startDate: Date;
  endDate?: Date;
  leadTimeDays: number;
  themes: string[];
};

const seasonalEvents: SeasonalEvent[] = [
  // ── JANUARI ──
  { id: "jan-1", name: "Tahun Baru", country: "GLOBAL", countryName: "Global", category: "komersial", startDate: new Date(2026, 0, 1), leadTimeDays: 30, themes: ["new year", "fireworks", "celebration", "countdown", "confetti"] },
  { id: "jan-2", name: "Hari Republik India", country: "IN", countryName: "India", category: "nasional", startDate: new Date(2026, 0, 26), leadTimeDays: 21, themes: ["india republic day", "flag india", "parade", "taj mahal"] },
  { id: "jan-3", name: "Australia Day", country: "AU", countryName: "Australia", category: "nasional", startDate: new Date(2026, 0, 26), leadTimeDays: 21, themes: ["australia day", "kangaroo", "outback", "flag australia", "bbq"] },

  // ── FEBRUARI ──
  { id: "feb-1", name: "Olimpiade Musim Dingin 2026", country: "GLOBAL", countryName: "Global", category: "komersial", startDate: new Date(2026, 1, 6), endDate: new Date(2026, 1, 22), leadTimeDays: 45, themes: ["winter olympics", "skiing", "ice skating", "snow sport", "milan cortina"] },
  { id: "feb-2", name: "Hari Valentine", country: "GLOBAL", countryName: "Global", category: "komersial", startDate: new Date(2026, 1, 14), leadTimeDays: 30, themes: ["valentine", "love", "hearts", "romantic", "roses", "couple"] },
  { id: "feb-3", name: "Tahun Baru Imlek – Tahun Kuda", country: "CN", countryName: "China & Asia Timur", category: "religi", startDate: new Date(2026, 1, 17), leadTimeDays: 45, themes: ["chinese new year", "horse zodiac", "red lantern", "dragon dance", "lunar new year", "gold coin"] },
  { id: "feb-4", name: "Ramadan 2026", country: "MENA", countryName: "Global Muslim", category: "religi", startDate: new Date(2026, 1, 18), endDate: new Date(2026, 2, 19), leadTimeDays: 45, themes: ["ramadan", "mosque", "crescent moon", "lantern", "iftar", "prayer", "quran"] },

  // ── MARET ──
  { id: "mar-1", name: "Holi", country: "IN", countryName: "India", category: "religi", startDate: new Date(2026, 2, 3), leadTimeDays: 30, themes: ["holi", "color powder", "spring festival", "india festival", "vibrant colors"] },
  { id: "mar-2", name: "Hari Perempuan Internasional", country: "GLOBAL", countryName: "Global", category: "komersial", startDate: new Date(2026, 2, 8), leadTimeDays: 21, themes: ["women's day", "empowerment", "feminism", "flowers", "equality", "strong women"] },
  { id: "mar-3", name: "St. Patrick's Day", country: "IE", countryName: "Irlandia & Global", category: "nasional", startDate: new Date(2026, 2, 17), leadTimeDays: 21, themes: ["st patrick", "shamrock", "green", "ireland", "clover", "leprechaun"] },
  { id: "mar-4", name: "Hari Raya Nyepi", country: "ID", countryName: "Indonesia", category: "religi", startDate: new Date(2026, 2, 19), leadTimeDays: 30, themes: ["nyepi", "bali", "ogoh ogoh", "hindu bali", "silence day"] },
  { id: "mar-5", name: "Idul Fitri 2026", country: "MENA", countryName: "Global Muslim", category: "religi", startDate: new Date(2026, 2, 20), leadTimeDays: 45, themes: ["eid mubarak", "eid al-fitr", "lebaran", "mosque", "ketupat", "family gathering"] },

  // ── APRIL ──
  { id: "apr-1", name: "Paskah", country: "GLOBAL", countryName: "Global", category: "religi", startDate: new Date(2026, 3, 5), leadTimeDays: 30, themes: ["easter", "easter eggs", "bunny", "spring flowers", "church"] },
  { id: "apr-2", name: "Songkran", country: "TH", countryName: "Thailand", category: "religi", startDate: new Date(2026, 3, 13), endDate: new Date(2026, 3, 15), leadTimeDays: 30, themes: ["songkran", "water festival", "thailand", "new year water", "elephant"] },
  { id: "apr-3", name: "Hari Kartini", country: "ID", countryName: "Indonesia", category: "nasional", startDate: new Date(2026, 3, 21), leadTimeDays: 21, themes: ["kartini", "kebaya", "indonesia women", "emancipation", "education"] },
  { id: "apr-4", name: "Hari Bumi", country: "GLOBAL", countryName: "Global", category: "komersial", startDate: new Date(2026, 3, 22), leadTimeDays: 21, themes: ["earth day", "environment", "nature", "green", "sustainability", "eco friendly"] },
  { id: "apr-5", name: "ANZAC Day", country: "AU", countryName: "Australia & NZ", category: "nasional", startDate: new Date(2026, 3, 25), leadTimeDays: 21, themes: ["anzac", "poppy", "australia", "memorial", "soldier", "remembrance"] },

  // ── MEI ──
  { id: "may-1", name: "Hari Buruh Internasional", country: "GLOBAL", countryName: "Global", category: "nasional", startDate: new Date(2026, 4, 1), leadTimeDays: 14, themes: ["labor day", "may day", "workers", "industry", "solidarity"] },
  { id: "may-2", name: "Hari Ibu Internasional", country: "GLOBAL", countryName: "Global", category: "komersial", startDate: new Date(2026, 4, 10), leadTimeDays: 21, themes: ["mother's day", "mom", "flowers bouquet", "love family", "gift"] },
  { id: "may-3", name: "Hari Afrika", country: "GLOBAL", countryName: "Afrika", category: "nasional", startDate: new Date(2026, 4, 25), leadTimeDays: 21, themes: ["africa", "wildlife safari", "savanna", "africa culture", "diversity"] },
  { id: "may-4", name: "Idul Adha 2026", country: "MENA", countryName: "Global Muslim", category: "religi", startDate: new Date(2026, 4, 27), endDate: new Date(2026, 4, 28), leadTimeDays: 45, themes: ["idul adha", "kurban", "eid mubarak", "sheep goat", "arabic pattern"] },

  // ── JUNI ──
  { id: "jun-1", name: "Hari Lingkungan Hidup Sedunia", country: "GLOBAL", countryName: "Global", category: "komersial", startDate: new Date(2026, 5, 5), leadTimeDays: 14, themes: ["environment", "green earth", "tree planting", "ocean clean", "nature"] },
  { id: "jun-2", name: "Piala Dunia FIFA 2026", country: "GLOBAL", countryName: "Global", category: "komersial", startDate: new Date(2026, 5, 11), endDate: new Date(2026, 6, 19), leadTimeDays: 60, themes: ["world cup", "football", "soccer", "fifa", "stadium", "trophy", "jersey"] },
  { id: "jun-3", name: "Hari Ayah Internasional", country: "GLOBAL", countryName: "Global", category: "komersial", startDate: new Date(2026, 5, 21), leadTimeDays: 21, themes: ["father's day", "dad", "family", "tie", "gift", "hero"] },
  { id: "jun-4", name: "Summer Season", country: "GLOBAL", countryName: "Belahan Bumi Utara", category: "musim", startDate: new Date(2026, 5, 21), endDate: new Date(2026, 8, 22), leadTimeDays: 30, themes: ["summer beach", "tropical", "sunflower", "vacation", "ice cream", "pool"] },

  // ── JULI ──
  { id: "jul-1", name: "Independence Day USA", country: "US", countryName: "Amerika Serikat", category: "nasional", startDate: new Date(2026, 6, 4), leadTimeDays: 30, themes: ["fireworks", "american flag", "patriotic", "4th of july", "usa freedom"] },
  { id: "jul-2", name: "Bastille Day", country: "FR", countryName: "Prancis", category: "nasional", startDate: new Date(2026, 6, 14), leadTimeDays: 21, themes: ["bastille day", "france", "eiffel tower", "french flag", "paris"] },
  { id: "jul-3", name: "Hari Nelson Mandela", country: "ZA", countryName: "Afrika Selatan", category: "nasional", startDate: new Date(2026, 6, 18), leadTimeDays: 14, themes: ["mandela", "peace", "south africa", "freedom equality", "ubuntu"] },

  // ── AGUSTUS ──
  { id: "aug-1", name: "Back to School", country: "GLOBAL", countryName: "Global", category: "komersial", startDate: new Date(2026, 7, 1), endDate: new Date(2026, 7, 31), leadTimeDays: 60, themes: ["school supplies", "students", "education", "pencil", "notebook", "backpack"] },
  { id: "aug-2", name: "Obon Festival", country: "JP", countryName: "Jepang", category: "religi", startDate: new Date(2026, 7, 13), endDate: new Date(2026, 7, 15), leadTimeDays: 30, themes: ["obon", "japan festival", "lantern floating", "japanese culture", "bon odori"] },
  { id: "aug-3", name: "Hari Kemerdekaan RI", country: "ID", countryName: "Indonesia", category: "nasional", startDate: new Date(2026, 7, 17), leadTimeDays: 45, themes: ["merah putih", "garuda", "batik", "17 agustus", "indonesia merdeka"] },
  { id: "aug-4", name: "Hari Fotografi Dunia", country: "GLOBAL", countryName: "Global", category: "komersial", startDate: new Date(2026, 7, 19), leadTimeDays: 14, themes: ["photography", "camera", "photographer", "lens", "photo art"] },
  { id: "aug-5", name: "Hari Kemerdekaan India", country: "IN", countryName: "India", category: "nasional", startDate: new Date(2026, 7, 15), leadTimeDays: 21, themes: ["india independence", "flag india", "tricolor", "freedom india"] },

  // ── SEPTEMBER ──
  { id: "sep-1", name: "Oktoberfest", country: "DE", countryName: "Jerman", category: "komersial", startDate: new Date(2026, 8, 19), endDate: new Date(2026, 9, 4), leadTimeDays: 30, themes: ["oktoberfest", "beer festival", "germany", "bavarian", "pretzel", "lederhosen"] },
  { id: "sep-2", name: "Hari Nasional Arab Saudi", country: "SA", countryName: "Arab Saudi", category: "nasional", startDate: new Date(2026, 8, 23), leadTimeDays: 21, themes: ["saudi national day", "saudi arabia", "green flag", "arabic", "desert"] },
  { id: "sep-3", name: "Musim Gugur (Autumn)", country: "GLOBAL", countryName: "Belahan Bumi Utara", category: "musim", startDate: new Date(2026, 8, 22), endDate: new Date(2026, 11, 21), leadTimeDays: 21, themes: ["autumn", "fall leaves", "pumpkin", "harvest", "maple leaf", "orange foliage"] },

  // ── OKTOBER ──
  { id: "oct-1", name: "Festival Kue Bulan", country: "CN", countryName: "China & Asia Timur", category: "religi", startDate: new Date(2026, 9, 1), leadTimeDays: 30, themes: ["mid-autumn festival", "mooncake", "lantern", "full moon", "chinese festival"] },
  { id: "oct-2", name: "Hari Batik Nasional", country: "ID", countryName: "Indonesia", category: "nasional", startDate: new Date(2026, 9, 2), leadTimeDays: 21, themes: ["batik", "indonesia culture", "fabric pattern", "javanese art", "wastra"] },
  { id: "oct-3", name: "Hari Kesehatan Mental Sedunia", country: "GLOBAL", countryName: "Global", category: "komersial", startDate: new Date(2026, 9, 10), leadTimeDays: 14, themes: ["mental health", "mindfulness", "wellness", "self care", "calm"] },
  { id: "oct-4", name: "Diwali", country: "IN", countryName: "India & Global", category: "religi", startDate: new Date(2026, 9, 20), leadTimeDays: 60, themes: ["diwali", "diya lamp", "rangoli", "festival of lights", "fireworks india"] },
  { id: "oct-5", name: "Halloween", country: "US", countryName: "Amerika & Global", category: "komersial", startDate: new Date(2026, 9, 31), leadTimeDays: 45, themes: ["halloween", "pumpkin", "spooky", "witch", "ghost", "jack-o-lantern"] },

  // ── NOVEMBER ──
  { id: "nov-1", name: "Día de los Muertos", country: "MX", countryName: "Meksiko", category: "religi", startDate: new Date(2026, 10, 1), endDate: new Date(2026, 10, 2), leadTimeDays: 30, themes: ["dia de los muertos", "sugar skull", "marigold", "mexico", "day of dead"] },
  { id: "nov-2", name: "Hari Pahlawan Indonesia", country: "ID", countryName: "Indonesia", category: "nasional", startDate: new Date(2026, 10, 10), leadTimeDays: 21, themes: ["hari pahlawan", "hero", "indonesia perjuangan", "merah putih", "veteran"] },
  { id: "nov-3", name: "Singles Day 11.11", country: "CN", countryName: "China & Global", category: "komersial", startDate: new Date(2026, 10, 11), leadTimeDays: 21, themes: ["11.11", "singles day", "shopping sale", "discount", "online shopping"] },
  { id: "nov-4", name: "Thanksgiving", country: "US", countryName: "Amerika Serikat", category: "komersial", startDate: new Date(2026, 10, 26), leadTimeDays: 30, themes: ["thanksgiving", "turkey", "harvest", "family dinner", "pumpkin pie", "autumn"] },
  { id: "nov-5", name: "Black Friday", country: "GLOBAL", countryName: "Global", category: "komersial", startDate: new Date(2026, 10, 27), leadTimeDays: 21, themes: ["black friday", "sale", "shopping", "discount", "retail", "deal"] },

  // ── DESEMBER ──
  { id: "dec-1", name: "Hari Nasional UAE", country: "AE", countryName: "Uni Emirat Arab", category: "nasional", startDate: new Date(2026, 11, 2), leadTimeDays: 21, themes: ["uae national day", "dubai", "abu dhabi", "emirates flag", "falcon"] },
  { id: "dec-2", name: "Hanukkah", country: "GLOBAL", countryName: "Global (Yahudi)", category: "religi", startDate: new Date(2026, 11, 4), endDate: new Date(2026, 11, 12), leadTimeDays: 30, themes: ["hanukkah", "menorah", "dreidel", "jewish holiday", "candle light"] },
  { id: "dec-3", name: "Winter Season", country: "GLOBAL", countryName: "Belahan Bumi Utara", category: "musim", startDate: new Date(2026, 11, 21), endDate: new Date(2027, 2, 20), leadTimeDays: 30, themes: ["winter", "snow", "snowflake", "cozy", "cold", "frost"] },
  { id: "dec-4", name: "Christmas", country: "GLOBAL", countryName: "Global", category: "komersial", startDate: new Date(2026, 11, 25), leadTimeDays: 90, themes: ["christmas tree", "santa claus", "snowflake", "winter decoration", "gift", "reindeer"] },
  { id: "dec-5", name: "Malam Tahun Baru", country: "GLOBAL", countryName: "Global", category: "komersial", startDate: new Date(2026, 11, 31), leadTimeDays: 21, themes: ["new year eve", "countdown", "fireworks", "celebration", "party", "champagne"] },
];

// Region group mapping
const regionGroups: Record<string, string[]> = {
  EU: ["FR", "DE", "GB", "IE", "IT", "NL", "ES"],
  CN: ["CN", "JP", "KR", "TW"],
  MENA: ["MENA", "SA", "AE", "EG", "TR"],
  LATAM: ["MX", "BR", "AR", "CL", "CO"],
  AU: ["AU", "NZ"],
};

const categoryColors: Record<string, string> = {
  religi: "bg-green-100 text-green-800 border-green-200",
  nasional: "bg-red-100 text-red-800 border-red-200",
  komersial: "bg-blue-100 text-blue-800 border-blue-200",
  musim: "bg-orange-100 text-orange-800 border-orange-200",
};

const filterCountryItems = {
  all: "Semua Negara",
  GLOBAL: "Global",
  ID: "Indonesia",
  US: "Amerika Serikat",
  EU: "Eropa",
  CN: "China & Asia Timur",
  IN: "India",
  MENA: "Timur Tengah",
  LATAM: "Amerika Latin",
  AU: "Australia & NZ",
  JP: "Jepang",
  ZA: "Afrika",
};

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [detailPage, setDetailPage] = useState(0);

  function handleSelectDate(date: Date | undefined) {
    setSelectedDate(date);
    setDetailPage(0);
  }

  const today = new Date();

  function matchesCountry(eventCountry: string, filter: string): boolean {
    if (filter === "all") return true;
    if (eventCountry === "GLOBAL") return true;
    if (eventCountry === filter) return true;
    const group = regionGroups[filter];
    return group ? group.includes(eventCountry) : false;
  }

  const upcomingEvents = seasonalEvents
    .filter((e) => {
      const afterToday = e.startDate >= today || (e.endDate && e.endDate >= today);
      const matchCountry = matchesCountry(e.country, filterCountry);
      const matchCategory = filterCategory === "all" || e.category === filterCategory;
      return afterToday && matchCountry && matchCategory;
    })
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const byCategory = (cat: string) =>
    seasonalEvents.filter((e) => e.category === cat).map((e) => e.startDate);

  const modifiers = {
    eventReligi: byCategory("religi"),
    eventNasional: byCategory("nasional"),
    eventKomersial: byCategory("komersial"),
    eventMusim: byCategory("musim"),
  };

  const selectedDayEvents = selectedDate
    ? seasonalEvents.filter((e) => {
        const onStart = isSameDay(selectedDate, e.startDate);
        const inRange = e.endDate
          ? isWithinInterval(selectedDate, { start: e.startDate, end: e.endDate })
          : false;
        return onStart || inRange;
      })
    : [];

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Kalender Musiman"
        description={`Kalender event global & perencanaan konten aset musiman · ${seasonalEvents.length} event`}
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select
            value={filterCountry}
            onValueChange={(v) => v && setFilterCountry(v)}
            items={filterCountryItems}
          >
            <SelectTrigger className="w-48">
              <Globe className="h-4 w-4 mr-2 shrink-0" />
              <SelectValue placeholder="Negara/Region" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(filterCountryItems).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterCategory}
            onValueChange={(v) => v && setFilterCategory(v)}
            items={{ all: "Semua Kategori", religi: "Religi", nasional: "Nasional", komersial: "Komersial", musim: "Musim" }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="religi">Religi</SelectItem>
              <SelectItem value="nasional">Nasional</SelectItem>
              <SelectItem value="komersial">Komersial</SelectItem>
              <SelectItem value="musim">Musim</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Calendar + Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Kalender</CardTitle>
              <CardDescription>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                  {[
                    { label: "Religi", color: "bg-green-400" },
                    { label: "Nasional", color: "bg-red-400" },
                    { label: "Komersial", color: "bg-blue-400" },
                    { label: "Musim", color: "bg-orange-400" },
                  ].map((l) => (
                    <span key={l.label} className="inline-flex items-center gap-1.5 text-xs">
                      <span className={`w-2 h-2 rounded-full ${l.color} inline-block`} />
                      {l.label}
                    </span>
                  ))}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleSelectDate}
                className="w-full border-0 p-0 [--cell-size:--spacing(10)]"
                classNames={{ root: "w-full" }}
                modifiers={modifiers}
                modifiersClassNames={{
                  eventReligi: "!bg-green-200 !text-green-900 font-bold",
                  eventNasional: "!bg-red-200 !text-red-900 font-bold",
                  eventKomersial: "!bg-blue-200 !text-blue-900 font-bold",
                  eventMusim: "!bg-orange-200 !text-orange-900 font-bold",
                }}
              />
            </CardContent>
          </Card>

          {/* Detail Hari Dipilih */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Detail Hari Dipilih
                  </CardTitle>
                  <CardDescription>
                    {selectedDate
                      ? format(selectedDate, "EEEE, d MMMM yyyy", { locale: idLocale })
                      : "Pilih tanggal di kalender"}
                  </CardDescription>
                </div>
                {selectedDayEvents.length > 2 && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={detailPage === 0}
                      onClick={() => setDetailPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground px-1 tabular-nums">
                      {detailPage + 1}/{Math.ceil(selectedDayEvents.length / 2)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={detailPage >= Math.ceil(selectedDayEvents.length / 2) - 1}
                      onClick={() => setDetailPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <CalendarDays className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm">Pilih tanggal pada kalender di sebelah kiri</p>
                </div>
              ) : selectedDayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <CalendarDays className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm font-medium">Tidak ada event pada tanggal ini</p>
                  <p className="text-xs mt-1">Coba pilih tanggal yang ditandai pada kalender.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.slice(detailPage * 2, detailPage * 2 + 2).map((event) => {
                    const daysLeft = Math.ceil((event.startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    const deadline = addDays(event.startDate, -event.leadTimeDays);
                    return (
                      <div key={event.id} className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold">{event.name}</h3>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              <Badge variant="outline" className={`text-xs border ${categoryColors[event.category]}`}>
                                {event.category}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">{event.countryName}</Badge>
                            </div>
                          </div>
                          {daysLeft > 0 && (
                            <div className="text-right shrink-0">
                              <div className="text-2xl font-bold text-primary">{daysLeft}</div>
                              <div className="text-xs text-muted-foreground">hari lagi</div>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            Tanggal: {format(event.startDate, "d MMMM yyyy", { locale: idLocale })}
                            {event.endDate && ` – ${format(event.endDate, "d MMMM yyyy", { locale: idLocale })}`}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            Ideal mulai produksi: {format(deadline, "d MMMM yyyy", { locale: idLocale })}
                            <span className="text-foreground font-medium">({event.leadTimeDays}h sebelum)</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Tema Rekomendasi</p>
                          <div className="flex flex-wrap gap-1">
                            {event.themes.map((t) => (
                              <Badge key={t} variant="outline" className="text-xs font-normal">{t}</Badge>
                            ))}
                          </div>
                        </div>
                        <Link
                          href={`/prompt?themes=${encodeURIComponent(event.themes.join(","))}&keyword=${encodeURIComponent(event.name)}`}
                          className={cn(buttonVariants({ size: "sm" }), "w-full")}
                        >
                          <Wand2 className="h-4 w-4 mr-2" />
                          Buat Prompt untuk {event.name}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Event Mendatang */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event Mendatang</CardTitle>
            <CardDescription>
              Urut berdasarkan event terdekat · {upcomingEvents.length} event
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              <div className="divide-y">
                {upcomingEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Tidak ada event mendatang sesuai filter.
                  </p>
                )}
                {upcomingEvents.map((event) => {
                  const daysLeft = Math.ceil((event.startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={event.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{event.name}</span>
                          <Badge variant="outline" className={`text-xs py-0 h-4 border ${categoryColors[event.category]}`}>
                            {event.category}
                          </Badge>
                          <Badge variant="secondary" className="text-xs py-0 h-4">{event.countryName}</Badge>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(event.startDate, "d MMM yyyy")}
                          {event.endDate && ` – ${format(event.endDate, "d MMM yyyy")}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className={`text-lg font-bold ${daysLeft <= 14 ? "text-orange-600" : daysLeft <= 30 ? "text-yellow-600" : ""}`}>
                            {daysLeft}
                          </div>
                          <div className="text-xs text-muted-foreground">hari lagi</div>
                        </div>
                        <Link
                          href={`/prompt?themes=${encodeURIComponent(event.themes.join(","))}&keyword=${encodeURIComponent(event.name)}`}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-xs")}
                        >
                          <Wand2 className="h-3 w-3 mr-1" />Prompt
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
