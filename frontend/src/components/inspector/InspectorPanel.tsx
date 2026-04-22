import React, { useMemo, useState } from 'react';
import { useEditorStore } from '@/core/editor/store';
import { useAnnotationStore } from '@/core/annotations/store';
import type { AnnotationType, PdfAnnotation } from '@/core/annotations/types';
import { FeaturePlaceholder } from '@/components/ui/FeaturePlaceholder';
import { Settings, Palette, Info, ChevronRight, ChevronLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const ANNOTATION_TYPES: AnnotationType[] = [
  'textbox',
  'highlight',
  'underline',
  'shape',
  'freehand',
  'stamp',
  'comment',
  'line',
  'arrow',
  'callout',
];

export const InspectorPanel: React.FC = () => {
  const { inspectorTab, setInspectorTab, rightPanelWidth, setRightPanelWidth } = useEditorStore();
  const {
    annotations,
    selectedAnnotationIds,
    activeAnnotationId,
    updateAnnotation,
    updateManyAnnotations,
    deleteSelection,
  } = useAnnotationStore();

  const [previousWidth, setPreviousWidth] = useState(18);
  const isCollapsed = rightPanelWidth <= 0.1;

  const selection = useMemo(
    () => annotations.filter((annotation) => selectedAnnotationIds.includes(annotation.id)),
    [annotations, selectedAnnotationIds],
  );

  const activeAnnotation =
    annotations.find((annotation) => annotation.id === activeAnnotationId) ?? selection[0] ?? null;

  const toggleCollapse = () => {
    if (isCollapsed) {
      setRightPanelWidth(previousWidth < 10 ? 18 : previousWidth);
    } else {
      setPreviousWidth(rightPanelWidth);
      setRightPanelWidth(0);
    }
  };

  if (isCollapsed) {
    return (
      <div className="absolute top-4 right-4 z-10">
        <Button
          data-testid="inspector-collapse-btn"
          variant="secondary"
          size="icon"
          onClick={toggleCollapse}
          className="shadow-md rounded-full h-8 w-8"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'properties', icon: Settings, label: 'Properties' },
    { id: 'style', icon: Palette, label: 'Style' },
    { id: 'metadata', icon: Info, label: 'Metadata' },
    { id: 'review', icon: MessageSquare, label: 'Review' },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Inspector
        </h2>
        <Button
          data-testid="inspector-collapse-btn"
          variant="ghost"
          size="icon"
          className="h-6 w-6 -mr-2"
          onClick={toggleCollapse}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-200 dark:border-slate-800">
        {selection.length > 1 ? `${selection.length} annotations selected` : activeAnnotation ? '1 annotation selected' : 'No selection'}
      </div>

      <div className="flex items-center p-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-md w-full">
          {tabs.map((tab) => {
            const isActive = inspectorTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setInspectorTab(tab.id)}
                className={`flex-1 flex items-center justify-center py-1.5 rounded-sm transition-colors ${
                  isActive
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title={tab.label}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto relative">
        {!activeAnnotation && (
          <FeaturePlaceholder
            name="No selection"
            description="Select an annotation to edit it."
            icon={<Settings />}
          />
        )}

        {activeAnnotation && inspectorTab === 'properties' && (
          <PropertiesTab
            annotation={activeAnnotation}
            updateAnnotation={updateAnnotation}
            deleteSelection={deleteSelection}
          />
        )}

        {activeAnnotation && inspectorTab === 'style' && (
          <StyleTab
            annotation={activeAnnotation}
            updateManyAnnotations={updateManyAnnotations}
            selection={selection}
          />
        )}

        {activeAnnotation && inspectorTab === 'metadata' && (
          <MetadataTab annotation={activeAnnotation} />
        )}

        {activeAnnotation && inspectorTab === 'review' && (
          <ReviewTab annotation={activeAnnotation} updateAnnotation={updateAnnotation} />
        )}
      </div>
    </div>
  );
};

const ReviewTab: React.FC<{
  annotation: PdfAnnotation;
  updateAnnotation: (id: string, data: Partial<PdfAnnotation>) => void;
}> = ({ annotation, updateAnnotation }) => {
  const author = typeof annotation.data.author === 'string' ? annotation.data.author : '';
  const category = typeof annotation.data.category === 'string' ? annotation.data.category : '';
  const reviewStatus = typeof annotation.data.reviewStatus === 'string' ? annotation.data.reviewStatus : 'open';

  return (
    <div className="p-4 space-y-4">
      <SectionTitle title="Review Data" />

      <LabeledInputShell label="Author">
        <input
          type="text"
          className={baseInputClass}
          value={author}
          onChange={(e) =>
            updateAnnotation(annotation.id, {
              data: { ...annotation.data, author: e.target.value },
            })
          }
          placeholder="System"
        />
      </LabeledInputShell>

      <LabeledSelect
        label="Status"
        value={reviewStatus}
        onChange={(value) =>
          updateAnnotation(annotation.id, {
            data: { ...annotation.data, reviewStatus: value },
          })
        }
        options={[
          { label: 'Open', value: 'open' },
          { label: 'Resolved', value: 'resolved' },
          { label: 'Rejected', value: 'rejected' },
        ]}
      />

      <LabeledInputShell label="Category">
        <input
          type="text"
          className={baseInputClass}
          value={category}
          onChange={(e) =>
            updateAnnotation(annotation.id, {
              data: { ...annotation.data, category: e.target.value },
            })
          }
          placeholder="e.g. Needs Work"
        />
      </LabeledInputShell>
    </div>
  );
};

const PropertiesTab: React.FC<{
  annotation: PdfAnnotation;
  updateAnnotation: (id: string, data: Partial<PdfAnnotation>) => void;
  deleteSelection: () => void;
}> = ({ annotation, updateAnnotation, deleteSelection }) => {
  const updateRect = (key: 'x' | 'y' | 'width' | 'height', value: string) => {
    const next = Number(value);
    if (Number.isNaN(next)) {
      return;
    }
    updateAnnotation(annotation.id, {
      rect: {
        ...annotation.rect,
        [key]: next,
      },
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle title="General" />
        <Button variant="ghost" size="sm" onClick={deleteSelection} className="text-red-600">
          Delete
        </Button>
      </div>

      <LabeledSelect
        label="Type"
        value={annotation.type}
        onChange={(value) => updateAnnotation(annotation.id, { type: value as AnnotationType })}
        options={ANNOTATION_TYPES.map((type) => ({ label: type, value: type }))}
      />

      <TwoColumnRow>
        <LabeledNumberInput label="X" value={annotation.rect.x} onChange={(v) => updateRect('x', v)} />
        <LabeledNumberInput label="Y" value={annotation.rect.y} onChange={(v) => updateRect('y', v)} />
      </TwoColumnRow>

      <TwoColumnRow>
        <LabeledNumberInput label="Width" value={annotation.rect.width} onChange={(v) => updateRect('width', v)} />
        <LabeledNumberInput label="Height" value={annotation.rect.height} onChange={(v) => updateRect('height', v)} />
      </TwoColumnRow>

      <LabeledNumberInput
        label="Rotation"
        value={typeof annotation.data.rotation === 'number' ? annotation.data.rotation : 0}
        onChange={(value) => {
          const next = Number(value);
          if (Number.isNaN(next)) {
            return;
          }
          updateAnnotation(annotation.id, {
            data: { ...annotation.data, rotation: next },
          });
        }}
      />

      {isTextLike(annotation.type) && (
        <LabeledTextarea
          label="Text"
          value={typeof annotation.data.text === 'string' ? annotation.data.text : ''}
          onChange={(value) =>
            updateAnnotation(annotation.id, {
              data: { ...annotation.data, text: value },
            })
          }
        />
      )}
    </div>
  );
};

const StyleTab: React.FC<{
  annotation: PdfAnnotation;
  selection: PdfAnnotation[];
  updateManyAnnotations: (
    updates: Array<{ id: string; data: Partial<PdfAnnotation> }>,
  ) => void;
}> = ({ annotation, selection, updateManyAnnotations }) => {
  const applyToSelection = (dataPatch: Record<string, unknown>) => {
    const targets = selection.length > 1 ? selection : [annotation];
    updateManyAnnotations(
      targets.map((item) => ({
        id: item.id,
        data: {
          data: {
            ...item.data,
            ...dataPatch,
          },
        },
      })),
    );
  };

  return (
    <div className="p-4 space-y-4">
      <SectionTitle title="Appearance" />

      <TwoColumnRow>
        <LabeledColorInput
          label="Background"
          value={readColor(annotation.data.backgroundColor, '#ffffff')}
          onChange={(value) => applyToSelection({ backgroundColor: value })}
        />
        <LabeledColorInput
          label="Border"
          value={readColor(annotation.data.borderColor, '#60a5fa')}
          onChange={(value) => applyToSelection({ borderColor: value })}
        />
      </TwoColumnRow>

      <TwoColumnRow>
        <LabeledColorInput
          label="Text"
          value={readColor(annotation.data.textColor, '#0f172a')}
          onChange={(value) => applyToSelection({ textColor: value })}
        />
        <LabeledNumberInput
          label="Border Width"
          value={typeof annotation.data.borderWidth === 'number' ? annotation.data.borderWidth : 1}
          onChange={(value) => {
            const next = Number(value);
            if (Number.isNaN(next)) {
              return;
            }
            applyToSelection({ borderWidth: next });
          }}
        />
      </TwoColumnRow>

      {isTextLike(annotation.type) && (
        <>
          <TwoColumnRow>
            <LabeledNumberInput
              label="Font Size"
              value={typeof annotation.data.fontSize === 'number' ? annotation.data.fontSize : 12}
              onChange={(value) => {
                const next = Number(value);
                if (Number.isNaN(next)) {
                  return;
                }
                applyToSelection({ fontSize: next });
              }}
            />

            <LabeledSelect
              label="Weight"
              value={typeof annotation.data.fontWeight === 'string' ? annotation.data.fontWeight : 'normal'}
              onChange={(value) => applyToSelection({ fontWeight: value })}
              options={[
                { label: 'normal', value: 'normal' },
                { label: 'bold', value: 'bold' },
              ]}
            />
          </TwoColumnRow>

          <LabeledSelect
            label="Text Align"
            value={typeof annotation.data.textAlign === 'string' ? annotation.data.textAlign : 'left'}
            onChange={(value) => applyToSelection({ textAlign: value })}
            options={[
              { label: 'left', value: 'left' },
              { label: 'center', value: 'center' },
              { label: 'right', value: 'right' },
            ]}
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={annotation.data.autoSize !== false}
              onChange={(event) => applyToSelection({ autoSize: event.target.checked })}
            />
            Auto-size text box
          </label>
        </>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={annotation.data.locked === true}
          onChange={(event) => applyToSelection({ locked: event.target.checked })}
        />
        Locked
      </label>
    </div>
  );
};

const MetadataTab: React.FC<{ annotation: PdfAnnotation }> = ({ annotation }) => (
  <div className="p-4 space-y-3">
    <SectionTitle title="Metadata" />
    <KeyValue label="ID" value={annotation.id} mono />
    <KeyValue label="Type" value={annotation.type} />
    <KeyValue label="Page" value={String(annotation.pageNumber)} />
    <KeyValue label="Created" value={new Date(annotation.createdAt).toLocaleString()} />
    <KeyValue label="Updated" value={new Date(annotation.updatedAt).toLocaleString()} />
  </div>
);

function isTextLike(type: AnnotationType): boolean {
  return type === 'textbox' || type === 'comment' || type === 'stamp' || type === 'callout';
}

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
    {title}
  </div>
);

const TwoColumnRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-2 gap-3">{children}</div>
);

const baseInputClass =
  'w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

const LabeledInputShell: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block space-y-1">
    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
    {children}
  </label>
);

const LabeledNumberInput: React.FC<{
  label: string;
  value: number;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
  <LabeledInputShell label={label}>
    <input type="number" className={baseInputClass} value={value} onChange={(e) => onChange(e.target.value)} />
  </LabeledInputShell>
);

const LabeledSelect: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}> = ({ label, value, onChange, options }) => (
  <LabeledInputShell label={label}>
    <select className={baseInputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </LabeledInputShell>
);

const LabeledTextarea: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
  <LabeledInputShell label={label}>
    <textarea
      className={`${baseInputClass} min-h-[90px] resize-y`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </LabeledInputShell>
);

const LabeledColorInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
  <LabeledInputShell label={label}>
    <input type="color" className="h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2" value={value} onChange={(e) => onChange(e.target.value)} />
  </LabeledInputShell>
);

const KeyValue: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono = false }) => (
  <div className="space-y-1">
    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
    <div className={`rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm ${mono ? 'font-mono break-all' : ''}`}>
      {value}
    </div>
  </div>
);

function readColor(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

