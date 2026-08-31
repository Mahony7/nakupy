import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useCreateExpense, useDeleteExpense, useGetExpenseStats, useGetExpenseSummary, useGetHouseholdSettings, useListExpenses, useUpdateExpense, useUpdateHouseholdSettings, getGetExpenseStatsQueryKey, getGetExpenseSummaryQueryKey, getGetHouseholdSettingsQueryKey, getListExpensesQueryKey } from '@workspace/api-client-react';
import type { Expense, ExpenseInput, HouseholdSettingsInput, MonthlyExpenseStats } from '@workspace/api-client-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarDays, Check, ChevronLeft, ChevronRight, CircleAlert, LoaderCircle, Pencil, Plus, ReceiptText, Settings, Sparkles, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import NotFound from '@/pages/not-found';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient();

const monthNames = ['január', 'február', 'marec', 'apríl', 'máj', 'jún', 'júl', 'august', 'september', 'október', 'november', 'december'];
const today = new Date();
const initialMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

function money(value = 0) {
  return new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR' }).format(value);
}

function readableDate(date: string) {
  const calendarDate = date.slice(0, 10);
  return new Intl.DateTimeFormat('sk-SK', { day: 'numeric', month: 'short' }).format(new Date(`${calendarDate}T12:00:00`));
}

function monthLabel(month: string) {
  const [year, monthNumber] = month.split('-');
  return `${monthNames[Number(monthNumber) - 1]} ${year}`;
}

function chartCeiling(value: number) {
  if (value <= 0) return 0;
  const roughStep = value / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const step = normalized <= 1 ? magnitude : normalized <= 2 ? 2 * magnitude : normalized <= 5 ? 5 * magnitude : 10 * magnitude;
  return Math.ceil(value / step) * step;
}

function chartMoney(value: number) {
  return `${new Intl.NumberFormat('sk-SK', {
    minimumFractionDigits: value < 10 && value % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: value < 10 && value % 1 !== 0 ? 2 : 0,
  }).format(value)} €`;
}

function localCalendarDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

type FormState = { amount: string; paidBy: 'me' | 'wife'; date: string; note: string };

type HouseholdSettings = {
  myName: string;
  partnerName: string;
  togetherSince: string;
  headline: string;
  description: string;
};

const defaultSettings: HouseholdSettings = {
  myName: 'Ja',
  partnerName: 'Manželka',
  togetherSince: '2024',
  headline: 'Peniaze bez ťažkých slov.',
  description: 'Malý priestor pre naše veľké aj každodenné spoločné rozhodnutia.',
};

const settingsStorageKey = 'spolu-household-settings';

function loadSettings(): HouseholdSettings {
  try {
    const saved = localStorage.getItem(settingsStorageKey);
    if (!saved) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(saved) } as HouseholdSettings;
  } catch {
    return defaultSettings;
  }
}

function loadStoredSettings(): HouseholdSettings | null {
  try {
    const saved = localStorage.getItem(settingsStorageKey);
    if (!saved) return null;
    return { ...defaultSettings, ...JSON.parse(saved) } as HouseholdSettings;
  } catch {
    return null;
  }
}

function initials(name: string, fallback: string) {
  const letters = name.trim().split(/\s+/).map((part) => part[0]).filter(Boolean).join('');
  return (letters || fallback).slice(0, 2).toUpperCase();
}

function emptyForm(): FormState {
  return { amount: '', paidBy: 'me', date: localCalendarDate(), note: '' };
}

