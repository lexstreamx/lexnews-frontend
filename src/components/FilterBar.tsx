'use client';

import { Category, FeedType, DatePreset, DateFilter } from '@/types';
import MultiSelectDropdown from './MultiSelectDropdown';

const FEED_TYPES: { value: FeedType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'news', label: 'News' },
  { value: 'blogpost', label: 'Blogposts' },
  { value: 'judgment', label: 'Case Law' },
  { value: 'competition', label: 'Competition' },
  { value: 'regulatory', label: 'Regulatory' },
  { value: 'legislation', label: 'Legislation' },
  { value: 'procurement', label: 'Procurement' },
];

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'custom', label: 'Custom' },
];

const COURT_OPTIONS = [
  { value: 'Court of Justice', label: 'Court of Justice' },
  { value: 'General Court', label: 'General Court' },
];

const DOC_TYPE_OPTIONS = [
  { value: 'Judgment', label: 'Judgment' },
  { value: 'Opinion of Advocate General', label: 'AG Opinion' },
  { value: 'Press Release', label: 'Press Release' },
  { value: 'Order', label: 'Order' },
];

const INSTRUMENT_OPTIONS = [
  { value: 'antitrust', label: 'Antitrust' },
  { value: 'dma', label: 'DMA' },
  { value: 'fsr', label: 'FSR' },
];

const PT_COURT_OPTIONS = [
  { value: 'Supremo Tribunal de Justiça', label: 'STJ' },
  { value: 'Supremo Tribunal Administrativo', label: 'STA' },
  { value: 'Tribunal da Relação de Lisboa', label: 'TRL' },
  { value: 'Tribunal da Relação do Porto', label: 'TRP' },
  { value: 'Tribunal da Relação de Coimbra', label: 'TRC' },
  { value: 'Tribunal da Relação de Évora', label: 'TRE' },
  { value: 'Tribunal da Relação de Guimarães', label: 'TRG' },
  { value: 'Tribunal Central Administrativo Sul', label: 'TCA-S' },
  { value: 'Tribunal Central Administrativo Norte', label: 'TCA-N' },
];

interface FilterBarProps {
  categories: Category[];
  jurisdictions: string[];
  selectedFeedType: FeedType;
  selectedCategories: string[];
  selectedJurisdictions: string[];
  selectedCourts: string[];
  selectedDocTypes: string[];
  selectedInstruments: string[];
  onFeedTypeChange: (type: FeedType) => void;
  onCategoriesChange: (slugs: string[]) => void;
  onJurisdictionsChange: (jurisdictions: string[]) => void;
  onCourtsChange: (courts: string[]) => void;
  onDocTypesChange: (docTypes: string[]) => void;
  onInstrumentsChange: (instruments: string[]) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  dark?: boolean;
}

