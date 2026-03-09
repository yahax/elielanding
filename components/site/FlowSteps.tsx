"use client";

import { useI18n } from "@/hooks/useI18n";

type FlowStepsProps = {
    current: 1 | 2 | 3;
};

export function FlowSteps({ current }: FlowStepsProps) {
    const { dir, language } = useI18n();

    const steps = language === "ar"
        ? [
            { id: 1, label: "اختيار العطور" },
            { id: 2, label: "اختيار الهدية" },
            { id: 3, label: "تأكيد الطلب" },
        ]
        : [
            { id: 1, label: "Selection parfums" },
            { id: 2, label: "Choix cadeau" },
            { id: 3, label: "Confirmation" },
        ];

    return (
        <div className="rounded-[18px] border border-[#e6d8c2] bg-white/88 p-3 shadow-[0_10px_26px_rgba(26,16,6,0.05)]" dir={dir}>
            <div className="grid grid-cols-3 gap-2">
                {steps.map((step) => {
                    const isDone = step.id < current;
                    const isCurrent = step.id === current;
                    return (
                        <div
                            key={step.id}
                            className={`rounded-[12px] px-2 py-2 text-center transition ${isCurrent
                                ? "bg-[#2f8f5b] text-white"
                                : isDone
                                    ? "bg-[#eaf7f0] text-[#2f8f5b]"
                                    : "bg-[#f7efe3] text-zinc-500"
                                }`}
                        >
                            <div className="text-[12px] font-black">{step.id}</div>
                            <div className="mt-0.5 text-[11px] font-semibold leading-tight">{step.label}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