function AppShell() {
  const [month, setMonth] = useState(initialMonth);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'me' | 'wife'>('all');
  const [settings, setSettings] = useState<HouseholdSettings>(loadSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const migratedLocalSettings = useRef(false);
  const client = useQueryClient();
  const listKey = getListExpensesQueryKey({ month });
  const summaryKey = getGetExpenseSummaryQueryKey({ month });
  const statsKey = getGetExpenseStatsQueryKey();

  const expensesQuery = useListExpenses({ month }, { query: { queryKey: listKey } });
  const summaryQuery = useGetExpenseSummary({ month }, { query: { queryKey: summaryKey } });
  const statsQuery = useGetExpenseStats({ query: { queryKey: statsKey } });
  const householdSettingsQuery = useGetHouseholdSettings({ query: { queryKey: getGetHouseholdSettingsQueryKey() } });
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const updateHouseholdSettings = useUpdateHouseholdSettings();
  const deleteExpense = useDeleteExpense();

  const expenses = expensesQuery.data ?? [];
  const visibleExpenses = useMemo(() => filter === 'all' ? expenses : expenses.filter((item) => item.paidBy === filter), [expenses, filter]);
  const summary = summaryQuery.data;

  useEffect(() => {
    const serverSettings = householdSettingsQuery.data;
    if (!serverSettings) return;

    if (serverSettings.configured) {
      const syncedSettings: HouseholdSettings = {
        myName: serverSettings.myName,
        partnerName: serverSettings.partnerName,
        togetherSince: serverSettings.togetherSince,
        headline: serverSettings.headline,
        description: serverSettings.description,
      };
      setSettings(syncedSettings);
      localStorage.setItem(settingsStorageKey, JSON.stringify(syncedSettings));
      return;
    }

    const storedSettings = loadStoredSettings();
    if (!storedSettings || migratedLocalSettings.current) return;
    migratedLocalSettings.current = true;
    updateHouseholdSettings.mutate(
      { data: storedSettings as HouseholdSettingsInput },
      {
        onSuccess: (savedSettings) => {
          const syncedSettings: HouseholdSettings = {
            myName: savedSettings.myName,
            partnerName: savedSettings.partnerName,
            togetherSince: savedSettings.togetherSince,
            headline: savedSettings.headline,
            description: savedSettings.description,
          };
          setSettings(syncedSettings);
          localStorage.setItem(settingsStorageKey, JSON.stringify(syncedSettings));
          client.invalidateQueries({ queryKey: getGetHouseholdSettingsQueryKey() });
        },
        onError: () => {
          migratedLocalSettings.current = false;
        },
      },
    );
  }, [client, householdSettingsQuery.data, updateHouseholdSettings]);

  const changeMonth = (direction: number) => {
    const date = new Date(`${month}-01T12:00:00`);
    date.setMonth(date.getMonth() + direction);
    setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setForm({ amount: String(expense.amount), paidBy: expense.paidBy, date: expense.date.slice(0, 10), note: expense.note ?? '' });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!createExpense.isPending && !updateExpense.isPending) setDialogOpen(false);
  };

  const showFeedback = (kind: 'success' | 'error', text: string) => {
    setFeedback({ kind, text });
    window.setTimeout(() => setFeedback(null), 3200);
  };

  const saveSettings = (nextSettings: HouseholdSettings) => {
    const cleaned = {
      ...nextSettings,
      myName: nextSettings.myName.trim() || defaultSettings.myName,
      partnerName: nextSettings.partnerName.trim() || defaultSettings.partnerName,
      togetherSince: nextSettings.togetherSince.trim() || defaultSettings.togetherSince,
      headline: nextSettings.headline.trim() || defaultSettings.headline,
      description: nextSettings.description.trim() || defaultSettings.description,
    };
    updateHouseholdSettings.mutate(
      { data: cleaned as HouseholdSettingsInput },
      {
        onSuccess: (savedSettings) => {
          const syncedSettings: HouseholdSettings = {
            myName: savedSettings.myName,
            partnerName: savedSettings.partnerName,
            togetherSince: savedSettings.togetherSince,
            headline: savedSettings.headline,
            description: savedSettings.description,
          };
          localStorage.setItem(settingsStorageKey, JSON.stringify(syncedSettings));
          setSettings(syncedSettings);
          setSettingsOpen(false);
          showFeedback('success', 'Nastavenia boli uložené pre obe zariadenia.');
          client.invalidateQueries({ queryKey: getGetHouseholdSettingsQueryKey() });
        },
        onError: () => showFeedback('error', 'Nastavenia sa nepodarilo uložiť. Skúste to znova.'),
      },
    );
  };

  const submitExpense = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(form.amount.replace(',', '.'));
    if (!amount || amount <= 0 || !form.date) return;
    const data: ExpenseInput = { amount, paidBy: form.paidBy, date: form.date, note: form.note.trim() || null };
    const onSuccess = () => {
      setDialogOpen(false);
      showFeedback('success', editing ? 'Výdavok bol upravený.' : 'Výdavok bol pridaný.');
      client.invalidateQueries({ queryKey: listKey });
      client.invalidateQueries({ queryKey: summaryKey });
      client.invalidateQueries({ queryKey: statsKey });
    };
    const onError = () => showFeedback('error', 'Nepodarilo sa uložiť výdavok. Skúste to znova.');
    if (editing) updateExpense.mutate({ id: editing.id, data }, { onSuccess, onError });
    else createExpense.mutate({ data }, { onSuccess, onError });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    deleteExpense.mutate({ id: deleting.id }, {
      onSuccess: () => {
        setDeleting(null);
        showFeedback('success', 'Výdavok bol odstránený.');
        client.invalidateQueries({ queryKey: listKey });
        client.invalidateQueries({ queryKey: summaryKey });
        client.invalidateQueries({ queryKey: statsKey });
      },
      onError: () => showFeedback('error', 'Výdavok sa nepodarilo odstrániť.'),
    });
  };

  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1420px] flex-col lg:flex-row">
          <aside className="relative overflow-hidden bg-primary px-6 py-7 text-primary-foreground lg:sticky lg:top-0 lg:h-[100dvh] lg:w-[286px] lg:shrink-0 lg:px-8 lg:py-9">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full border border-white/10" />
          <div className="relative flex items-center justify-between lg:block">
              <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-primary"><ReceiptText size={20} strokeWidth={2.4} /></div>
              <div>
                <div className="font-serif text-xl leading-none">Spolu</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-[.22em] text-primary-foreground/55">domáci rozpočet</div>
              </div>
              <button type="button" data-testid="button-open-settings" onClick={() => setSettingsOpen(true)} className="grid h-10 w-10 place-items-center rounded-2xl border border-white/15 text-primary-foreground/75 transition-colors hover:bg-white/10 hover:text-white" aria-label="Otvoriť nastavenia"><Settings size={18} /></button>
            </div>
            <div className="mt-20 hidden lg:block">
              <p className="max-w-[190px] font-serif text-[29px] leading-[1.08]">{settings.headline}</p>
              <p className="mt-5 max-w-[195px] text-sm leading-6 text-primary-foreground/62">{settings.description}</p>
            </div>
            <div className="hidden items-center gap-2 lg:mt-20 lg:flex">
              <div className="flex -space-x-2">
                <div className="grid h-9 w-9 place-items-center rounded-full border-2 border-primary bg-[#f5a887] text-xs font-extrabold text-primary">{initials(settings.myName, 'M')}</div>
                <div className="grid h-9 w-9 place-items-center rounded-full border-2 border-primary bg-[#d4a9c3] text-xs font-extrabold text-primary">{initials(settings.partnerName, 'Ž')}</div>
              </div>
              <div className="text-xs text-primary-foreground/65"><span className="block max-w-[125px] truncate font-semibold text-primary-foreground">{settings.myName} & {settings.partnerName}</span>spolu od {settings.togetherSince}</div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-5 py-7 sm:px-8 lg:px-12 lg:py-11">
          <header className="mb-9 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-accent" /> prehľad domácnosti</div>
              <h1 className="font-serif text-4xl tracking-[-.03em] sm:text-5xl">Pekný deň, <span className="text-primary">obaja.</span></h1>
              <p className="mt-3 text-sm text-muted-foreground">Tu je váš spoločný obraz za <span className="font-semibold text-foreground">{monthLabel(month)}</span>.</p>
            </div>
            <button type="button" data-testid="button-add-expense" onClick={openCreate} className="hover-elevate active-elevate flex h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-extrabold text-primary shadow-sm"><Plus size={18} /> Pridať výdavok</button>
          </header>

          <div className="mb-8 flex items-center justify-between rounded-2xl border border-border bg-card px-3 py-2 shadow-xs sm:w-fit sm:gap-7">
            <button type="button" data-testid="button-previous-month" onClick={() => changeMonth(-1)} className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronLeft size={18} /></button>
            <div className="flex min-w-[150px] items-center justify-center gap-2 text-sm font-bold"><CalendarDays size={16} className="text-accent" /> {monthLabel(month)}</div>
            <button type="button" data-testid="button-next-month" onClick={() => changeMonth(1)} className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronRight size={18} /></button>
          </div>

          <SummaryCards summary={summary} loading={summaryQuery.isLoading} settings={settings} />
          <Statistics stats={statsQuery.data} loading={statsQuery.isLoading} settings={settings} />

          <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
            <section>
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div><h2 className="font-serif text-2xl">Výdavky</h2><p className="mt-1 text-xs text-muted-foreground">Každý nákup na svojom mieste.</p></div>
                  <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
                  {(['all', 'me', 'wife'] as const).map((item) => <button type="button" key={item} data-testid={`button-filter-${item}`} onClick={() => setFilter(item)} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${filter === item ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'}`}>{item === 'all' ? 'Všetky' : item === 'me' ? settings.myName : settings.partnerName}</button>)}
                </div>
              </div>
              <ExpenseList expenses={visibleExpenses} loading={expensesQuery.isLoading} error={!!expensesQuery.error} onRetry={() => expensesQuery.refetch()} onEdit={openEdit} onDelete={setDeleting} settings={settings} />
            </section>
            <MonthlyNote summary={summary} loading={summaryQuery.isLoading} settings={settings} />
          </div>
        </section>
      </div>

      {feedback && <div data-testid="status-feedback" className={`fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-lg ${feedback.kind === 'success' ? 'bg-primary' : 'bg-destructive'}`}><span className="grid h-6 w-6 place-items-center rounded-full bg-white/15">{feedback.kind === 'success' ? <Check size={15} /> : <CircleAlert size={15} />}</span>{feedback.text}</div>}
      {dialogOpen && <ExpenseDialog editing={editing} form={form} setForm={setForm} onClose={closeDialog} onSubmit={submitExpense} pending={createExpense.isPending || updateExpense.isPending} settings={settings} />}
      {deleting && <DeleteDialog expense={deleting} pending={deleteExpense.isPending} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />}
      {settingsOpen && <SettingsDialog settings={settings} onClose={() => setSettingsOpen(false)} onSave={saveSettings} pending={updateHouseholdSettings.isPending} />}
    </main>
  );
}

function SummaryCards({ summary, loading, settings }: { summary?: { total: number; paidByMe: number; paidByWife: number; halfTotal: number; balance: number; debtor: string | null; expenseCount: number }; loading: boolean; settings: HouseholdSettings }) {
  if (loading) return <div className="grid gap-4 sm:grid-cols-3"><div className="skeleton h-36 rounded-3xl" /><div className="skeleton h-36 rounded-3xl" /><div className="skeleton h-36 rounded-3xl" /></div>;
  const balanceText = !summary || !summary.debtor || Math.abs(summary.balance) < .01 ? 'Vyrovnané' : `${summary.debtor === 'me' ? settings.myName : settings.partnerName} dopláca`;
  return <div className="grid gap-4 sm:grid-cols-3">
    <div className="animate-rise rounded-3xl bg-primary p-6 text-primary-foreground shadow-sm"><div className="flex items-start justify-between"><span className="text-xs font-bold uppercase tracking-[.14em] text-primary-foreground/60">spolu tento mesiac</span><Sparkles size={18} className="text-accent" /></div><div data-testid="text-summary-total" className="mt-7 font-mono text-3xl tracking-tight">{money(summary?.total)}</div><div className="mt-2 text-xs text-primary-foreground/60">{summary?.expenseCount ?? 0} {summary?.expenseCount === 1 ? 'nákup' : 'nákupov'}</div></div>
    <div className="animate-rise rounded-3xl border border-border bg-card p-6 shadow-xs [animation-delay:80ms]"><div className="flex items-center justify-between text-xs font-bold uppercase tracking-[.14em] text-muted-foreground"><span>rovnakým dielom</span><div className="h-2 w-2 rounded-full bg-accent" /></div><div data-testid="text-summary-half" className="mt-7 font-mono text-3xl tracking-tight">{money(summary?.halfTotal)}</div><div className="mt-2 text-xs text-muted-foreground">každý z nás</div></div>
    <div className="animate-rise rounded-3xl border border-border bg-card p-6 shadow-xs [animation-delay:160ms]"><div className="flex items-center justify-between text-xs font-bold uppercase tracking-[.14em] text-muted-foreground"><span>vyrovnanie</span><div className={`h-2 w-2 rounded-full ${summary?.debtor ? 'bg-accent' : 'bg-[#85b7a7]'}`} /></div><div data-testid="text-summary-balance" className="mt-7 font-mono text-3xl tracking-tight">{summary?.debtor ? money(Math.abs(summary.balance)) : '0,00 €'}</div><div className="mt-2 text-xs text-muted-foreground">{balanceText}</div></div>
  </div>;
}

function Statistics({ stats, loading, settings }: { stats?: MonthlyExpenseStats[]; loading: boolean; settings: HouseholdSettings }) {
  if (loading) return <section className="mt-10"><div className="skeleton h-[390px] rounded-3xl" /></section>;
  if (!stats) return null;

  const total = stats.reduce((sum, item) => sum + item.total, 0);
  const monthsWithExpenses = stats.filter((item) => item.total > 0).length;
  const average = monthsWithExpenses ? total / monthsWithExpenses : 0;
  const highest = stats.reduce<MonthlyExpenseStats | null>((top, item) => !top || item.total > top.total ? item : top, null);
  const hasExpenses = total > 0;
  const yAxisMax = chartCeiling(highest?.total ?? 0);
  const chartData = stats.map((item) => ({
    ...item,
    label: monthNames[Number(item.month.slice(5, 7)) - 1].slice(0, 3),
  }));

  return (
    <section className="mt-10 rounded-3xl border border-border bg-card p-5 shadow-xs sm:p-7" data-testid="section-statistics">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-accent"><Sparkles size={15} /> štatistiky</div>
          <h2 className="mt-3 font-serif text-2xl">Ako vyzerá náš rok?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Výdavky za posledných 12 mesiacov.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-7 gap-y-3 text-right sm:min-w-[270px]">
          <div><div className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">spolu</div><div className="mt-1 font-mono text-lg font-medium">{money(total)}</div></div>
          <div><div className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">priemer / mesiac</div><div className="mt-1 font-mono text-lg font-medium">{money(average)}</div></div>
          <div className="col-span-2 text-xs text-muted-foreground">{highest && highest.total > 0 ? <>Najviac ste minuli v <span className="font-semibold text-foreground">{monthLabel(highest.month)}</span>.</> : 'Zatiaľ tu nie sú žiadne výdavky.'}</div>
        </div>
      </div>

      <div className="mt-7 h-[250px] w-full sm:h-[290px]">
        {hasExpenses ? (
          <ResponsiveContainer width="100%" height="100%" debounce={0}>
            <BarChart data={chartData} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barGap={2}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis domain={[0, yAxisMax]} tickCount={5} allowDecimals axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={chartMoney} width={72} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted) / .55)' }}
                isAnimationActive={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as MonthlyExpenseStats & { label: string };
                  return <div className="rounded-2xl border border-border bg-card px-4 py-3 text-xs shadow-lg"><div className="mb-2 font-bold">{monthLabel(item.month)}</div><div className="flex justify-between gap-6"><span>{settings.myName}</span><span className="font-mono">{money(item.paidByMe)}</span></div><div className="mt-1 flex justify-between gap-6"><span>{settings.partnerName}</span><span className="font-mono">{money(item.paidByWife)}</span></div><div className="mt-2 border-t border-border pt-2 font-bold"><span>Spolu</span><span className="float-right font-mono">{money(item.total)}</span></div></div>;
                }}
              />
              <Bar dataKey="paidByMe" name={settings.myName} stackId="expenses" fill="hsl(var(--primary))" fillOpacity={0.88} radius={[0, 0, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="paidByWife" name={settings.partnerName} stackId="expenses" fill="hsl(var(--accent))" fillOpacity={0.88} radius={[5, 5, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/50 text-center">
            <div className="font-serif text-xl">Zatiaľ bez výdavkov</div>
            <p className="mt-2 max-w-xs text-xs leading-5 text-muted-foreground">Keď pridáte nákup, jeho skutočná suma sa zobrazí v mesačnom grafe.</p>
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground">
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-primary" />{settings.myName}</span>
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-accent" />{settings.partnerName}</span>
      </div>
    </section>
  );
}

function ExpenseList({ expenses, loading, error, onRetry, onEdit, onDelete, settings }: { expenses: Expense[]; loading: boolean; error: boolean; onRetry: () => void; onEdit: (expense: Expense) => void; onDelete: (expense: Expense) => void; settings: HouseholdSettings }) {
  if (loading) return <div className="space-y-3">{[1, 2, 3, 4].map((item) => <div key={item} className="skeleton h-[76px] rounded-2xl" />)}</div>;
  if (error) return <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center"><CircleAlert className="mx-auto mb-3 text-destructive" /><p className="font-bold">Výdavky sa nepodarilo načítať.</p><button type="button" data-testid="button-retry-expenses" onClick={onRetry} className="mt-4 rounded-xl bg-card px-4 py-2 text-xs font-bold shadow-xs">Skúsiť znova</button></div>;
  if (!expenses.length) return <div data-testid="empty-expenses" className="rounded-3xl border border-dashed border-border bg-card/50 px-6 py-14 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary"><ReceiptText size={24} /></div><h3 className="mt-5 font-serif text-xl">Zatiaľ je tu ticho.</h3><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">Pridajte prvý nákup a budete mať prehľad bez počítania na papieri.</p></div>;
   return <div className="space-y-3">{expenses.map((expense, index) => <article key={expense.id} data-testid={`row-expense-${expense.id}`} className="animate-rise group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs transition-shadow hover:shadow-sm" style={{ animationDelay: `${index * 45}ms` }}><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-extrabold ${expense.paidBy === 'me' ? 'bg-[#fce1d4] text-[#a35237]' : 'bg-[#eadceb] text-[#715173]'}`}>{expense.paidBy === 'me' ? initials(settings.myName, 'M') : initials(settings.partnerName, 'Ž')}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="truncate text-sm font-bold">{expense.note || 'Nákup'}</span><span className="hidden rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground sm:inline">{expense.paidBy === 'me' ? settings.myName : settings.partnerName}</span></div><div className="mt-1 text-xs text-muted-foreground">{readableDate(expense.date)}</div></div><div className="text-right"><div data-testid={`text-expense-amount-${expense.id}`} className="font-mono text-sm font-medium">{money(expense.amount)}</div><div className="mt-1 text-[10px] text-muted-foreground">na polovicu {money(expense.amount / 2)}</div></div><div className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"><button type="button" data-testid={`button-edit-expense-${expense.id}`} onClick={() => onEdit(expense)} aria-label="Upraviť výdavok" className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil size={14} /></button><button type="button" data-testid={`button-delete-expense-${expense.id}`} onClick={() => onDelete(expense)} aria-label="Odstrániť výdavok" className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={14} /></button></div></article>)}</div>;
}

function MonthlyNote({ summary, loading, settings }: { summary?: { paidByMe: number; paidByWife: number; balance: number; debtor: string | null }; loading: boolean; settings: HouseholdSettings }) {
  if (loading) return <aside className="skeleton h-64 rounded-3xl" />;
  const mine = summary?.paidByMe ?? 0; const hers = summary?.paidByWife ?? 0; const max = Math.max(mine, hers, 1);
   return <aside className="rounded-3xl bg-secondary/70 p-6"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-primary"><Sparkles size={15} /> malá poznámka</div><h3 className="mt-6 font-serif text-2xl leading-tight">Aj malé nákupy<br />tvoria náš mesiac.</h3><div className="mt-8 space-y-4"><div><div className="mb-2 flex justify-between text-xs font-semibold"><span>{settings.myName}</span><span className="font-mono">{money(mine)}</span></div><div className="h-2 overflow-hidden rounded-full bg-card"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${(mine / max) * 100}%` }} /></div></div><div><div className="mb-2 flex justify-between text-xs font-semibold"><span>{settings.partnerName}</span><span className="font-mono">{money(hers)}</span></div><div className="h-2 overflow-hidden rounded-full bg-card"><div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${(hers / max) * 100}%` }} /></div></div></div></aside>;
}

function ExpenseDialog({ editing, form, setForm, onClose, onSubmit, pending, settings }: { editing: Expense | null; form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>>; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; pending: boolean; settings?: HouseholdSettings }) {
  return <div className="fixed inset-0 z-40 grid place-items-end bg-primary/25 p-0 backdrop-blur-sm sm:place-items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="expense-dialog-title"><div className="animate-rise w-full max-w-lg rounded-t-[2rem] bg-card p-6 shadow-xl sm:rounded-[2rem] sm:p-8"><div className="mb-7 flex items-start justify-between"><div><div className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-accent">{editing ? 'upraviť záznam' : 'nový záznam'}</div><h2 id="expense-dialog-title" className="font-serif text-3xl">{editing ? 'Čo sa zmenilo?' : 'Čo sme kúpili?'}</h2></div><button type="button" data-testid="button-close-expense-dialog" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-muted-foreground"><X size={17} /></button></div><form onSubmit={onSubmit} className="space-y-5"><label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Suma</span><div className="relative"><input data-testid="input-expense-amount" required min="0.01" step="0.01" inputMode="decimal" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="0,00" className="h-14 w-full rounded-2xl border border-input bg-background px-4 pr-12 font-mono text-xl outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10" /><span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">€</span></div></label><div className="grid gap-5 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Kto platil?</span><select data-testid="select-expense-payer" value={form.paidBy} onChange={(event) => setForm((current) => ({ ...current, paidBy: event.target.value as 'me' | 'wife' }))} className="h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm font-semibold outline-none focus:border-primary"><option value="me">{settings?.myName ?? 'Ja'}</option><option value="wife">{settings?.partnerName ?? 'Manželka'}</option></select></label><label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Dátum</span><input data-testid="input-expense-date" required type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className="h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm font-semibold outline-none focus:border-primary" /></label></div><label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Poznámka <span className="font-normal normal-case tracking-normal">(nepovinné)</span></span><input data-testid="input-expense-note" value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} placeholder="napr. sobotný nákup" className="h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none focus:border-primary" /></label><button type="submit" data-testid="button-save-expense" disabled={pending} className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-extrabold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-60">{pending ? <LoaderCircle size={17} className="animate-spin" /> : <Check size={17} />}{editing ? 'Uložiť zmeny' : 'Uložiť výdavok'}</button></form></div></div>;
}

function DeleteDialog({ expense, pending, onCancel, onConfirm }: { expense: Expense; pending: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-primary/25 p-5 backdrop-blur-sm" role="alertdialog" aria-modal="true"><div className="animate-rise w-full max-w-sm rounded-[2rem] bg-card p-7 text-center shadow-xl"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive"><Trash2 size={22} /></div><h2 className="mt-5 font-serif text-2xl">Odstrániť výdavok?</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Záznam „{expense.note || 'Nákup'}“ v sume <span className="font-mono font-bold text-foreground">{money(expense.amount)}</span> sa natrvalo odstráni.</p><div className="mt-7 grid grid-cols-2 gap-3"><button type="button" data-testid="button-cancel-delete" onClick={onCancel} className="h-11 rounded-xl border border-border text-sm font-bold">Zrušiť</button><button type="button" data-testid="button-confirm-delete" disabled={pending} onClick={onConfirm} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-destructive text-sm font-bold text-destructive-foreground disabled:opacity-60">{pending ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />} Odstrániť</button></div></div></div>;
}

function SettingsDialog({ settings, onClose, onSave, pending }: { settings: HouseholdSettings; onClose: () => void; onSave: (settings: HouseholdSettings) => void; pending: boolean }) {
  const [draft, setDraft] = useState(settings);
  const update = (field: keyof HouseholdSettings, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 grid min-h-dvh place-items-end overflow-y-auto bg-primary/25 p-0 backdrop-blur-sm sm:place-items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="settings-dialog-title">
      <div className="animate-rise max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-card px-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-6 shadow-xl overscroll-contain sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-[2rem] sm:p-8">
        <div className="mb-7 flex items-start justify-between">
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-accent">nastavenie domácnosti</div>
            <h2 id="settings-dialog-title" className="font-serif text-3xl">Ako vám máme hovoriť?</h2>
          </div>
          <button type="button" data-testid="button-close-settings" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-muted-foreground" aria-label="Zavrieť nastavenia"><X size={17} /></button>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); onSave(draft); }} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Vaše meno</span>
              <input data-testid="input-my-name" required value={draft.myName} onChange={(event) => update('myName', event.target.value)} className="h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Meno manželky</span>
              <input data-testid="input-partner-name" required value={draft.partnerName} onChange={(event) => update('partnerName', event.target.value)} className="h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none focus:border-primary" />
            </label>
          </div>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Spolu od</span>
            <input data-testid="input-together-since" required value={draft.togetherSince} onChange={(event) => update('togetherSince', event.target.value)} placeholder="napr. 2024 alebo 12. 5. 2024" className="h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Hlavný text</span>
            <input data-testid="input-household-headline" required value={draft.headline} onChange={(event) => update('headline', event.target.value)} className="h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Krátky opis</span>
            <textarea data-testid="input-household-description" required value={draft.description} onChange={(event) => update('description', event.target.value)} rows={3} className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary" />
          </label>
          <button type="submit" data-testid="button-save-settings" disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-extrabold text-primary-foreground disabled:opacity-60">{pending ? <LoaderCircle size={17} className="animate-spin" /> : <Check size={17} />} {pending ? 'Ukladám…' : 'Uložiť nastavenia'}</button>
        </form>
      </div>
    </div>
  );
}

function Router() {
  return <Switch><Route path="/" component={AppShell} /><Route component={NotFound} /></Switch>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;