export default function FilterBar({
  categories,
  jurisdictions,
  selectedFeedType,
  selectedCategories,
  selectedJurisdictions,
  selectedCourts,
  selectedDocTypes,
  selectedInstruments,
  onFeedTypeChange,
  onCategoriesChange,
  onJurisdictionsChange,
  onCourtsChange,
  onDocTypesChange,
  onInstrumentsChange,
  dateFilter,
  onDateFilterChange,
  dark = false,
}: FilterBarProps) {
  const categoryOptions = categories.map((cat) => ({
    value: cat.slug,
    label: cat.name,
  }));

  const jurisdictionOptions = jurisdictions.map((j) => ({
    value: j,
    label: j,
  }));

  return (
    <div className="space-y-3">
      {/* Feed type tabs */}
      <div className={`flex flex-wrap gap-1 p-1 rounded-lg ${dark ? 'bg-[#1E2712]' : 'bg-brand-bg'}`}>
        {FEED_TYPES.map((ft) => (
          <button
            key={ft.value}
            onClick={() => onFeedTypeChange(ft.value)}
            className={`px-3 py-2 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-md transition-all ${
              selectedFeedType === ft.value
                ? dark ? 'bg-brand-accent text-white shadow-sm' : 'bg-brand-body text-white shadow-sm'
                : dark ? 'text-[#8A9A7C] hover:text-white' : 'text-brand-muted hover:text-brand-body'
            }`}
          >
            {ft.label}
          </button>
        ))}
      </div>

      {/* Date range filter */}
      <div className="space-y-2">
        <div className={`flex flex-wrap gap-1 p-1 rounded-lg ${dark ? 'bg-[#1E2712]' : 'bg-brand-bg'}`}>
          {DATE_PRESETS.map((dp) => (
            <button
              key={dp.value}
              onClick={() => onDateFilterChange(
                dp.value === 'custom'
                  ? { preset: 'custom', from: dateFilter.from || '', to: dateFilter.to || '' }
                  : { preset: dp.value }
              )}
              className={`px-3 py-2 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                dateFilter.preset === dp.value
                  ? dark ? 'bg-brand-accent text-white shadow-sm' : 'bg-brand-body text-white shadow-sm'
                  : dark ? 'text-[#8A9A7C] hover:text-white' : 'text-brand-muted hover:text-brand-body'
              }`}
            >
              {dp.label}
            </button>
          ))}
        </div>
        {dateFilter.preset === 'custom' && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className={`text-xs shrink-0 ${dark ? 'text-[#7A8A6C]' : 'text-brand-muted'}`}>From</span>
              <input
                type="date"
                value={dateFilter.from || ''}
                onChange={(e) => onDateFilterChange({ ...dateFilter, from: e.target.value })}
                className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent/20 focus:border-brand-accent/50 ${
                  dark
                    ? 'bg-[#1E2712] border-[#3A4A2C] text-white [color-scheme:dark]'
                    : 'bg-white border-brand-border text-brand-body'
                }`}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs shrink-0 ${dark ? 'text-[#7A8A6C]' : 'text-brand-muted'}`}>To</span>
              <input
                type="date"
                value={dateFilter.to || ''}
                onChange={(e) => onDateFilterChange({ ...dateFilter, to: e.target.value })}
                className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent/20 focus:border-brand-accent/50 ${
                  dark
                    ? 'bg-[#1E2712] border-[#3A4A2C] text-white [color-scheme:dark]'
                    : 'bg-white border-brand-border text-brand-body'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Jurisdiction multi-select */}
      <MultiSelectDropdown
        label="Jurisdiction"
        options={jurisdictionOptions}
        selected={selectedJurisdictions}
        onChange={onJurisdictionsChange}
        searchable={jurisdictions.length > 8}
        dark={dark}
      />

      {/* Caselaw-specific filters */}
      {selectedFeedType === 'judgment' && (
        <div className="space-y-2">
          {/* Portuguese court filter — only when jurisdiction includes Portugal */}
          {selectedJurisdictions.includes('Portugal') && (
            <MultiSelectDropdown
              label="Tribunal"
              options={PT_COURT_OPTIONS}
              selected={selectedCourts}
              onChange={onCourtsChange}
              searchable
              dark={dark}
            />
          )}
          <MultiSelectDropdown
            label="EU Court"
            options={COURT_OPTIONS}
            selected={selectedCourts}
            onChange={onCourtsChange}
            dark={dark}
          />
          <MultiSelectDropdown
            label="Document Type"
            options={DOC_TYPE_OPTIONS}
            selected={selectedDocTypes}
            onChange={onDocTypesChange}
            dark={dark}
          />
        </div>
      )}

      {/* Competition-specific filters */}
      {selectedFeedType === 'competition' && (
        <div className="space-y-2">
          <MultiSelectDropdown
            label="Instrument"
            options={INSTRUMENT_OPTIONS}
            selected={selectedInstruments}
            onChange={onInstrumentsChange}
            dark={dark}
          />
        </div>
      )}

      {/* Categories multi-select */}
      <MultiSelectDropdown
        label="Areas of Law"
        options={categoryOptions}
        selected={selectedCategories}
        onChange={onCategoriesChange}
        searchable
        dark={dark}
      />
    </div>
  );
}
