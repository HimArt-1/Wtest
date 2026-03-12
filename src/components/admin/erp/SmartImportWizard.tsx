"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, FileSpreadsheet, Plus, Upload, Loader2, ArrowRight,
    CheckCircle, AlertCircle, Edit2, Trash2, Check,
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
    id: string; // Internal uniquely generated ID for UI handling
    title: string;
    sizes: SizeMap;
    total: number; // Auto-calculated sum of sizes
    errors?: string[];
}

export default function SmartImportWizard({ open, onClose, onSuccess, warehouses }: SmartImportWizardProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    
    // Step 1 State: Raw Text (Paste from Excel) & Warehouse
    const [rawText, setRawText] = useState("");
    const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || "");
    const [parseError, setParseError] = useState<string | null>(null);

    // Step 2 State: The parsed interactive Grid
    const [columns, setColumns] = useState<string[]>([]); // Array of size names e.g., ["XS", "S", "M"]
    const [rows, setRows] = useState<ImportRow[]>([]);
    const [editingCell, setEditingCell] = useState<{rowId: string, col: string} | null>(null);
    const [editValue, setEditValue] = useState("");

    // Step 3 State: Import execution
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ success: boolean; message: string; logs?: string[] } | null>(null);

    // Reset wizard when opened
    useEffect(() => {
        if (open) {
            setStep(1);
            setRawText("");
            setParseError(null);
            setColumns([]);
            setRows([]);
            setImportResult(null);
            setIsImporting(false);
        }
    }, [open]);


    // ─── Parsing Logic (Excel Copied Data -> Grid) ───────────────
    const handleParse = () => {
        setParseError(null);
        if (!rawText.trim()) {
            setParseError("يرجى لصق بعض البيانات أولاً.");
            return;
        }

        try {
            // Split by lines (handling \r\n or \n)
            const lines = rawText.trim().split(/\r?\n/).filter(line => line.trim() !== "");
            
            if (lines.length < 2) {
                setParseError("يجب أن يحتوي الجدول على صف للرؤوس وصف واحد على الأقل للبيانات.");
                return;
            }

            // Parse headers
            // Split by Tab (Excel default) or comma (CSV loosely)
            const delimiter = lines[0].includes("\t") ? "\t" : ",";
            const rawHeaders = lines[0].split(delimiter).map(h => h.trim());

            if (rawHeaders.length < 2) {
                setParseError("يجب أن يحتوي الجدول على عمود 'المنتج' وعمود واحد على الأقل للمقاسات.");
                return;
            }

            // Identify special columns
            const titleColIndex = rawHeaders.findIndex(h => h.includes("منتج") || h.toLowerCase() === "product" || h.toLowerCase() === "title");
            
            if (titleColIndex === -1 && rawHeaders.length > 0) {
                 // Assume first column is title if not explicitly named
                 // But we'll use 0 as the title index
            }
            
            const actualTitleIndex = titleColIndex !== -1 ? titleColIndex : 0;
            
            // Collect size columns (everything except Title and explicitly named "المجموع" / "Total")
            const sizeCollIndices: { index: number; name: string }[] = [];
            rawHeaders.forEach((header, idx) => {
                if (idx !== actualTitleIndex && !header.includes("مجموع") && !header.toLowerCase().includes("total")) {
                    // It's a size column
                    sizeCollIndices.push({ index: idx, name: header || `Size ${idx}` });
                }
            });

            if (sizeCollIndices.length === 0) {
                setParseError("لم يتم العثور على أعمدة للمقاسات.");
                return;
            }

            // Parse rows
            const newRows: ImportRow[] = [];
            
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(delimiter).map(p => p.trim());
                if (parts.length === 0 || !parts.some(p => p !== "")) continue; // Skip totally empty rows

                const title = parts[actualTitleIndex] || `منتج مجهول ${i}`;
                const sizes: SizeMap = {};
                let total = 0;

                sizeCollIndices.forEach(sc => {
                    const val = parts[sc.index];
                    // Parse integer, default to 0 if invalid/empty
                    const qty = parseInt(val, 10);
                    const finalQty = isNaN(qty) ? 0 : qty;
                    sizes[sc.name] = finalQty;
                    total += finalQty;
                });

                newRows.push({
                    id: crypto.randomUUID(),
                    title,
                    sizes,
                    total
                });
            }

            // Set state
            setColumns(sizeCollIndices.map(sc => sc.name));
            setRows(newRows);
            setStep(2);

        } catch (err: any) {
            setParseError("حدث خطأ أثناء معالجة البيانات: " + err.message);
        }
    };


    // ─── Grid Editing Logic ──────────────────────────────────────
    const updateCell = (rowId: string, col: string, newValue: string) => {
        setRows(prevRows => prevRows.map(row => {
            if (row.id !== rowId) return row;

            if (col === "title") {
                return { ...row, title: newValue };
            } else {
                // It's a size column
                const qty = parseInt(newValue, 10);
                const finalQty = isNaN(qty) ? 0 : qty;
                const newSizes = { ...row.sizes, [col]: finalQty };
                
                // Recalculate total for this row
                const newTotal = Object.values(newSizes).reduce((acc, curr) => acc + curr, 0);
                
                return { ...row, sizes: newSizes, total: newTotal };
            }
        }));
        setEditingCell(null);
    };

    const addRow = () => {
        const emptySizes: SizeMap = {};
        columns.forEach(c => emptySizes[c] = 0);
        
        const newRow: ImportRow = {
            id: crypto.randomUUID(),
            title: "منتج جديد",
            sizes: emptySizes,
            total: 0
        };
        setRows([newRow, ...rows]);
    };

    const deleteRow = (rowId: string) => {
        setRows(rows.filter(r => r.id !== rowId));
    };

    const addColumn = () => {
        const newColName = prompt("أدخل اسم المقاس الجديد (مثال: XXL):");
        if (!newColName || !newColName.trim() || columns.includes(newColName.trim())) return;
        
        const safeName = newColName.trim();
        setColumns([...columns, safeName]);
        
        // Add this size to all rows with default value 0
        setRows(prevRows => prevRows.map(row => ({
            ...row,
            sizes: { ...row.sizes, [safeName]: 0 }
        })));
    };

    const deleteColumn = (colName: string) => {
        if (!confirm(`هل أنت متأكد من حذف مقاس "${colName}" بالكامل؟`)) return;
        
        setColumns(columns.filter(c => c !== colName));
        
        setRows(prevRows => prevRows.map(row => {
            const newSizes = { ...row.sizes };
            delete newSizes[colName];
            
            const newTotal = Object.values(newSizes).reduce((acc, curr) => acc + curr, 0);
            return { ...row, sizes: newSizes, total: newTotal };
        }));
    };

    // Table Validation
    const isValidToProceed = useMemo(() => {
        return rows.length > 0 && 
               columns.length > 0 && 
               selectedWarehouseId !== "" &&
               rows.every(r => r.title.trim() !== "");
    }, [rows, columns, selectedWarehouseId]);

    // Totals per column
    const columnTotals = useMemo(() => {
        const totals: Record<string, number> = {};
        columns.forEach(c => totals[c] = 0);
        let grandTotal = 0;

        rows.forEach(r => {
            columns.forEach(c => {
                totals[c] += (r.sizes[c] || 0);
            });
            grandTotal += r.total;
        });

        return { ...totals, grandTotal };
    }, [rows, columns]);


    // ─── Import Execution ──────────────────────────────────────
    const executeImport = async () => {
        if (!isValidToProceed) return;
        
        setIsImporting(true);
        setImportResult(null);

        // Sanitize payload
        const payload = rows.map(r => ({
            title: r.title.trim(),
            sizes: r.sizes
        }));

        try {
            const result = await inventoryImportAction({
                warehouseId: selectedWarehouseId,
                items: payload,
                columns: columns
            });

            setImportResult(result);
            if (result.success) {
                // Short delay then close
                setTimeout(() => {
                    onSuccess();
                }, 2000);
            }
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
                                <h2 className="text-xl font-bold tracking-tight text-theme">الاستيراد الذكي للمخزون</h2>
                                <p className="text-xs text-theme-subtle mt-0.5">انسخ والصق بيانات منتجاتك من Excel مباشرة</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-theme-subtle transition-colors group">
                            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>

                    {/* Stepper Wizard Indicator */}
                    <div className="flex items-center justify-center gap-4 py-4 border-b border-theme-faint shrink-0 px-6">
                        {[
                            { step: 1, label: "لصق البيانات" },
                            { step: 2, label: "مراجعة الجدول" },
                            { step: 3, label: "استيراد للمستودع" }
                        ].map((s, idx) => (
                            <div key={s.step} className="flex items-center gap-4">
                                <div className={`flex items-center gap-2 ${step === s.step ? 'opacity-100' : step > s.step ? 'opacity-70 text-emerald-400' : 'opacity-40'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                        step === s.step ? "bg-gold text-black" : 
                                        step > s.step ? "bg-emerald-400 text-black" : "bg-theme-subtle text-theme-soft"
                                    }`}>
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

                        {/* STEP 1: Paste Input */}
                        <AnimatePresence mode="wait">
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
                                                <p className="text-xs text-theme-subtle mt-2">ستتم إضافة الكميات الممررة إلى هذا المستودع.</p>
                                            </div>

                                            <div className="p-5 rounded-2xl bg-theme-faint border border-theme-subtle space-y-3">
                                                <div className="flex items-center gap-2 text-gold font-bold">
                                                    <AlertCircle className="w-4 h-4" />
                                                    كيفية التحضير:
                                                </div>
                                                <ol className="list-decimal list-inside text-xs text-theme-soft space-y-2 leading-relaxed">
                                                    <li>افتح ملف Excel الخاص بك</li>
                                                    <li>يجب أن يحتوي العمود الأول (أو أي عمود مسمى المنتج) على أسم المنتج</li>
                                                    <li>الأعمدة التالية تمثل المقاسات (مثال: S, M, L, XL)</li>
                                                    <li>ظلل الجدول كامل واعمل "نسخ"</li>
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
                                                placeholder="المنتج&#9;S&#9;M&#9;L&#9;XL&#10;شماغ أحمر&#9;10&#9;15&#9;20&#9;5&#10;تيشيرت أسود&#9;0&#9;50&#9;10&#9;0"
                                            ></textarea>
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

                            {/* STEP 2: Interactive Grid Editor */}
                            {step === 2 && (
                                <motion.div 
                                    key="step2"
                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                    className="p-6 md:p-8 flex flex-col h-full space-y-4"
                                >
                                    {/* Grid Toolbar */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <button onClick={addRow} className="px-3 py-1.5 rounded-lg bg-theme-subtle border border-theme-soft text-xs font-semibold text-theme flex items-center gap-1.5 hover:bg-surface transition-colors">
                                                <Plus className="w-3.5 h-3.5" /> إضافة منتج
                                            </button>
                                            <button onClick={addColumn} className="px-3 py-1.5 rounded-lg bg-theme-subtle border border-theme-soft text-xs font-semibold text-theme flex items-center gap-1.5 hover:bg-surface transition-colors">
                                                <Plus className="w-3.5 h-3.5" /> إضافة مقاس
                                            </button>
                                        </div>
                                        <div className="text-xs text-theme-soft bg-theme-faint px-3 py-1.5 rounded-lg border border-theme-subtle">
                                            اضغط على أي خلية لتعديلها
                                        </div>
                                    </div>

                                    {/* The Unified Grid */}
                                    <div className="rounded-2xl border border-theme-strong/20 overflow-x-auto overflow-y-auto bg-surface/80 max-h-[50vh] shadow-lg styling-scroll">
                                        <table className="w-full text-sm text-right whitespace-nowrap table-fixed">
                                            <thead className="bg-[#2a1c11] sticky top-0 z-10 shadow-sm">
                                                <tr>
                                                    <th className="w-12 px-4 py-3 text-center border-b border-theme-strong/20 border-l border-theme-strong/10"></th>
                                                    <th className="w-64 px-4 py-3 font-bold text-gold border-b border-theme-strong/20 border-l border-theme-strong/10">اسم المنتج / Identifier</th>
                                                    
                                                    {columns.map(col => (
                                                        <th key={col} className="w-24 px-4 py-3 font-bold text-theme border-b border-theme-strong/20 border-l border-theme-strong/10 group relative text-center">
                                                            {col}
                                                            <button 
                                                                onClick={() => deleteColumn(col)}
                                                                className="absolute top-1/2 -translate-y-1/2 left-2 opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-400/20 rounded transition-all"
                                                                title="حذف العمود"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </th>
                                                    ))}
                                                    <th className="w-24 px-4 py-3 font-bold text-emerald-400 border-b border-theme-strong/20 text-center bg-emerald-950/20">المجموع</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-theme-strong/10">
                                                {rows.map((row, rIdx) => (
                                                    <tr key={row.id} className="hover:bg-gold/5 transition-colors group">
                                                        {/* Actions */}
                                                        <td className="px-2 py-2 text-center border-l border-theme-strong/5 bg-theme-faint/50 group-hover:bg-transparent">
                                                            <button 
                                                                onClick={() => deleteRow(row.id)}
                                                                className="p-1.5 rounded text-theme-faint hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </td>

                                                        {/* Title */}
                                                        <Tooltip.Provider>
                                                            <Tooltip.Root>
                                                                <Tooltip.Trigger asChild>
                                                                    <td 
                                                                        className="px-4 py-3 border-l border-theme-strong/5 font-medium cursor-text hover:bg-white/5 truncate max-w-xs"
                                                                        onClick={() => { setEditingCell({rowId: row.id, col: "title"}); setEditValue(row.title); }}
                                                                    >
                                                                        {editingCell?.rowId === row.id && editingCell?.col === "title" ? (
                                                                            <input 
                                                                                autoFocus
                                                                                className="w-full bg-transparent outline-none border-b border-gold text-gold"
                                                                                value={editValue}
                                                                                onChange={e => setEditValue(e.target.value)}
                                                                                onBlur={() => updateCell(row.id, "title", editValue)}
                                                                                onKeyDown={e => { if(e.key==='Enter') updateCell(row.id, "title", editValue); if(e.key==='Escape') setEditingCell(null); }}
                                                                            />
                                                                        ) : (
                                                                            row.title || <span className="text-red-400 italic">بدون اسم</span>
                                                                        )}
                                                                    </td>
                                                                </Tooltip.Trigger>
                                                                <Tooltip.Portal>
                                                                  <Tooltip.Content className="bg-black text-white px-2 py-1 rounded text-xs shadow-xl">{row.title}<Tooltip.Arrow className="fill-black"/></Tooltip.Content>
                                                                </Tooltip.Portal>
                                                            </Tooltip.Root>
                                                        </Tooltip.Provider>

                                                        {/* Sizes */}
                                                        {columns.map(col => (
                                                            <td 
                                                                key={`${row.id}-${col}`}
                                                                className={`px-4 py-3 border-l border-theme-strong/5 text-center cursor-text hover:bg-white/5 font-mono ${row.sizes[col] > 0 ? "text-gold" : "text-theme-faint"}`}
                                                                onClick={() => { setEditingCell({rowId: row.id, col}); setEditValue(String(row.sizes[col] || 0)); }}
                                                            >
                                                                {editingCell?.rowId === row.id && editingCell?.col === col ? (
                                                                    <input 
                                                                        autoFocus
                                                                        type="number"
                                                                        className="w-full bg-transparent outline-none border-b border-gold text-gold text-center font-mono"
                                                                        value={editValue}
                                                                        onChange={e => setEditValue(e.target.value)}
                                                                        onBlur={() => updateCell(row.id, col, editValue)}
                                                                        onKeyDown={e => { if(e.key==='Enter') updateCell(row.id, col, editValue); if(e.key==='Escape') setEditingCell(null); }}
                                                                    />
                                                                ) : (
                                                                    row.sizes[col] || 0
                                                                )}
                                                            </td>
                                                        ))}

                                                        {/* Total row */}
                                                        <td className="px-4 py-3 text-center font-bold text-emerald-400 bg-emerald-950/10">
                                                            {row.total}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            
                                            {/* Grand Totals Footer */}
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
                                        <button 
                                            onClick={() => setStep(1)}
                                            className="px-6 py-2.5 bg-theme-faint text-theme font-medium rounded-xl hover:bg-theme-subtle border border-theme-soft transition-colors"
                                        >
                                            رجوع للتعديل
                                        </button>
                                        <button 
                                            disabled={!isValidToProceed}
                                            onClick={() => setStep(3)}
                                            className="px-8 py-2.5 bg-gold text-black font-bold rounded-xl hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(206,174,127,0.2)] flex items-center gap-2"
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
                                                    أنت على وشك استيراد <strong className="text-gold">{rows.length}</strong> منتج مع مجموع <strong className="text-emerald-400">{columnTotals.grandTotal}</strong> قطعة موزعة على <strong className="text-white">{columns.length}</strong> مقاس، ليتم تخزينها في المستودع المحدد.
                                                </p>
                                            </div>
                                            
                                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-red-200 text-right">
                                                <strong>ملاحظة هامة:</strong> سيتم إنشاء المنتجات الجديدة التي لم يسبق إضافتها، وسيتم تحديث كميات المخزون للرموز (SKUs) الحالية بطريقة (إضافة للكمية الحالية) ولن يتم استبدالها.
                                            </div>

                                            <div className="flex gap-4 justify-center pt-4">
                                                <button 
                                                    onClick={() => setStep(2)}
                                                    className="px-6 py-3 bg-theme-faint text-theme font-medium rounded-xl hover:bg-theme-subtle transition-colors"
                                                >
                                                    عودة للمراجعة
                                                </button>
                                                <button 
                                                    onClick={executeImport}
                                                    className="px-10 py-3 bg-gold text-black font-bold rounded-xl hover:bg-gold-light transition-all shadow-[0_0_20px_rgba(206,174,127,0.3)] hover:shadow-[0_0_30px_rgba(206,174,127,0.5)] flex items-center gap-2"
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
                                                <p className="text-theme-subtle text-sm mt-2">يرجى عدم إغلاق النافذة، هذه العملية قد تستغرق بضع ثوانٍ</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-lg">
                                            {importResult?.success ? (
                                                <>
                                                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/40 shadow-[0_0_40px_rgba(52,211,153,0.3)]">
                                                        <CheckCircle className="w-12 h-12 text-emerald-400" />
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-emerald-400">نجاح الاستيراد</h3>
                                                    <p className="text-theme-subtle">{importResult.message}</p>
                                                    <div className="mt-4 animate-pulse text-xs text-theme-faint">
                                                        سيتم إغلاق النافذة تلقائياً...
                                                    </div>
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
                                                    <button 
                                                        onClick={() => setImportResult(null)}
                                                        className="px-8 py-3 bg-theme-subtle text-white font-medium rounded-xl hover:bg-theme-soft mt-6"
                                                    >
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
