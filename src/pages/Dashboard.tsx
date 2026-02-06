import { useState, useEffect, useMemo } from 'react';
import type { Werkzeuge, Werkzeugausgabe, Werkzeugrueckgabe, Mitarbeiter, Lagerorte } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, parseISO, formatDistance, differenceInDays, isAfter, isBefore, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Wrench,
  AlertCircle,
  Clock,
  MapPin,
  Users,
  Settings,
  Plus,
  ArrowRight,
  CalendarDays,
  Package,
  RefreshCw,
} from 'lucide-react';

// Types for enriched data
interface EnrichedCheckout extends Werkzeugausgabe {
  werkzeugData?: Werkzeuge;
  mitarbeiterData?: Mitarbeiter;
  isOverdue: boolean;
  isDueToday: boolean;
  daysOverdue: number;
}

interface RecentActivity {
  type: 'checkout' | 'return';
  werkzeugName: string;
  mitarbeiterName: string;
  date: string;
  timestamp: Date;
}

// Loading skeleton component
function LoadingState() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Hero skeleton */}
        <Skeleton className="h-32 w-full rounded-2xl" />

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Error state component
function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Fehler beim Laden</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-4">{error.message}</p>
          <Button variant="outline" onClick={onRetry} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut versuchen
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Empty state component
function EmptyState({ onAddFirst }: { onAddFirst: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Package className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Keine Ausleihen vorhanden</h3>
      <p className="text-muted-foreground mb-4 max-w-sm">
        Beginnen Sie damit, Werkzeuge an Mitarbeiter auszugeben.
      </p>
      <Button onClick={onAddFirst}>
        <Plus className="h-4 w-4 mr-2" />
        Werkzeug ausgeben
      </Button>
    </div>
  );
}

