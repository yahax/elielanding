"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { Check, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";

const QUESTIONS = [
    {
        id: "vibe",
        text: "أي نوع من الروائح تفضلين؟",
        options: [
            { label: "حلو وسكري", tags: ["حلو"] },
            { label: "منعش وخفيف", tags: ["منعش"] },
            { label: "خشبي وفخم", tags: ["خشبي"] }
        ]
    },
    {
        id: "intensity",
        text: "كيف تحبين قوة العطر؟",
        options: [
            { label: "خفيفة ولطيفة", tags: ["خفيفة"] },
            { label: "متوسطة", tags: ["متوسطة"] },
            { label: "قوية وفواحة", tags: ["قوية"] }
        ]
    },
    {
        id: "occasion",
        text: "متى تستخدمين العطر غالباً؟",
        options: [
            { label: "كل يوم (للعمل/الدراسة)", tags: ["يومي"] },
            { label: "للسهرات والمناسبات", tags: ["سهرة"] },
            { label: "هدية لشخص عزيز", tags: ["هدية"] }
        ]
    }
];

export function SmartQuiz() {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const { recommendByTags } = useStore();

    const handleOption = (tags: string[]) => {
        const newAnswers = [...answers, ...tags];
        if (step < QUESTIONS.length - 1) {
            setAnswers(newAnswers);
            setStep(step + 1);
        } else {
            recommendByTags(newAnswers);
            setIsOpen(false);
            setStep(0);
            setAnswers([]);
            // Scroll to builder to see the result
            document.getElementById("builder")?.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <div className="mt-12 text-center">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative px-10 py-5 rounded-2xl bg-white border-2 border-primary shadow-[0_10px_30px_-10px_rgba(198,163,78,0.3)] hover:shadow-[0_15px_40px_-10px_rgba(198,163,78,0.4)] transition-all duration-500 overflow-hidden hover:-translate-y-1"
                >
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                    <div className="relative flex items-center gap-4">
                        <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                            <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <span className="text-zinc-900 font-black text-lg tracking-tight">ساعدني في الاختيار (Quiz)</span>
                    </div>
                </button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md mx-auto p-8 rounded-[2.5rem] bg-white border-2 border-primary/20 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />

                    <div className="flex justify-between items-center mb-8">
                        <span className="text-xs text-primary font-black tracking-widest uppercase">الخطوة {step + 1} من {QUESTIONS.length}</span>
                        <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-900 font-bold transition-colors">إغلاق</button>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="text-right"
                        >
                            <h3 className="text-2xl font-black mb-8 text-zinc-900 leading-tight">{QUESTIONS[step].text}</h3>
                            <div className="space-y-4">
                                {QUESTIONS[step].options.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleOption(opt.tags)}
                                        className="w-full p-6 rounded-2xl bg-zinc-50 border-2 border-transparent hover:border-primary/50 hover:bg-white hover:shadow-lg transition-all text-right group flex items-center justify-between"
                                    >
                                        <ArrowLeft className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                        <span className="text-lg font-bold text-zinc-800">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {step > 0 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="mt-8 flex items-center gap-2 text-zinc-400 hover:text-primary font-bold transition-colors text-sm"
                        >
                            <ArrowRight className="w-4 h-4" />
                            <span>العودة للخطوة السابقة</span>
                        </button>
                    )}
                </motion.div>
            )}
        </div>
    );
}
