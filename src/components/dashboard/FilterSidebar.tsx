import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown, Filter, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DashboardFilters, FilterOptions } from "@/lib/dashboard";


interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}


function MultiSelectDropdown({ label, options, selected, onChange }: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const allSelected = selected.length === options.length;

  const toggleAll = () => {
    onChange(allSelected ? [] : [...options]);
  };

  const toggle = (option: string) => {
    onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-full flex items-center justify-between px-3 py-2 text-sm border border-border rounded bg-card text-foreground hover:bg-muted/50 transition-colors">
          <span className="truncate text-left">
            {selected.length === 0
              ? label
              : selected.length === options.length
                ? `All ${label}`
                : `${selected.length} selected`}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <label className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-muted rounded">
          <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
          <span className="font-medium">Select All</span>
        </label>
        <div className="h-px bg-border my-1" />
        <div className="max-h-48 overflow-y-auto">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-muted rounded">
              <Checkbox checked={selected.includes(option)} onCheckedChange={() => toggle(option)} />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}


interface FilterSidebarProps {
  options?: FilterOptions;
  onApply: (filters: DashboardFilters) => void;
}


export default function FilterSidebar({ options, onApply }: FilterSidebarProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [devices, setDevices] = useState<string[]>([]);
  const [meals, setMeals] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [weeks, setWeeks] = useState<string[]>([]);

  useEffect(() => {
    if (!options) return;
    setDateFrom(options.min_date ? new Date(options.min_date) : undefined);
    setDateTo(options.max_date ? new Date(options.max_date) : undefined);
    setDevices(options.devices);
    setMeals(options.meal_types);
    setCategories(options.categories);
    setWeeks([]);
  }, [options]);

  const apply = () => {
    let finalDateFrom = dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined;
    let finalDateTo = dateTo ? format(dateTo, "yyyy-MM-dd") : undefined;
    if (weeks.length && options?.weeks?.length) {
      const selected = options.weeks.filter((item) => weeks.includes(item.value));
      if (selected.length) {
        const sorted = selected
          .map((item) => ({ start: item.start_date, end: item.end_date }))
          .sort((a, b) => a.start.localeCompare(b.start));
        finalDateFrom = sorted[0].start;
        finalDateTo = sorted[sorted.length - 1].end;
      }
    }
    onApply({
      dateFrom: finalDateFrom,
      dateTo: finalDateTo,
      devices,
      mealTypes: meals,
      categories,
      weeks,
    });
  };

  const reset = () => {
    setDateFrom(options?.min_date ? new Date(options.min_date) : undefined);
    setDateTo(options?.max_date ? new Date(options.max_date) : undefined);
    setDevices(options?.devices ?? []);
    setMeals(options?.meal_types ?? []);
    setCategories(options?.categories ?? []);
    setWeeks([]);
    onApply({
      dateFrom: options?.min_date ?? undefined,
      dateTo: options?.max_date ?? undefined,
      devices: options?.devices ?? [],
      mealTypes: options?.meal_types ?? [],
      categories: options?.categories ?? [],
      weeks: [],
    });
  };

  return (
    <aside className="w-64 shrink-0 bg-card border-r border-border h-screen sticky top-0 flex flex-col">
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Filters</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date Range</label>
          <div className="space-y-1.5">
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full flex items-center justify-between px-3 py-2 text-sm border border-border rounded bg-card text-foreground hover:bg-muted/50 transition-colors">
                  <span>{dateFrom ? format(dateFrom, "MMM d, yyyy") : "Start date"}</span>
                  <CalendarIcon className="h-3.5 w-3.5 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full flex items-center justify-between px-3 py-2 text-sm border border-border rounded bg-card text-foreground hover:bg-muted/50 transition-colors">
                  <span>{dateTo ? format(dateTo, "MMM d, yyyy") : "End date"}</span>
                  <CalendarIcon className="h-3.5 w-3.5 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Device</label>
          <MultiSelectDropdown label="Devices" options={options?.devices ?? []} selected={devices} onChange={setDevices} />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Meal Type</label>
          <MultiSelectDropdown label="Meal Types" options={options?.meal_types ?? []} selected={meals} onChange={setMeals} />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
          <MultiSelectDropdown label="Categories" options={options?.categories ?? []} selected={categories} onChange={setCategories} />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Week</label>
          <MultiSelectDropdown
            label="Weeks"
            options={(options?.weeks ?? []).map((item) => item.label)}
            selected={(options?.weeks ?? [])
              .filter((item) => weeks.includes(item.value))
              .map((item) => item.label)}
            onChange={(selectedLabels) => {
              const values = (options?.weeks ?? [])
                .filter((item) => selectedLabels.includes(item.label))
                .map((item) => item.value);
              setWeeks(values);
            }}
          />
        </div>
      </div>

      <div className="px-4 py-3 border-t border-border space-y-2">
        <Button onClick={apply} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-sm">
          Apply Filters
        </Button>
        <Button onClick={reset} variant="outline" className="w-full h-9 text-sm">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Reset
        </Button>
      </div>
    </aside>
  );
}
