"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, FileSpreadsheet, Plus, Upload, Loader2, ArrowRight,
    CheckCircle, AlertCircle, Trash2, Check,
    TableProperties, XCircle
} from "lucide-react";
import { inventoryImportAction } from "@/app/actions/erp/inventory_import";
import * as Tooltip from '@radix-ui/react-tooltip';

// ─── Interfaces ──────────────────────────────────────────────
interface SmartImportWizardProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    warehouses: any[];
}

type SizeMap = { [sizeName: string]: number };

interface ImportRow {
    id: string;
    title: string;
    sizes: SizeMap;
    total: number;
    errors?: string[];
}

// ─── Smart Header Detector ────────────────────────────────────
function detectTitleColumnIndex(headers: string[]): number {
    const idx = headers.findIndex(h => {
        const low = h.toLowerCase().trim();
        return low.includes("منتج") || low.includes("اسم") || low === "product" || low === "title" || low === "name" || low === "المنتج" || low === "اسم المنتج";
    });
    return idx !== -1 ? idx : 0;
}

function isTotalColumn(header: string): boolean {
    const low = header.toLowerCase().trim();
    return low.includes("مجموع") || low.includes("إجمالي") || low.includes("اجمالي") || low.includes("الكلي") || low === "total" || low === "sum" || low === "all";
}

// Normalize Arabic/English size names to standard display names
function normalizeSizeName(raw: string): string {
    const h = raw.trim().toUpperCase();
    // Arabic → standard
    const arabicMap: Record<string, string> = {
        "صغير جداً": "XS", "صغير جدا": "XS", "صغيرجدا": "XS", "XS مقاس": "XS",
        "صغير": "S", "صغيرة": "S", "S مقاس": "S",
        "وسط": "M", "متوسط": "M", "وسيط": "M", "M مقاس": "M",
        "كبير": "L", "كبيرة": "L", "L مقاس": "L",
        "كبير جداً": "XL", "كبير جدا": "XL", "كبيرجدا": "XL", "XL مقاس": "XL",
        "كبير جداً ٢": "XXL", "XXL مقاس": "XXL",
        "XXXL مقاس": "XXXL",
        "XXXXL مقاس": "XXXXL",
    };
    // Check Arabic map (case-insensitive key check)
    for (const [arabic, standard] of Object.entries(arabicMap)) {
        if (raw.trim() === arabic) return standard;
    }
    // Return uppercased as-is (handles XS, S, M, L, XL, XXL, etc.)
    return h;
}