// Checkout form component
function CheckoutForm({
  werkzeuge,
  mitarbeiter,
  activeCheckoutToolIds,
  onSubmit,
  onCancel,
  submitting,
}: {
  werkzeuge: Werkzeuge[];
  mitarbeiter: Mitarbeiter[];
  activeCheckoutToolIds: Set<string>;
  onSubmit: (data: {
    werkzeug: string;
    mitarbeiter: string;
    geplantes_rueckgabedatum: string;
    verwendungszweck?: string;
  }) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [selectedWerkzeug, setSelectedWerkzeug] = useState('');
  const [selectedMitarbeiter, setSelectedMitarbeiter] = useState('');
  const [rueckgabedatum, setRueckgabedatum] = useState('');
  const [verwendungszweck, setVerwendungszweck] = useState('');

  // Filter to only show available tools (not currently checked out)
  const availableWerkzeuge = werkzeuge.filter(
    (w) => !activeCheckoutToolIds.has(w.record_id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWerkzeug || !selectedMitarbeiter || !rueckgabedatum) return;

    onSubmit({
      werkzeug: selectedWerkzeug,
      mitarbeiter: selectedMitarbeiter,
      geplantes_rueckgabedatum: rueckgabedatum,
      verwendungszweck: verwendungszweck || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="werkzeug">Werkzeug *</Label>
        <Select value={selectedWerkzeug} onValueChange={setSelectedWerkzeug}>
          <SelectTrigger>
            <SelectValue placeholder="Werkzeug auswählen..." />
          </SelectTrigger>
          <SelectContent>
            {availableWerkzeuge.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">
                Keine Werkzeuge verfügbar
              </div>
            ) : (
              availableWerkzeuge.map((w) => (
                <SelectItem key={w.record_id} value={w.record_id}>
                  {w.fields.werkzeugname || 'Unbenannt'}{' '}
                  {w.fields.hersteller && `(${w.fields.hersteller})`}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mitarbeiter">Mitarbeiter *</Label>
        <Select value={selectedMitarbeiter} onValueChange={setSelectedMitarbeiter}>
          <SelectTrigger>
            <SelectValue placeholder="Mitarbeiter auswählen..." />
          </SelectTrigger>
          <SelectContent>
            {mitarbeiter.map((m) => (
              <SelectItem key={m.record_id} value={m.record_id}>
                {m.fields.vorname} {m.fields.nachname}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rueckgabedatum">Geplantes Rückgabedatum *</Label>
        <Input
          type="date"
          id="rueckgabedatum"
          value={rueckgabedatum}
          onChange={(e) => setRueckgabedatum(e.target.value)}
          min={format(new Date(), 'yyyy-MM-dd')}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="verwendungszweck">Verwendungszweck</Label>
        <Textarea
          id="verwendungszweck"
          value={verwendungszweck}
          onChange={(e) => setVerwendungszweck(e.target.value)}
          placeholder="Optional: Wofür wird das Werkzeug benötigt?"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={submitting}
        >
          Abbrechen
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={!selectedWerkzeug || !selectedMitarbeiter || !rueckgabedatum || submitting}
        >
          {submitting ? 'Wird gespeichert...' : 'Ausgeben'}
        </Button>
      </div>
    </form>
  );
}

// Return form component
function ReturnForm({
  checkout,
  onSubmit,
  onCancel,
  submitting,
}: {
  checkout: EnrichedCheckout;
  onSubmit: (data: {
    werkzeugausgabe: string;
    zustand_bei_rueckgabe: string;
    beschaedigungen?: string;
  }) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [zustand, setZustand] = useState('wie_ausgegeben');
  const [beschaedigungen, setBeschaedigungen] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      werkzeugausgabe: checkout.record_id,
      zustand_bei_rueckgabe: zustand,
      beschaedigungen: beschaedigungen || undefined,
    });
  };

  const zustandOptions = [
    { key: 'wie_ausgegeben', label: 'Wie ausgegeben' },
    { key: 'leichte_gebrauchsspuren', label: 'Leichte Gebrauchsspuren' },
    { key: 'starke_gebrauchsspuren', label: 'Starke Gebrauchsspuren' },
    { key: 'beschaedigt', label: 'Beschädigt' },
    { key: 'defekt', label: 'Defekt' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-muted rounded-lg mb-4">
        <p className="font-medium">
          {checkout.werkzeugData?.fields.werkzeugname || 'Unbekanntes Werkzeug'}
        </p>
        <p className="text-sm text-muted-foreground">
          Ausgeliehen an: {checkout.mitarbeiterData?.fields.vorname}{' '}
          {checkout.mitarbeiterData?.fields.nachname}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="zustand">Zustand bei Rückgabe *</Label>
        <Select value={zustand} onValueChange={setZustand}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {zustandOptions.map((opt) => (
              <SelectItem key={opt.key} value={opt.key}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(zustand === 'beschaedigt' || zustand === 'defekt') && (
        <div className="space-y-2">
          <Label htmlFor="beschaedigungen">Beschädigungen beschreiben</Label>
          <Textarea
            id="beschaedigungen"
            value={beschaedigungen}
            onChange={(e) => setBeschaedigungen(e.target.value)}
            placeholder="Beschreiben Sie die Schäden..."
            rows={3}
          />
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={submitting}
        >
          Abbrechen
        </Button>
        <Button type="submit" className="flex-1" disabled={submitting}>
          {submitting ? 'Wird gespeichert...' : 'Rückgabe bestätigen'}
        </Button>
      </div>
    </form>
  );
}

// Main Dashboard component
export default function Dashboard() {
  // Data states
  const [werkzeuge, setWerkzeuge] = useState<Werkzeuge[]>([]);
  const [ausgaben, setAusgaben] = useState<Werkzeugausgabe[]>([]);
  const [rueckgaben, setRueckgaben] = useState<Werkzeugrueckgabe[]>([]);
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([]);
  const [lagerorte, setLagerorte] = useState<Lagerorte[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [selectedCheckout, setSelectedCheckout] = useState<EnrichedCheckout | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [w, a, r, m, l] = await Promise.all([
        LivingAppsService.getWerkzeuge(),
        LivingAppsService.getWerkzeugausgabe(),
        LivingAppsService.getWerkzeugrueckgabe(),
        LivingAppsService.getMitarbeiter(),
        LivingAppsService.getLagerorte(),
      ]);
      setWerkzeuge(w);
      setAusgaben(a);
      setRueckgaben(r);
      setMitarbeiter(m);
      setLagerorte(l);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Refresh data without full loading state
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Create lookup maps
  const werkzeugeMap = useMemo(() => {
    const map = new Map<string, Werkzeuge>();
    werkzeuge.forEach((w) => map.set(w.record_id, w));
    return map;
  }, [werkzeuge]);

  const mitarbeiterMap = useMemo(() => {
    const map = new Map<string, Mitarbeiter>();
    mitarbeiter.forEach((m) => map.set(m.record_id, m));
    return map;
  }, [mitarbeiter]);

  // Get IDs of returned checkouts
  const returnedCheckoutIds = useMemo(() => {
    const ids = new Set<string>();
    rueckgaben.forEach((r) => {
      const checkoutId = extractRecordId(r.fields.werkzeugausgabe);
      if (checkoutId) ids.add(checkoutId);
    });
    return ids;
  }, [rueckgaben]);

  // Get active checkouts (not returned)
  const activeCheckouts = useMemo<EnrichedCheckout[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return ausgaben
      .filter((a) => !returnedCheckoutIds.has(a.record_id))
      .map((a) => {
        const werkzeugId = extractRecordId(a.fields.werkzeug);
        const mitarbeiterId = extractRecordId(a.fields.mitarbeiter);

        const plannedReturn = a.fields.geplantes_rueckgabedatum
          ? parseISO(a.fields.geplantes_rueckgabedatum)
          : null;

        const isOverdue = plannedReturn ? isBefore(plannedReturn, today) : false;
        const isDueToday = plannedReturn ? isToday(plannedReturn) : false;
        const daysOverdue = plannedReturn && isOverdue ? differenceInDays(today, plannedReturn) : 0;

        return {
          ...a,
          werkzeugData: werkzeugId ? werkzeugeMap.get(werkzeugId) : undefined,
          mitarbeiterData: mitarbeiterId ? mitarbeiterMap.get(mitarbeiterId) : undefined,
          isOverdue,
          isDueToday,
          daysOverdue,
        };
      })
      .sort((a, b) => {
        // Sort: overdue first, then due today, then by planned return date
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (a.isDueToday && !b.isDueToday) return -1;
        if (!a.isDueToday && b.isDueToday) return 1;

        const dateA = a.fields.geplantes_rueckgabedatum || '';
        const dateB = b.fields.geplantes_rueckgabedatum || '';
        return dateA.localeCompare(dateB);
      });
  }, [ausgaben, returnedCheckoutIds, werkzeugeMap, mitarbeiterMap]);

  // IDs of currently checked-out tools
  const activeCheckoutToolIds = useMemo(() => {
    const ids = new Set<string>();
    activeCheckouts.forEach((c) => {
      const toolId = extractRecordId(c.fields.werkzeug);
      if (toolId) ids.add(toolId);
    });
    return ids;
  }, [activeCheckouts]);

  // Overdue and due-today counts
  const overdueCheckouts = useMemo(
    () => activeCheckouts.filter((c) => c.isOverdue),
    [activeCheckouts]
  );
  const dueTodayCheckouts = useMemo(
    () => activeCheckouts.filter((c) => c.isDueToday),
    [activeCheckouts]
  );

  // Tools needing maintenance
  const toolsNeedingMaintenance = useMemo(() => {
    const today = new Date();
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    return werkzeuge
      .filter((w) => {
        if (!w.fields.naechste_wartung) return false;
        const maintenanceDate = parseISO(w.fields.naechste_wartung);
        return isBefore(maintenanceDate, twoWeeksFromNow);
      })
      .sort((a, b) => {
        const dateA = a.fields.naechste_wartung || '';
        const dateB = b.fields.naechste_wartung || '';
        return dateA.localeCompare(dateB);
      });
  }, [werkzeuge]);

  // Tool conditions breakdown
  const conditionBreakdown = useMemo(() => {
    const counts: Record<string, number> = {
      neu: 0,
      sehr_gut: 0,
      gut: 0,
      befriedigend: 0,
      ausreichend: 0,
      defekt: 0,
    };
    werkzeuge.forEach((w) => {
      const condition = w.fields.zustand || 'gut';
      if (condition in counts) {
        counts[condition]++;
      }
    });
    return counts;
  }, [werkzeuge]);

  // Recent activity
  const recentActivity = useMemo<RecentActivity[]>(() => {
    const activities: RecentActivity[] = [];

    // Add checkouts
    ausgaben.forEach((a) => {
      const werkzeugId = extractRecordId(a.fields.werkzeug);
      const mitarbeiterId = extractRecordId(a.fields.mitarbeiter);
      const werkzeugData = werkzeugId ? werkzeugeMap.get(werkzeugId) : null;
      const mitarbeiterData = mitarbeiterId ? mitarbeiterMap.get(mitarbeiterId) : null;

      activities.push({
        type: 'checkout',
        werkzeugName: werkzeugData?.fields.werkzeugname || 'Unbekannt',
        mitarbeiterName: mitarbeiterData
          ? `${mitarbeiterData.fields.vorname?.charAt(0)}. ${mitarbeiterData.fields.nachname}`
          : 'Unbekannt',
        date: a.createdat,
        timestamp: parseISO(a.createdat),
      });
    });

    // Add returns
    rueckgaben.forEach((r) => {
      const checkoutId = extractRecordId(r.fields.werkzeugausgabe);
      const checkout = checkoutId ? ausgaben.find((a) => a.record_id === checkoutId) : null;

      if (checkout) {
        const werkzeugId = extractRecordId(checkout.fields.werkzeug);
        const mitarbeiterId = extractRecordId(checkout.fields.mitarbeiter);
        const werkzeugData = werkzeugId ? werkzeugeMap.get(werkzeugId) : null;
        const mitarbeiterData = mitarbeiterId ? mitarbeiterMap.get(mitarbeiterId) : null;

        activities.push({
          type: 'return',
          werkzeugName: werkzeugData?.fields.werkzeugname || 'Unbekannt',
          mitarbeiterName: mitarbeiterData
            ? `${mitarbeiterData.fields.vorname?.charAt(0)}. ${mitarbeiterData.fields.nachname}`
            : 'Unbekannt',
          date: r.createdat,
          timestamp: parseISO(r.createdat),
        });
      }
    });

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
  }, [ausgaben, rueckgaben, werkzeugeMap, mitarbeiterMap]);

  // Tools per location
  const toolsPerLocation = useMemo(() => {
    const counts = new Map<string, number>();
    werkzeuge.forEach((w) => {
      const locationId = extractRecordId(w.fields.aktueller_lagerort);
      if (locationId) {
        counts.set(locationId, (counts.get(locationId) || 0) + 1);
      }
    });
    return counts;
  }, [werkzeuge]);

  // Handle checkout submission
  const handleCheckoutSubmit = async (data: {
    werkzeug: string;
    mitarbeiter: string;
    geplantes_rueckgabedatum: string;
    verwendungszweck?: string;
  }) => {
    try {
      setSubmitting(true);
      const now = new Date();
      const ausgabedatum = format(now, "yyyy-MM-dd'T'HH:mm");

      await LivingAppsService.createWerkzeugausgabeEntry({
        werkzeug: createRecordUrl(APP_IDS.WERKZEUGE, data.werkzeug),
        mitarbeiter: createRecordUrl(APP_IDS.MITARBEITER, data.mitarbeiter),
        ausgabedatum,
        geplantes_rueckgabedatum: data.geplantes_rueckgabedatum,
        verwendungszweck: data.verwendungszweck,
      });

      setCheckoutDialogOpen(false);
      await fetchData();
    } catch (err) {
      console.error('Checkout failed:', err);
      alert('Fehler beim Erstellen der Ausgabe. Bitte versuchen Sie es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle return submission
  const handleReturnSubmit = async (data: {
    werkzeugausgabe: string;
    zustand_bei_rueckgabe: string;
    beschaedigungen?: string;
  }) => {
    try {
      setSubmitting(true);
      const now = new Date();
      const rueckgabedatum = format(now, "yyyy-MM-dd'T'HH:mm");

      await LivingAppsService.createWerkzeugrueckgabeEntry({
        werkzeugausgabe: createRecordUrl(APP_IDS.WERKZEUGAUSGABE, data.werkzeugausgabe),
        rueckgabedatum,
        zustand_bei_rueckgabe: data.zustand_bei_rueckgabe as Werkzeugrueckgabe['fields']['zustand_bei_rueckgabe'],
        beschaedigungen: data.beschaedigungen,
      });

      setSelectedCheckout(null);
      await fetchData();
    } catch (err) {
      console.error('Return failed:', err);
      alert('Fehler beim Erstellen der Rückgabe. Bitte versuchen Sie es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  // Get initials for employee badge
  const getInitials = (mitarbeiterData?: Mitarbeiter) => {
    if (!mitarbeiterData) return '??';
    const first = mitarbeiterData.fields.vorname?.charAt(0) || '';
    const last = mitarbeiterData.fields.nachname?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  // Loading state
  if (loading) return <LoadingState />;

  // Error state
  if (error) return <ErrorState error={error} onRetry={fetchData} />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Desktop */}
      <header className="hidden md:flex items-center justify-between px-6 py-4 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Werkzeugverwaltung</h1>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Aktualisiert: {format(lastUpdated, 'HH:mm', { locale: de })} Uhr
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
          <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Werkzeug ausgeben
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Werkzeug ausgeben</DialogTitle>
              </DialogHeader>
              <CheckoutForm
                werkzeuge={werkzeuge}
                mitarbeiter={mitarbeiter}
                activeCheckoutToolIds={activeCheckoutToolIds}
                onSubmit={handleCheckoutSubmit}
                onCancel={() => setCheckoutDialogOpen(false)}
                submitting={submitting}
              />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Header - Mobile */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <h1 className="text-lg font-semibold">Werkzeuge</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 w-8"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Badge variant="secondary" className="text-xs">
            {werkzeuge.length} Werkzeuge
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6 pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Layout: 65/35 split */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            {/* Left Column - Main Content */}
            <div className="space-y-6">
              {/* Hero Card */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-col items-center md:items-start">
                      <span
                        className="text-7xl font-bold tabular-nums"
                        style={{ color: 'hsl(38 92% 50%)' }}
                      >
                        {activeCheckouts.length}
                      </span>
                      <span className="text-muted-foreground text-sm mt-1">
                        Werkzeuge ausgeliehen
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-center md:justify-end gap-3">
                      {overdueCheckouts.length > 0 && (
                        <Badge variant="destructive" className="gap-1.5 py-1.5 px-3">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {overdueCheckouts.length} überfällig
                        </Badge>
                      )}
                      {dueTodayCheckouts.length > 0 && (
                        <Badge
                          className="gap-1.5 py-1.5 px-3"
                          style={{
                            backgroundColor: 'hsl(38 92% 95%)',
                            color: 'hsl(38 92% 35%)',
                          }}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {dueTodayCheckouts.length} heute fällig
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Overdue Section */}
              {overdueCheckouts.length > 0 && (
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-destructive text-base">
                      <AlertCircle className="h-4 w-4" />
                      Überfällige Rückgaben
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {overdueCheckouts.slice(0, 3).map((checkout) => (
                        <div
                          key={checkout.record_id}
                          className="flex items-center justify-between p-3 bg-card rounded-lg cursor-pointer hover:shadow-sm transition-shadow"
                          onClick={() => setSelectedCheckout(checkout)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium"
                              style={{
                                backgroundColor: 'hsl(38 92% 95%)',
                                color: 'hsl(38 92% 35%)',
                              }}
                            >
                              {getInitials(checkout.mitarbeiterData)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {checkout.werkzeugData?.fields.werkzeugname || 'Unbekannt'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {checkout.mitarbeiterData?.fields.vorname}{' '}
                                {checkout.mitarbeiterData?.fields.nachname}
                              </p>
                            </div>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            {checkout.daysOverdue} {checkout.daysOverdue === 1 ? 'Tag' : 'Tage'}
                          </Badge>
                        </div>
                      ))}
                      {overdueCheckouts.length > 3 && (
                        <p className="text-sm text-muted-foreground text-center pt-2">
                          +{overdueCheckouts.length - 3} weitere überfällige Ausleihen
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Active Checkouts List */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Ausgeliehen
                      <Badge variant="secondary" className="ml-1">
                        {activeCheckouts.length}
                      </Badge>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {activeCheckouts.length === 0 ? (
                    <EmptyState onAddFirst={() => setCheckoutDialogOpen(true)} />
                  ) : (
                    <>
                      {/* Mobile: Card list */}
                      <div className="md:hidden space-y-3">
                        {activeCheckouts.map((checkout) => (
                          <div
                            key={checkout.record_id}
                            className="p-4 rounded-xl border border-border bg-card cursor-pointer hover:shadow-sm transition-shadow"
                            onClick={() => setSelectedCheckout(checkout)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                                  style={{
                                    backgroundColor: 'hsl(38 92% 95%)',
                                    color: 'hsl(38 92% 35%)',
                                  }}
                                >
                                  {getInitials(checkout.mitarbeiterData)}
                                </div>
                                <div>
                                  <p className="font-semibold">
                                    {checkout.werkzeugData?.fields.werkzeugname || 'Unbekannt'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {checkout.mitarbeiterData?.fields.vorname}{' '}
                                    {checkout.mitarbeiterData?.fields.nachname}
                                  </p>
                                </div>
                              </div>
                              {checkout.isOverdue ? (
                                <Badge variant="destructive" className="text-xs">
                                  Überfällig
                                </Badge>
                              ) : checkout.isDueToday ? (
                                <Badge
                                  className="text-xs"
                                  style={{
                                    backgroundColor: 'hsl(38 92% 95%)',
                                    color: 'hsl(38 92% 35%)',
                                  }}
                                >
                                  Heute
                                </Badge>
                              ) : (
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: 'hsl(142 71% 45%)' }}
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {checkout.fields.ausgabedatum
                                  ? format(
                                      parseISO(checkout.fields.ausgabedatum),
                                      'dd.MM.yyyy',
                                      { locale: de }
                                    )
                                  : '-'}
                              </span>
                              <ArrowRight className="h-3 w-3" />
                              <span>
                                {checkout.fields.geplantes_rueckgabedatum
                                  ? format(
                                      parseISO(checkout.fields.geplantes_rueckgabedatum),
                                      'dd.MM.yyyy',
                                      { locale: de }
                                    )
                                  : '-'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop: Table */}
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Werkzeug</TableHead>
                              <TableHead>Mitarbeiter</TableHead>
                              <TableHead>Ausgabedatum</TableHead>
                              <TableHead>Rückgabe bis</TableHead>
                              <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activeCheckouts.map((checkout) => (
                              <TableRow
                                key={checkout.record_id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => setSelectedCheckout(checkout)}
                              >
                                <TableCell className="font-medium">
                                  {checkout.werkzeugData?.fields.werkzeugname || 'Unbekannt'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                                      style={{
                                        backgroundColor: 'hsl(38 92% 95%)',
                                        color: 'hsl(38 92% 35%)',
                                      }}
                                    >
                                      {getInitials(checkout.mitarbeiterData)}
                                    </div>
                                    <span>
                                      {checkout.mitarbeiterData?.fields.vorname}{' '}
                                      {checkout.mitarbeiterData?.fields.nachname}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {checkout.fields.ausgabedatum
                                    ? format(
                                        parseISO(checkout.fields.ausgabedatum),
                                        'dd.MM.yyyy',
                                        { locale: de }
                                      )
                                    : '-'}
                                </TableCell>
                                <TableCell>
                                  {checkout.fields.geplantes_rueckgabedatum
                                    ? format(
                                        parseISO(checkout.fields.geplantes_rueckgabedatum),
                                        'dd.MM.yyyy',
                                        { locale: de }
                                      )
                                    : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  {checkout.isOverdue ? (
                                    <Badge variant="destructive">Überfällig</Badge>
                                  ) : checkout.isDueToday ? (
                                    <Badge
                                      style={{
                                        backgroundColor: 'hsl(38 92% 95%)',
                                        color: 'hsl(38 92% 35%)',
                                      }}
                                    >
                                      Heute fällig
                                    </Badge>
                                  ) : (
                                    <div className="flex items-center justify-end gap-2">
                                      <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: 'hsl(142 71% 45%)' }}
                                      />
                                      <span className="text-sm text-muted-foreground">OK</span>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Stats Sidebar (Desktop) */}
            <div className="hidden lg:flex flex-col gap-4">
              {/* Tools Overview */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Werkzeuge Übersicht
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-3">{werkzeuge.length}</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 rounded bg-muted">
                      Neu: {conditionBreakdown.neu + conditionBreakdown.sehr_gut}
                    </span>
                    <span className="px-2 py-1 rounded bg-muted">
                      Gut: {conditionBreakdown.gut}
                    </span>
                    <span className="px-2 py-1 rounded bg-muted">
                      Befr.: {conditionBreakdown.befriedigend + conditionBreakdown.ausreichend}
                    </span>
                    <span
                      className="px-2 py-1 rounded"
                      style={{
                        backgroundColor: 'hsl(0 84% 95%)',
                        color: 'hsl(0 84% 40%)',
                      }}
                    >
                      Defekt: {conditionBreakdown.defekt}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance Due */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Wartung fällig
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-3">{toolsNeedingMaintenance.length}</div>
                  {toolsNeedingMaintenance.length > 0 ? (
                    <div className="space-y-2">
                      {toolsNeedingMaintenance.slice(0, 3).map((tool) => (
                        <div
                          key={tool.record_id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="truncate">{tool.fields.werkzeugname}</span>
                          <span className="text-muted-foreground text-xs">
                            {tool.fields.naechste_wartung
                              ? format(parseISO(tool.fields.naechste_wartung), 'dd.MM.', {
                                  locale: de,
                                })
                              : '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Keine Wartungen in den nächsten 2 Wochen
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Storage Locations */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Lagerorte
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-3">{lagerorte.length}</div>
                  <div className="space-y-2">
                    {lagerorte.slice(0, 4).map((loc) => (
                      <div
                        key={loc.record_id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="truncate">{loc.fields.bezeichnung}</span>
                        <Badge variant="secondary" className="text-xs">
                          {toolsPerLocation.get(loc.record_id) || 0}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Aktivität
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {recentActivity.map((activity, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <div
                            className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                              activity.type === 'checkout'
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="truncate">
                              <span className="font-medium">{activity.werkzeugName}</span>
                              <span className="text-muted-foreground">
                                {' → '}
                                {activity.mitarbeiterName}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistance(activity.timestamp, new Date(), {
                                addSuffix: true,
                                locale: de,
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Keine Aktivitäten</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Mobile: Quick Stats Row */}
          <div className="md:hidden mt-6 overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-3" style={{ width: 'max-content' }}>
              <div className="px-4 py-3 rounded-xl bg-card border border-border flex items-center gap-3">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-lg font-semibold">{werkzeuge.length}</p>
                  <p className="text-xs text-muted-foreground">Werkzeuge</p>
                </div>
              </div>
              <div className="px-4 py-3 rounded-xl bg-card border border-border flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-lg font-semibold">{lagerorte.length}</p>
                  <p className="text-xs text-muted-foreground">Lagerorte</p>
                </div>
              </div>
              <div className="px-4 py-3 rounded-xl bg-card border border-border flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-lg font-semibold">{mitarbeiter.length}</p>
                  <p className="text-xs text-muted-foreground">Mitarbeiter</p>
                </div>
              </div>
              {toolsNeedingMaintenance.length > 0 && (
                <div className="px-4 py-3 rounded-xl bg-card border border-border flex items-center gap-3">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-semibold">{toolsNeedingMaintenance.length}</p>
                    <p className="text-xs text-muted-foreground">Wartung fällig</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile: Fixed Bottom Action Button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border shadow-lg">
        <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full h-14 text-base gap-2">
              <Plus className="h-5 w-5" />
              Werkzeug ausgeben
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Werkzeug ausgeben</DialogTitle>
            </DialogHeader>
            <CheckoutForm
              werkzeuge={werkzeuge}
              mitarbeiter={mitarbeiter}
              activeCheckoutToolIds={activeCheckoutToolIds}
              onSubmit={handleCheckoutSubmit}
              onCancel={() => setCheckoutDialogOpen(false)}
              submitting={submitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Detail Sheet for checkout/return */}
      <Sheet open={!!selectedCheckout} onOpenChange={() => setSelectedCheckout(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {selectedCheckout?.werkzeugData?.fields.werkzeugname || 'Werkzeugdetails'}
            </SheetTitle>
          </SheetHeader>

          {selectedCheckout && (
            <div className="mt-6 space-y-6">
              {/* Tool Info */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Hersteller</p>
                  <p className="font-medium">
                    {selectedCheckout.werkzeugData?.fields.hersteller || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modell</p>
                  <p className="font-medium">
                    {selectedCheckout.werkzeugData?.fields.modell || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Seriennummer</p>
                  <p className="font-medium">
                    {selectedCheckout.werkzeugData?.fields.seriennummer || '-'}
                  </p>
                </div>
              </div>

              <hr className="border-border" />

              {/* Checkout Info */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Ausgeliehen an</p>
                  <p className="font-medium">
                    {selectedCheckout.mitarbeiterData?.fields.vorname}{' '}
                    {selectedCheckout.mitarbeiterData?.fields.nachname}
                  </p>
                  {selectedCheckout.mitarbeiterData?.fields.abteilung && (
                    <p className="text-sm text-muted-foreground">
                      {selectedCheckout.mitarbeiterData.fields.abteilung}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ausgabedatum</p>
                  <p className="font-medium">
                    {selectedCheckout.fields.ausgabedatum
                      ? format(
                          parseISO(selectedCheckout.fields.ausgabedatum),
                          'PPP',
                          { locale: de }
                        )
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Geplante Rückgabe</p>
                  <p
                    className={`font-medium ${
                      selectedCheckout.isOverdue ? 'text-destructive' : ''
                    }`}
                  >
                    {selectedCheckout.fields.geplantes_rueckgabedatum
                      ? format(
                          parseISO(selectedCheckout.fields.geplantes_rueckgabedatum),
                          'PPP',
                          { locale: de }
                        )
                      : '-'}
                    {selectedCheckout.isOverdue && (
                      <span className="ml-2 text-sm">
                        ({selectedCheckout.daysOverdue} Tage überfällig)
                      </span>
                    )}
                  </p>
                </div>
                {selectedCheckout.fields.verwendungszweck && (
                  <div>
                    <p className="text-sm text-muted-foreground">Verwendungszweck</p>
                    <p className="font-medium">{selectedCheckout.fields.verwendungszweck}</p>
                  </div>
                )}
              </div>

              <hr className="border-border" />

              {/* Return Form */}
              <div>
                <h3 className="font-semibold mb-4">Werkzeug zurückgeben</h3>
                <ReturnForm
                  checkout={selectedCheckout}
                  onSubmit={handleReturnSubmit}
                  onCancel={() => setSelectedCheckout(null)}
                  submitting={submitting}
                />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
