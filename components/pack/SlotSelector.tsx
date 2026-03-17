"use client";

import { memo } from "react";
import { FlaskConical, Lock } from "lucide-react";
import type { Perfume } from "@/data/perfumes";

type SlotSelectorCopy = {
    active: string;
    activeHint: string;
    empty: string;
    gift: string;
    locked: string;
    slot: string;
};

type SlotSelectorProps = {
    activeSlot: number;
    copy: SlotSelectorCopy;
    dir: "ltr" | "rtl";
    giftUnlocked: boolean;
    isRTL: boolean;
    onSlotClick: (index: number) => void;
    selectedPerfumes: (Perfume | null)[];
};

const GIFT_SLOT_INDEX = 5;

export const SlotSelector = memo(function SlotSelector({
    activeSlot,
    copy,
    dir,
    giftUnlocked,
    isRTL,
    onSlotClick,
    selectedPerfumes,
}: SlotSelectorProps) {
    return (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6" dir={dir}>
            {selectedPerfumes.map((perfume, index) => {
                const isGift = index === GIFT_SLOT_INDEX;
                const isActive = activeSlot === index;
                const hasPerfume = Boolean(perfume);
                const isLocked = isGift && !giftUnlocked && !hasPerfume;

                return (
                    <button
                        key={`slot-${index}`}
                        type="button"
                        onClick={() => onSlotClick(index)}
                        aria-pressed={isActive}
                        className={`flex min-h-[118px] w-full cursor-pointer flex-col justify-between rounded-[20px] border p-3 shadow-[0_14px_30px_rgba(32,26,22,0.05)] outline-none transition focus-visible:ring-2 focus-visible:ring-[#2F9E5B]/45 active:scale-[0.985] ${
                            hasPerfume
                                ? "border-[#2F9E5B] bg-[#EEF8F1] text-[#1D6B3D]"
                                : isLocked
                                    ? "border-[#DFCBAA] bg-[#FFF7EC] text-[#8A7868]"
                                    : "border-[#E6D6BE] bg-white text-[#201A16] hover:border-[#C9A86A]"
                        } ${isActive ? "ring-2 ring-[#2F9E5B]/18" : ""} ${isRTL ? "text-right" : "text-left"}`}
                    >
                        <div className={`flex items-start justify-between gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                            <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                                <span
                                    className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-[11px] font-bold ${
                                        isGift
                                            ? "bg-[#FFF1D8] text-[#B88E42]"
                                            : hasPerfume
                                                ? "bg-white text-[#2F9E5B]"
                                                : "bg-[#F7F1E8] text-[#5F5144]"
                                    }`}
                                >
                                    {isGift ? "🎁" : index + 1}
                                </span>
                                {isGift ? (
                                    <span className="rounded-full bg-white px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#B88E42]">
                                        {copy.gift}
                                    </span>
                                ) : null}
                            </div>

                            {isLocked ? (
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#8A7868]">
                                    <Lock className="h-3.5 w-3.5" />
                                </span>
                            ) : isActive ? (
                                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-[#2F9E5B]">
                                    {copy.active}
                                </span>
                            ) : null}
                        </div>

                        {hasPerfume ? (
                            <div className={`mt-2 flex items-start gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#2F9E5B]">
                                    <FlaskConical className="h-3.5 w-3.5" />
                                </span>
                                <p className="line-clamp-2 text-[13px] font-semibold leading-5 text-[#1D6B3D]">
                                    {perfume?.name}
                                </p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A7868]">
                                    {isGift ? copy.gift : `${copy.slot} ${index + 1}`}
                                </p>
                                <p className="mt-2 line-clamp-2 min-h-[36px] text-[13px] font-semibold leading-5 text-[#8A7868]">
                                    {isLocked ? copy.locked : copy.empty}
                                </p>
                                {isActive && !isLocked ? (
                                    <p className="mt-1 text-[11px] font-semibold text-[#2F9E5B]">{copy.activeHint}</p>
                                ) : null}
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
});

SlotSelector.displayName = "SlotSelector";
