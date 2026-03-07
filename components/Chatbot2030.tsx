"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { MessageCircle, X, Sparkles, Send, Gift, Truck } from "lucide-react";

export function Chatbot2030() {
    const [isOpen, setIsOpen] = useState(false);
    const [showBubble, setShowBubble] = useState(false);
    const { suggestBundle, setDrawerOpen } = useStore();

    useEffect(() => {
        const timer = setTimeout(() => setShowBubble(true), 5000);
        return () => clearTimeout(timer);
    }, []);

    const actions = [
        { label: "اقترح عليّ 6 عطور", action: () => { suggestBundle(); setIsOpen(false); document.getElementById("perfumes")?.scrollIntoView({ behavior: "smooth" }); } },
        { label: "مدة التوصيل؟", response: "التوصيل يتم في أقل من 24 ساعة في الدار البيضاء، و 48 ساعة في باقي مدن المغرب. التوصيل مجاني!" },
        { label: "الدفع عند الاستلام؟", response: "نعم، الدفع يتم كاش عند استلام طلبيتك وفحصها. ثقة متبادلة!" },
        { label: "اطلب الآن عبر واتساب", action: () => { setDrawerOpen(true); setIsOpen(false); } }
    ];

    const [currentResponse, setCurrentResponse] = useState<string | null>(null);

    return (
        <div className="fixed bottom-24 right-6 z-[150] flex flex-col items-end gap-4 pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-[320px] glass rounded-3xl border border-primary/30 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto"
                    >
                        <div className="bg-primary p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold leading-none">مساعد ELIE</h4>
                                    <span className="text-[10px] font-bold opacity-60 uppercase tracking-tighter">Disponible 2030</span>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto bg-black/40">
                            <div className="bg-white/5 p-4 rounded-2xl rounded-tr-none text-right text-sm leading-relaxed">
                                {currentResponse || "مرحباً بك! أنا هنا لمساعدتك في اختيار أفضل العطور لرمضان. كيف يمكنني خدمتك؟"}
                            </div>

                            <div className="flex flex-col gap-2">
                                {actions.map((act, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            if (act.action) act.action();
                                            if (act.response) setCurrentResponse(act.response);
                                        }}
                                        className="p-3 rounded-xl border border-white/10 glass hover:border-primary/50 text-right text-xs font-bold transition-all hover:bg-primary/5 flex flex-row-reverse items-center justify-between group"
                                    >
                                        <Send className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2" />
                                        <span>{act.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 border-t border-white/5 flex items-center justify-center gap-6 opacity-30">
                            <Truck className="w-4 h-4" />
                            <Gift className="w-4 h-4" />
                            <Sparkles className="w-4 h-4" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative pointer-events-auto">
                <AnimatePresence>
                    {showBubble && !isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: 20 }}
                            className="absolute bottom-full right-0 mb-4 whitespace-nowrap px-6 py-3 rounded-2xl glass border border-primary/30 text-primary font-bold text-sm shadow-xl hidden md:flex items-center gap-3 cursor-pointer group"
                            onClick={() => setIsOpen(true)}
                        >
                            <span>أحتاج مساعدة في الاختيار؟</span>
                            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative group ${isOpen
                        ? "bg-white text-black rotate-90"
                        : "bg-primary text-white md:primary-gradient"
                        }`}
                >
                    <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20 group-hover:opacity-40" />
                    {isOpen ? <X className="w-6 h-6 md:w-8 md:h-8" /> : (
                        <div className="relative">
                            <MessageCircle className="w-6 h-6 md:w-8 md:h-8" />
                            {/* Mobile Tooltip indicator */}
                            {!isOpen && (
                                <div className="md:hidden absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-primary animate-bounce" />
                            )}
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
}