export default function SmartImportWizard({ open, onClose, onSuccess, warehouses }: SmartImportWizardProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Step 1
    const [rawText, setRawText] = useState("");
    const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || "");
    const [parseError, setParseError] = useState<string | null>(null);

    // Step 2
    const [columns, setColumns] = useState<string[]>([]);
    const [rows, setRows] = useState<ImportRow[]>([]);
    const [editingCell, setEditingCell] = useState<{ rowId: string; col: string } | null>(null);
    const [editValue, setEditValue] = useState("");

    // Inline add-column UI
    const [showAddColInput, setShowAddColInput] = useState(false);
    const [newColInput, setNewColInput] = useState("");
    const newColRef = useRef<HTMLInputElement>(null);

    // Inline delete-column confirmation
    const [confirmDeleteCol, setConfirmDeleteCol] = useState<string | null>(null);

    // Step 3
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ success: boolean; message: string; logs?: string[] } | null>(null);

    useEffect(() => {
        if (open) {
            setStep(1); setRawText(""); setParseError(null);
            setColumns([]); setRows([]); setImportResult(null);
            setIsImporting(false); setShowAddColInput(false); setNewColInput("");
            setConfirmDeleteCol(null);
        }
    }, [open]);

    useEffect(() => {
        if (showAddColInput) newColRef.current?.focus();
    }, [showAddColInput]);

    // ─── Parsing ─────────────────────────────────────────────
    const handleParse = () => {
        setParseError(null);
        if (!rawText.trim()) { setParseError("يرجى لصق بعض البيانات أولاً."); return; }

        try {
            const lines = rawText.trim().split(/\r?\n/).filter(l => l.trim() !== "");
            if (lines.length < 2) {
                setParseError("يجب أن يحتوي الجدول على صف للرؤوس وصف واحد على الأقل.");
                return;
            }

            const delimiter = lines[0].includes("\t") ? "\t" : ",";
            const rawHeaders = lines[0].split(delimiter).map(h => h.trim());

            if (rawHeaders.length < 2) {
                setParseError("يجب أن يحتوي الجدول على عمود للمنتج وعمود واحد على الأقل للمقاسات.");
                return;
            }

            const titleIdx = detectTitleColumnIndex(rawHeaders);

            const sizeCols: { index: number; name: string }[] = [];
            rawHeaders.forEach((header, idx) => {
                if (idx !== titleIdx && !isTotalColumn(header)) {
                    sizeCols.push({ index: idx, name: normalizeSizeName(header) || `مقاس ${idx}` });
                }
            });

            if (sizeCols.length === 0) {
                setParseError("لم يتم العثور على أعمدة للمقاسات. تأكد من أن الجدول يحتوي على مقاسات (S, M, L ...).");
                return;
            }

            const newRows: ImportRow[] = [];
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(delimiter).map(p => p.trim());
                if (!parts.some(p => p !== "")) continue;

                const title = parts[titleIdx] || `منتج مجهول ${i}`;
                const sizes: SizeMap = {};
                let total = 0;

                sizeCols.forEach(sc => {
                    const qty = parseInt(parts[sc.index], 10);
                    const finalQty = isNaN(qty) ? 0 : qty;
                    sizes[sc.name] = finalQty;
                    total += finalQty;
                });

                newRows.push({ id: crypto.randomUUID(), title, sizes, total });
            }

            setColumns(sizeCols.map(sc => sc.name));
            setRows(newRows);
            setStep(2);
        } catch (err: any) {
            setParseError("حدث خطأ أثناء معالجة البيانات: " + err.message);
        }
    };

    // ─── Grid Editing ─────────────────────────────────────────
    const updateCell = (rowId: string, col: string, newValue: string) => {
        setRows(prev => prev.map(row => {
            if (row.id !== rowId) return row;
            if (col === "title") return { ...row, title: newValue };
            const qty = parseInt(newValue, 10);
            const finalQty = isNaN(qty) ? 0 : qty;
            const newSizes = { ...row.sizes, [col]: finalQty };
            return { ...row, sizes: newSizes, total: Object.values(newSizes).reduce((a, b) => a + b, 0) };
        }));
        setEditingCell(null);
    };

    const addRow = () => {
        const emptySizes: SizeMap = {};
        columns.forEach(c => emptySizes[c] = 0);
        setRows([{ id: crypto.randomUUID(), title: "منتج جديد", sizes: emptySizes, total: 0 }, ...rows]);
    };

    const deleteRow = (rowId: string) => setRows(rows.filter(r => r.id !== rowId));

    const confirmAddColumn = () => {
        const name = normalizeSizeName(newColInput.trim());
        if (!name || columns.includes(name)) { setShowAddColInput(false); setNewColInput(""); return; }
        setColumns([...columns, name]);
        setRows(prev => prev.map(row => ({ ...row, sizes: { ...row.sizes, [name]: 0 } })));
        setShowAddColInput(false);
        setNewColInput("");
    };

    const deleteColumn = (colName: string) => {
        setColumns(columns.filter(c => c !== colName));
        setRows(prev => prev.map(row => {
            const newSizes = { ...row.sizes };
            delete newSizes[colName];
            return { ...row, sizes: newSizes, total: Object.values(newSizes).reduce((a, b) => a + b, 0) };
        }));
        setConfirmDeleteCol(null);
    };

    // ─── Validation & Totals ──────────────────────────────────
    const isValidToProceed = useMemo(() =>
        rows.length > 0 && columns.length > 0 && selectedWarehouseId !== "" && rows.every(r => r.title.trim() !== ""),
        [rows, columns, selectedWarehouseId]
    );

    const columnTotals = useMemo(() => {
        const totals: Record<string, number> = {};
        columns.forEach(c => totals[c] = 0);
        let grandTotal = 0;
        rows.forEach(r => {
            columns.forEach(c => { totals[c] = (totals[c] || 0) + (r.sizes[c] || 0); });
            grandTotal += r.total;
        });
        return { ...totals, grandTotal };
    }, [rows, columns]);

    // ─── Import ───────────────────────────────────────────────
    const executeImport = async () => {
        if (!isValidToProceed) return;
        setIsImporting(true);
        setImportResult(null);
        try {
            const result = await inventoryImportAction({
                warehouseId: selectedWarehouseId,
                items: rows.map(r => ({ title: r.title.trim(), sizes: r.sizes })),
                columns,
            });
            setImportResult(result);
            if (result.success) setTimeout(() => onSuccess(), 2000);
        } catch (error: any) {
            setImportResult({ success: false, message: "حدث خطأ غير متوقع", logs: [error.message] });
        } finally {
            setIsImporting(false);
        }
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[color-mix(in_srgb,var(--wusha-bg)_80%,transparent)] backdrop-blur-md"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="w-full max-w-6xl rounded-3xl border border-theme-soft bg-surface shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] overflow-hidden relative"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-theme-subtle bg-theme-faint shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shadow-inner">
                                <TableProperties className="w-5 h-5 text-gold" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-theme">استيراد Excel — المخزون</h2>
                                <p className="text-xs text-theme-subtle mt-0.5">انسخ والصق بيانات منتجاتك من Excel مباشرة</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-theme-subtle transition-colors group">
                            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center justify-center gap-4 py-4 border-b border-theme-faint shrink-0 px-6">
                        {[
                            { step: 1, label: "لصق البيانات" },
                            { step: 2, label: "مراجعة الجدول" },
                            { step: 3, label: "استيراد للمستودع" }
                        ].map((s, idx) => (
                            <div key={s.step} className="flex items-center gap-4">
                                <div className={`flex items-center gap-2 ${step === s.step ? 'opacity-100' : step > s.step ? 'opacity-70 text-emerald-400' : 'opacity-40'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === s.step ? "bg-gold text-black" : step > s.step ? "bg-emerald-400 text-black" : "bg-theme-subtle text-theme-soft"}`}>
                                        {step > s.step ? <Check className="w-3 h-3" /> : s.step}
                                    </div>
                                    <span className={`text-sm font-semibold tracking-wide ${step === s.step ? "text-gold" : ""}`}>{s.label}</span>
                                </div>
                                {idx < 2 && <ArrowRight className="w-4 h-4 text-theme-faint opacity-30" />}
                            </div>
                        ))}
                    </div>

                    {/* Work Area */}
                    <div className="flex-1 overflow-y-auto bg-bg relative">
                        <AnimatePresence mode="wait">

                            {/* STEP 1: Paste */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                    className="p-8 max-w-4xl mx-auto space-y-6"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-theme mb-2">اختر المستودع الهدف</label>
                                                <select
                                                    value={selectedWarehouseId}
                                                    onChange={e => setSelectedWarehouseId(e.target.value)}
                                                    className="w-full p-3.5 bg-theme-subtle border border-theme-soft rounded-xl focus:border-gold/50 outline-none transition-all font-medium text-theme"
                                                >
                                                    {warehouses.map(w => (
                                                        <option key={w.id} value={w.id}>{w.name}</option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-theme-subtle mt-2">ستتم إضافة الكميات إلى هذا المستودع.</p>
                                            </div>

                                            <div className="p-5 rounded-2xl bg-theme-faint border border-theme-subtle space-y-3">
                                                <div className="flex items-center gap-2 text-gold font-bold">
                                                    <AlertCircle className="w-4 h-4" />
                                                    كيفية التحضير:
                                                </div>
                                                <ol className="list-decimal list-inside text-xs text-theme-soft space-y-2 leading-relaxed">
                                                    <li>افتح ملف Excel الخاص بك</li>
                                                    <li>العمود الأول (أو المسمى "المنتج") → اسم المنتج</li>
                                                    <li>الأعمدة التالية → المقاسات (S, M, L, XL أو صغير، وسط، كبير)</li>
                                                    <li>ظلل الجدول كاملاً واعمل "نسخ"</li>
                                                    <li>الصق في المربع المجاور</li>
                                                </ol>
                                            </div>
                                        </div>

                                        <div className="space-y-2 flex flex-col h-full">
                                            <label className="block text-sm font-bold text-theme">لصق البيانات من Excel</label>
                                            <textarea
                                                value={rawText}
                                                onChange={e => setRawText(e.target.value)}
                                                className="w-full flex-1 min-h-[250px] p-4 bg-theme-base/50 border border-theme-strong/20 rounded-xl focus:border-gold outline-none transition-all font-mono text-sm resize-none whitespace-pre shadow-inner placeholder:text-theme-faint"
                                                placeholder={"المنتج\tS\tM\tL\tXL\nشماغ أحمر\t10\t15\t20\t5\nتيشيرت أسود\t0\t50\t10\t0"}
                                            />
                                            {parseError && (
                                                <div className="p-3 mt-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                                    {parseError}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            onClick={handleParse}
                                            disabled={!rawText.trim() || !selectedWarehouseId}
                                            className="px-8 py-3.5 bg-gold text-black font-bold rounded-xl hover:bg-gold/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(206,174,127,0.3)] hover:shadow-[0_0_30px_rgba(206,174,127,0.5)]"
                                        >
                                            توليد الجدول ومطابقة الرؤوس <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: Grid Editor */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                    className="p-6 md:p-8 flex flex-col h-full space-y-4"
                                >
                                    {/* Grid Toolbar */}
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <button onClick={addRow} className="px-3 py-1.5 rounded-lg bg-theme-subtle border border-theme-soft text-xs font-semibold text-theme flex items-center gap-1.5 hover:bg-surface transition-colors">
                                                <Plus className="w-3.5 h-3.5" /> إضافة منتج
                                            </button>

                                            {/* Inline add-column */}
                                            {showAddColInput ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        ref={newColRef}
                                                        value={newColInput}
                                                        onChange={e => setNewColInput(e.target.value)}
                                                        onKeyDown={e => { if (e.key === "Enter") confirmAddColumn(); if (e.key === "Escape") { setShowAddColInput(false); setNewColInput(""); } }}
                                                        placeholder="مثال: XXL"
                                                        className="w-28 px-2.5 py-1.5 rounded-lg bg-theme-subtle border border-gold/30 text-xs text-theme outline-none font-mono"
                                                    />
                                                    <button onClick={confirmAddColumn} className="p-1.5 rounded-lg bg-gold/20 text-gold hover:bg-gold/30 transition-colors" title="تأكيد">
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => { setShowAddColInput(false); setNewColInput(""); }} className="p-1.5 rounded-lg text-theme-faint hover:bg-theme-subtle transition-colors" title="إلغاء">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setShowAddColInput(true)} className="px-3 py-1.5 rounded-lg bg-theme-subtle border border-theme-soft text-xs font-semibold text-theme flex items-center gap-1.5 hover:bg-surface transition-colors">
                                                    <Plus className="w-3.5 h-3.5" /> إضافة مقاس
                                                </button>
                                            )}
                                        </div>
                                        <div className="text-xs text-theme-soft bg-theme-faint px-3 py-1.5 rounded-lg border border-theme-subtle">
                                            اضغط على أي خلية لتعديلها
                                        </div>
                                    </div>

                                    {/* Delete Column Confirmation Banner */}
                                    {confirmDeleteCol && (
                                        <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            <span>هل تريد حذف مقاس <strong>"{confirmDeleteCol}"</strong> من جميع الصفوف؟</span>
                                            <div className="flex gap-2 mr-auto">
                                                <button onClick={() => deleteColumn(confirmDeleteCol)} className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors">نعم، احذف</button>
                                                <button onClick={() => setConfirmDeleteCol(null)} className="px-3 py-1 bg-theme-subtle text-theme-soft rounded-lg text-xs hover:bg-theme-faint transition-colors">إلغاء</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Grid */}
                                    <div className="rounded-2xl border border-theme-strong/20 overflow-x-auto overflow-y-auto bg-surface/80 max-h-[50vh] shadow-lg">
                                        <table className="w-full text-sm text-right whitespace-nowrap table-fixed">
                                            <thead className="bg-[#2a1c11] sticky top-0 z-10 shadow-sm">
                                                <tr>
                                                    <th className="w-12 px-4 py-3 text-center border-b border-theme-strong/20 border-l border-theme-strong/10"></th>
                                                    <th className="w-64 px-4 py-3 font-bold text-gold border-b border-theme-strong/20 border-l border-theme-strong/10">اسم المنتج</th>
                                                    {columns.map(col => (
                                                        <th key={col} className="w-24 px-4 py-3 font-bold text-theme border-b border-theme-strong/20 border-l border-theme-strong/10 group relative text-center">
                                                            {col}
                                                            <button
                                                                onClick={() => setConfirmDeleteCol(col)}
                                                                className="absolute top-1/2 -translate-y-1/2 left-2 opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-400/20 rounded transition-all"
                                                                title="حذف المقاس"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </th>
                                                    ))}
                                                    <th className="w-24 px-4 py-3 font-bold text-emerald-400 border-b border-theme-strong/20 text-center bg-emerald-950/20">المجموع</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-theme-strong/10">
                                                {rows.map((row) => (
                                                    <tr key={row.id} className="hover:bg-gold/5 transition-colors group">
                                                        <td className="px-2 py-2 text-center border-l border-theme-strong/5 bg-theme-faint/50 group-hover:bg-transparent">
                                                            <button onClick={() => deleteRow(row.id)} className="p-1.5 rounded text-theme-faint hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </td>

                                                        <Tooltip.Provider>
                                                            <Tooltip.Root>
                                                                <Tooltip.Trigger asChild>
                                                                    <td
                                                                        className="px-4 py-3 border-l border-theme-strong/5 font-medium cursor-text hover:bg-white/5 truncate max-w-xs"
                                                                        onClick={() => { setEditingCell({ rowId: row.id, col: "title" }); setEditValue(row.title); }}
                                                                    >
                                                                        {editingCell?.rowId === row.id && editingCell?.col === "title" ? (
                                                                            <input
                                                                                autoFocus
                                                                                className="w-full bg-transparent outline-none border-b border-gold text-gold"
                                                                                value={editValue}
                                                                                onChange={e => setEditValue(e.target.value)}
                                                                                onBlur={() => updateCell(row.id, "title", editValue)}
                                                                                onKeyDown={e => { if (e.key === 'Enter') updateCell(row.id, "title", editValue); if (e.key === 'Escape') setEditingCell(null); }}
                                                                            />
                                                                        ) : (
                                                                            row.title || <span className="text-red-400 italic">بدون اسم</span>
                                                                        )}
                                                                    </td>
                                                                </Tooltip.Trigger>
                                                                <Tooltip.Portal>
                                                                    <Tooltip.Content className="bg-black text-white px-2 py-1 rounded text-xs shadow-xl">
                                                                        {row.title}<Tooltip.Arrow className="fill-black" />
                                                                    </Tooltip.Content>
                                                                </Tooltip.Portal>
                                                            </Tooltip.Root>
                                                        </Tooltip.Provider>

                                                        {columns.map(col => (
                                                            <td
                                                                key={`${row.id}-${col}`}
                                                                className={`px-4 py-3 border-l border-theme-strong/5 text-center cursor-text hover:bg-white/5 font-mono ${(row.sizes[col] || 0) > 0 ? "text-gold" : "text-theme-faint"}`}
                                                                onClick={() => { setEditingCell({ rowId: row.id, col }); setEditValue(String(row.sizes[col] || 0)); }}
                                                            >
                                                                {editingCell?.rowId === row.id && editingCell?.col === col ? (
                                                                    <input
                                                                        autoFocus
                                                                        type="number"
                                                                        className="w-full bg-transparent outline-none border-b border-gold text-gold text-center font-mono"
                                                                        value={editValue}
                                                                        onChange={e => setEditValue(e.target.value)}
                                                                        onBlur={() => updateCell(row.id, col, editValue)}
                                                                        onKeyDown={e => { if (e.key === 'Enter') updateCell(row.id, col, editValue); if (e.key === 'Escape') setEditingCell(null); }}
                                                                    />
                                                                ) : (
                                                                    row.sizes[col] || 0
                                                                )}
                                                            </td>
                                                        ))}

                                                        <td className="px-4 py-3 text-center font-bold text-emerald-400 bg-emerald-950/10">
                                                            {row.total}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>

                                            {rows.length > 0 && (
                                                <tfoot className="bg-[#2a1c11] sticky bottom-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.2)]">
                                                    <tr>
                                                        <td colSpan={2} className="px-4 py-3 font-bold text-left border-l border-theme-strong/10 text-theme-subtle text-xs">
                                                            الإجمالي ({rows.length} منتج)
                                                        </td>
                                                        {columns.map(col => (
                                                            <td key={`total-${col}`} className="px-4 py-3 text-center font-bold text-gold border-l border-theme-strong/10 font-mono">
                                                                {columnTotals[col as keyof typeof columnTotals]}
                                                            </td>
                                                        ))}
                                                        <td className="px-4 py-3 text-center font-black text-emerald-400 text-lg">
                                                            {columnTotals.grandTotal}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>

                                        {rows.length === 0 && (
                                            <div className="py-12 text-center text-theme-subtle">
                                                لا توجد صفوف. قم بإضافة منتج جديد.
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center pt-2">
                                        <button onClick={() => setStep(1)} className="px-6 py-2.5 bg-theme-faint text-theme font-medium rounded-xl hover:bg-theme-subtle border border-theme-soft transition-colors">
                                            رجوع للتعديل
                                        </button>
                                        <button
                                            disabled={!isValidToProceed}
                                            onClick={() => setStep(3)}
                                            className="px-8 py-2.5 bg-gold text-black font-bold rounded-xl hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(206,174,127,0.2)] flex items-center gap-2"
                                        >
                                            التالي: تأكيد الاستيراد <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3: Execution / Results */}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-10 flex flex-col items-center justify-center min-h-[500px]"
                                >
                                    {!isImporting && !importResult ? (
                                        <div className="text-center max-w-md space-y-8">
                                            <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto border border-gold/20 shadow-[0_0_30px_rgba(206,174,127,0.15)] mb-6">
                                                <Upload className="w-10 h-10 text-gold" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-white mb-2">تأكيد استيراد البيانات</h3>
                                                <p className="text-theme-subtle leading-relaxed">
                                                    أنت على وشك استيراد <strong className="text-gold">{rows.length}</strong> منتج بمجموع <strong className="text-emerald-400">{columnTotals.grandTotal}</strong> قطعة موزعة على <strong className="text-white">{columns.length}</strong> مقاس.
                                                </p>
                                            </div>
                                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-red-200 text-right">
                                                <strong>ملاحظة هامة:</strong> سيتم إنشاء المنتجات الجديدة تلقائياً، وسيتم تحديث المخزون للمنتجات الحالية بطريقة الإضافة (وليس الاستبدال).
                                            </div>
                                            <div className="flex gap-4 justify-center pt-4">
                                                <button onClick={() => setStep(2)} className="px-6 py-3 bg-theme-faint text-theme font-medium rounded-xl hover:bg-theme-subtle transition-colors">
                                                    عودة للمراجعة
                                                </button>
                                                <button
                                                    onClick={executeImport}
                                                    className="px-10 py-3 bg-gold text-black font-bold rounded-xl hover:bg-gold/90 transition-all shadow-[0_0_20px_rgba(206,174,127,0.3)] hover:shadow-[0_0_30px_rgba(206,174,127,0.5)] flex items-center gap-2"
                                                >
                                                    استيراد الآن
                                                </button>
                                            </div>
                                        </div>
                                    ) : isImporting ? (
                                        <div className="flex flex-col items-center justify-center text-center space-y-6">
                                            <div className="relative">
                                                <div className="w-24 h-24 border-4 border-theme-subtle border-t-gold rounded-full animate-spin"></div>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Loader2 className="w-8 h-8 text-gold animate-pulse" />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white animate-pulse">جاري الاستيراد والتنفيذ...</h3>
                                                <p className="text-theme-subtle text-sm mt-2">يرجى عدم إغلاق النافذة</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-center space-y-6 w-full max-w-3xl">
                                            {importResult?.success ? (
                                                <>
                                                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/40 shadow-[0_0_40px_rgba(52,211,153,0.3)]">
                                                        <CheckCircle className="w-10 h-10 text-emerald-400" />
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-emerald-400">نجاح الاستيراد</h3>
                                                    <p className="text-theme-subtle">{importResult.message}</p>

                                                    {/* Post-import summary table */}
                                                    {rows.length > 0 && (
                                                        <div className="w-full text-right space-y-2 mt-2">
                                                            <p className="text-xs text-theme-subtle font-bold">جدول الاستيراد — ما تم رفعه للمستودع:</p>
                                                            <div className="overflow-x-auto rounded-xl border border-emerald-500/20 max-h-[260px] overflow-y-auto">
                                                                <table className="w-full text-xs text-right whitespace-nowrap">
                                                                    <thead className="bg-emerald-950/30 text-emerald-400 sticky top-0 z-10">
                                                                        <tr>
                                                                            <th className="px-3 py-2.5 font-bold text-right">المنتج</th>
                                                                            {columns.map(col => (
                                                                                <th key={col} className="px-3 py-2.5 font-bold text-center">{col}</th>
                                                                            ))}
                                                                            <th className="px-3 py-2.5 font-bold text-center text-emerald-300">المجموع</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-emerald-500/10">
                                                                        {rows.map((row) => (
                                                                            <tr key={row.id} className="hover:bg-emerald-500/5">
                                                                                <td className="px-3 py-2 font-medium text-theme text-right">{row.title}</td>
                                                                                {columns.map(col => (
                                                                                    <td key={col} className={`px-3 py-2 text-center font-mono ${(row.sizes[col] || 0) > 0 ? "text-gold" : "text-theme-faint"}`}>
                                                                                        {row.sizes[col] || 0}
                                                                                    </td>
                                                                                ))}
                                                                                <td className="px-3 py-2 text-center font-bold text-emerald-400">{row.total}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                    <tfoot className="bg-emerald-950/20 sticky bottom-0">
                                                                        <tr>
                                                                            <td className="px-3 py-2 text-xs text-emerald-400 font-bold">الإجمالي ({rows.length})</td>
                                                                            {columns.map(col => (
                                                                                <td key={col} className="px-3 py-2 text-center font-bold font-mono text-gold">
                                                                                    {columnTotals[col as keyof typeof columnTotals]}
                                                                                </td>
                                                                            ))}
                                                                            <td className="px-3 py-2 text-center font-black text-emerald-400">{columnTotals.grandTotal}</td>
                                                                        </tr>
                                                                    </tfoot>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="animate-pulse text-xs text-theme-faint">سيتم إغلاق النافذة تلقائياً...</div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/40 shadow-[0_0_40px_rgba(248,113,113,0.3)]">
                                                        <XCircle className="w-12 h-12 text-red-500" />
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-red-400">حدث خطأ</h3>
                                                    <p className="text-white bg-theme-faint px-4 py-2 rounded-lg border border-theme-subtle">{importResult?.message}</p>
                                                    {importResult?.logs && importResult.logs.length > 0 && (
                                                        <div className="w-full text-left bg-black text-red-400 p-4 rounded-xl font-mono text-xs overflow-y-auto max-h-40 border border-red-500/30">
                                                            {importResult.logs.map((log, i) => <div key={i}>{log}</div>)}
                                                        </div>
                                                    )}
                                                    <button onClick={() => setImportResult(null)} className="px-8 py-3 bg-theme-subtle text-white font-medium rounded-xl hover:bg-theme-soft mt-6">
                                                        حاول مرة أخرى
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
