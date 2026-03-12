"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, ArrowRight, ArrowLeft, CheckCircle, AlertTriangle, FileSpreadsheet, Loader2 } from "lucide-react";
import Papa from "papaparse";
import { processSmartImport } from "@/app/actions/erp/inventory-import";

interface SmartImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type Step = "upload" | "mapping" | "preview" | "importing" | "success" | "error";

interface MappedColumn {
    header: string; // Header from CSV
    dbField: string | null; // e.g. "title", "sku", "price", "size_xs", "size_s" ... or null if ignoring
}

export function SmartImportModal({ isOpen, onClose, onSuccess }: SmartImportModalProps) {
    const [step, setStep] = useState<Step>("upload");
    const [fileOptions, setFileOptions] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mappedColumns, setMappedColumns] = useState<MappedColumn[]>([]);
    const [importResult, setImportResult] = useState<{ success: number; errors: number; log: string[] } | null>(null);
    
    // Valid mapping targets
    const dbFields = [
        { id: "ignore", label: "تجاهل هذا العمود" },
        { id: "title", label: "اسم المنتج (المنتج)" },
        { id: "type", label: "نوع المنتج (apparel/print/nft/etc)" },
        { id: "price", label: "السعر الأساسي" },
        { id: "store", label: "اسم المتجر" },
        { id: "size_xs", label: "مخزون مقاس (XS)" },
        { id: "size_s", label: "مخزون مقاس (S)" },
        { id: "size_m", label: "مخزون مقاس (M)" },
        { id: "size_l", label: "مخزون مقاس (L)" },
        { id: "size_xl", label: "مخزون مقاس (XL)" },
        { id: "size_xxl", label: "مخزون مقاس (XXL)" },
        { id: "size_xxxl", label: "مخزون مقاس (XXXL)" },
        { id: "size_xxxxl", label: "مخزون مقاس (XXXXL)" },
        { id: "total", label: "المجموع (مخزون عام كلي)" }, // if non-apparel
    ];

    const fileInputRef = useRef<HTMLInputElement>(null);

    const reset = () => {
        setStep("upload");
        setFileOptions(null);
        setParsedData([]);
        setHeaders([]);
        setMappedColumns([]);
        setImportResult(null);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileOptions(file);
        
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data as any[];
                if (data.length > 0) {
                    const extractedHeaders = Object.keys(data[0]);
                    setHeaders(extractedHeaders);
                    
                    // Auto-mapping attempt
                    const autoMapped = extractedHeaders.map(header => {
                        let matchedDbField: string | null = "ignore";
                        const hlower = header.toLowerCase();
                        if (hlower.includes("منتج") || hlower.includes("title") || hlower.includes("name")) matchedDbField = "title";
                        else if (hlower === "xs") matchedDbField = "size_xs";
                        else if (hlower === "s") matchedDbField = "size_s";
                        else if (hlower === "m") matchedDbField = "size_m";
                        else if (hlower === "l") matchedDbField = "size_l";
                        else if (hlower === "xl") matchedDbField = "size_xl";
                        else if (hlower === "xxl") matchedDbField = "size_xxl";
                        else if (hlower === "xxxl") matchedDbField = "size_xxxl";
                        else if (hlower === "xxxxl") matchedDbField = "size_xxxxl";
                        else if (hlower.includes("سعر") || hlower.includes("price")) matchedDbField = "price";
                        else if (hlower.includes("مجموع") || hlower.includes("total")) matchedDbField = "total";
                        
                        return { header, dbField: matchedDbField };
                    });
                    
                    setMappedColumns(autoMapped);
                    setParsedData(data);
                    setStep("mapping");
                }
            },
            error: (error) => {
                alert("حدث خطأ أثناء قراءة الملف. يرجى التأكد من أنه ملف CSV صالح.");
                console.error(error);
            }
        });
    };

    const executeImport = async () => {
        setStep("importing");
        
        try {
            // Reconstruct data based on mappings
            const payload = parsedData.map(row => {
                const constructedObj: any = {};
                mappedColumns.forEach(map => {
                    if (map.dbField && map.dbField !== "ignore") {
                        constructedObj[map.dbField] = row[map.header];
                    }
                });
                return constructedObj;
            });

            // Need to make sure title exists AT LEAST
            const validPayload = payload.filter(p => !!p.title);

            if (validPayload.length === 0) {
                setStep("error");
                setImportResult({ success: 0, errors: payload.length, log: ["لم يتم العثور على حقل (المنتج) في المدخلات. إنه إلزامي."] });
                return;
            }

            const result = await processSmartImport(validPayload);
            
            if (result.success) {
                setImportResult({
                    success: result.insertedCount || validPayload.length,
                    errors: result.errors?.length || 0,
                    log: result.errors || [],
                });
                setStep(result.errors && result.errors.length > 0 ? "error" : "success");
            } else {
                setStep("error");
                setImportResult({ success: 0, errors: validPayload.length, log: [result.error || "توقف غير متوقع"] });
            }

        } catch (error: any) {
            setStep("error");
            setImportResult({ success: 0, errors: 1, log: [error.message] });
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-[color-mix(in_srgb,var(--wusha-bg)_80%,transparent)] backdrop-blur-md p-4"
                dir="rtl"
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="bg-theme-surface border border-theme-soft rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-theme-faint bg-theme-bg">
                        <div>
                            <h2 className="text-2xl font-black text-theme">الاستيراد الذكي</h2>
                            <p className="text-theme-subtle text-sm">استيراد منتجات ومقاسات بالجملة عبر جداول CSV</p>
                        </div>
                        <button onClick={handleClose} className="p-2 hover:bg-theme-faint rounded-full transition-colors text-theme-subtle">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-wusha">
                        
                        {/* ────── STEP 1: UPLOAD ────── */}
                        {step === "upload" && (
                            <div className="h-full flex flex-col items-center justify-center py-20">
                                <FileSpreadsheet className="w-20 h-20 text-wusha-gold mb-6 opacity-50" />
                                <h3 className="text-2xl font-bold text-theme mb-2">ارفع جدول المنتجات</h3>
                                <p className="text-theme-subtle max-w-md text-center mb-8">
                                    قم برفع ملف من نوع CSV يحتوي على قائمة المنتجات وتوزيع المقاسات. 
                                    سيتم قراءة الرؤوس تلقائياً.
                                </p>
                                
                                <input 
                                    type="file" 
                                    accept=".csv"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden" 
                                />
                                
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-8 py-4 bg-wusha-gold text-wusha-black rounded-xl font-bold hover:bg-yellow-500 transition-colors flex items-center gap-3 shadow-[0_10px_30px_-10px_rgba(202,160,82,0.4)]"
                                >
                                    <Upload className="w-5 h-5" />
                                    اختيار ملف CSV
                                </button>
                            </div>
                        )}

                        {/* ────── STEP 2: MAPPING ────── */}
                        {step === "mapping" && (
                            <div className="space-y-6">
                                <div className="bg-wusha-gold/10 border border-wusha-gold/20 p-4 rounded-xl flex items-start gap-4 text-wusha-gold">
                                    <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-1" />
                                    <div>
                                        <h4 className="font-bold">مطابقة الأعمدة</h4>
                                        <p className="text-sm opacity-80 mt-1">
                                            لقد وجدنا {headers.length} أعمده في الجدول. يرجى تأكيد إلى ماذا يرمز كل عمود في قاعدة البيانات. 
                                            إذا كان العمود غير مهم، اختر "تجاهل".
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {mappedColumns.map((col, index) => (
                                        <div key={index} className="bg-theme-bg p-4 rounded-xl border border-theme-faint">
                                            <p className="text-xs text-theme-subtle font-mono mb-1">عمود الجدول:</p>
                                            <p className="font-bold text-theme text-lg mb-3 truncate" title={col.header}>{col.header}</p>
                                            
                                            <p className="text-xs wusha-gold mb-1">يُسجل في قاعدة البيانات كـ:</p>
                                            <select 
                                                value={col.dbField || "ignore"}
                                                onChange={(e) => {
                                                    const newMappings = [...mappedColumns];
                                                    newMappings[index].dbField = e.target.value;
                                                    setMappedColumns(newMappings);
                                                }}
                                                className="w-full bg-theme-surface border border-theme-soft rounded-lg px-3 py-2 text-sm text-theme focus:ring-1 focus:ring-wusha-gold outline-none"
                                            >
                                                {dbFields.map(field => (
                                                    <option key={field.id} value={field.id}>{field.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ────── STEP 3: PREVIEW ────── */}
                        {step === "preview" && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-theme mb-4">نظرة عامة على البيانات</h3>
                                <p className="text-theme-subtle text-sm mb-4">يُرجى مراجعة أول 5 صفوف للتأكد من سلامة المطابقة قبل الاعتماد النهائي.</p>

                                <div className="overflow-x-auto rounded-xl border border-theme-faint">
                                    <table className="w-full text-sm text-right">
                                        <thead className="bg-theme-faint text-theme-soft font-bold text-xs uppercase">
                                            <tr>
                                                {mappedColumns.filter(m => m.dbField !== "ignore").map(m => (
                                                    <th key={m.header} className="px-4 py-3 border-b border-theme-soft/50">
                                                        {dbFields.find(db => db.id === m.dbField)?.label || m.dbField}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-theme-faint text-theme bg-theme-bg">
                                            {parsedData.slice(0, 5).map((row, rIdx) => (
                                                <tr key={rIdx} className="hover:bg-theme-faint/30">
                                                    {mappedColumns.filter(m => m.dbField !== "ignore").map(m => (
                                                        <td key={m.header} className="px-4 py-3 truncate max-w-[200px]" title={row[m.header]}>
                                                            {row[m.header] || <span className="text-theme-faint italic">-</span>}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <p className="text-xs text-theme-subtle text-center">يتم عرض أول 5 من أصل {parsedData.length} منتج للإطلاع فقط.</p>
                            </div>
                        )}

                        {/* ────── IMPORTING ────── */}
                        {step === "importing" && (
                            <div className="h-full flex flex-col items-center justify-center py-20 space-y-4">
                                <Loader2 className="w-16 h-16 text-wusha-gold animate-spin" />
                                <h3 className="text-xl font-bold text-theme">جاري معالجة الاستيراد...</h3>
                                <p className="text-theme-subtle">الرجاء عدم إغلاق هذه النافذة حتى الانتهاء.</p>
                            </div>
                        )}

                        {/* ────── RESULTS (Success/Error) ────── */}
                        {(step === "success" || step === "error") && importResult && (
                            <div className="h-full flex flex-col items-center justify-center py-10 space-y-6">
                                {step === "success" ? (
                                    <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-12 h-12 text-green-500" />
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center">
                                        <AlertTriangle className="w-12 h-12 text-red-500" />
                                    </div>
                                )}
                                
                                <div className="text-center">
                                    <h3 className="text-2xl font-black text-theme mb-2">
                                        {step === "success" ? "تم الاستيراد بنجاح!" : "تنبيه: تم الاستيراد مع وجود أخطاء"}
                                    </h3>
                                    <div className="flex items-center justify-center gap-6 mt-4 opacity-80">
                                        <div className="text-green-400 font-mono text-lg">{importResult.success} <span className="text-sm font-sans">ناجح</span></div>
                                        <div className="text-red-400 font-mono text-lg">{importResult.errors} <span className="text-sm font-sans">أخطاء تجوهلت</span></div>
                                    </div>
                                </div>

                                {importResult.log && importResult.log.length > 0 && (
                                    <div className="w-full max-w-2xl bg-red-500/5 border border-red-500/20 rounded-xl p-4 mt-6 max-h-[150px] overflow-y-auto font-mono text-xs text-theme-subtle text-left dir-ltr">
                                        {importResult.log.map((log, i) => <div key={i}>{log}</div>)}
                                    </div>
                                )}

                                <button 
                                    onClick={() => {
                                        onSuccess();
                                        onClose();
                                    }}
                                    className="btn-gold mt-6 px-10 py-3 rounded-full font-bold"
                                >
                                    إغلاق وتحديث اللوحة
                                </button>
                            </div>
                        )}
                        
                    </div>

                    {/* Footer Nav */}
                    {(step === "mapping" || step === "preview") && (
                        <div className="p-6 border-t border-theme-faint bg-theme-bg flex justify-between">
                            <button 
                                onClick={() => setStep(step === "preview" ? "mapping" : "upload")}
                                className="px-6 py-2.5 rounded-xl font-bold text-theme-subtle hover:bg-theme-faint transition-colors"
                            >
                                رجوع
                            </button>

                            {step === "mapping" ? (
                                <button 
                                    onClick={() => setStep("preview")}
                                    className="px-6 py-2.5 bg-theme-faint text-theme rounded-xl font-bold hover:bg-theme-soft transition-colors flex items-center gap-2"
                                >
                                    مراجعة ومعاينة <ArrowLeft className="w-4 h-4" />
                                </button>
                            ) : (
                                <button 
                                    onClick={executeImport}
                                    className="px-8 py-2.5 bg-wusha-gold text-wusha-black rounded-xl font-bold hover:bg-yellow-500 transition-colors shadow-lg shadow-wusha-gold/20"
                                >
                                    تأكيد وبدء الاستيراد
                                </button>
                            )}
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
