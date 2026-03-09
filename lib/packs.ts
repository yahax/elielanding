export type PackSlug = "mixte" | "femme" | "homme";

export type PackContent = {
    id: PackSlug;
    href: `/pack/${PackSlug}`;
    heroDesktop: string;
    heroMobile: string;
    cardImage: string;
    titleFr: string;
    titleAr: string;
    benefitFr: string;
    benefitAr: string;
    logicFr: string;
    logicAr: string;
    subtitleFr: string;
    subtitleAr: string;
};

export const PACK_ORDER: PackSlug[] = ["mixte", "femme", "homme"];

export const PACKS: Record<PackSlug, PackContent> = {
    mixte: {
        id: "mixte",
        href: "/pack/mixte",
        heroDesktop: "/catalogues/imag-landing/Desktop/Desktop-Hero-Mixte.webp",
        heroMobile: "/catalogues/imag-landing/Mobile/Mobile-version-mixte.webp",
        cardImage: "/catalogues/imag-landing/Mobile/Mobile-version-mixte.webp",
        titleFr: "Pack Mixte",
        titleAr: "Pack مختلط",
        benefitFr: "Le choix ideal pour offrir ou partager, entre senteurs feminines et masculines.",
        benefitAr: "الخيار المثالي للإهداء أو المشاركة بين النفحات النسائية والرجالية.",
        logicFr: "5 parfums au choix (30ml) + 1 parfum OFFERT",
        logicAr: "5 عطور من اختيارك (30ml) + العطر السادس هدية",
        subtitleFr: "Un équilibre élégant entre signatures féminines et masculines.",
        subtitleAr: "توازن راقٍ بين النفحات النسائية والرجالية.",
    },
    femme: {
        id: "femme",
        href: "/pack/femme",
        heroDesktop: "/catalogues/imag-landing/Desktop/Desktop-Hero-Femme.webp",
        heroMobile: "/catalogues/imag-landing/Mobile/Mobile-version-femme.webp",
        cardImage: "/catalogues/imag-landing/Mobile/Mobile-version-femme.webp",
        titleFr: "Pack Femme",
        titleAr: "Pack نسائي",
        benefitFr: "Une selection feminine raffinee, lumineuse et elegante.",
        benefitAr: "تشكيلة نسائية راقية، مشرقة وأنيقة.",
        logicFr: "5 parfums femme haute concentration (30ml) + 1 OFFERT",
        logicAr: "5 عطور نسائية بتركيز عالٍ (30ml) + 1 هدية",
        subtitleFr: "Des compositions florales, douces et intenses selon vos envies.",
        subtitleAr: "تركيبات زهرية، ناعمة وقوية حسب ذوقك.",
    },
    homme: {
        id: "homme",
        href: "/pack/homme",
        heroDesktop: "/catalogues/imag-landing/Desktop/Desktop-Hero-Homme.webp",
        heroMobile: "/catalogues/imag-landing/Mobile/Mobile-version-homme.webp",
        cardImage: "/catalogues/imag-landing/Mobile/Mobile-version-homme.webp",
        titleFr: "Pack Homme",
        titleAr: "Pack رجالي",
        benefitFr: "Une selection masculine intense, noble et charismatique.",
        benefitAr: "تشكيلة رجالية قوية، نبيلة وكاريزمية.",
        logicFr: "5 parfums homme haute concentration (30ml) + 1 OFFERT",
        logicAr: "5 عطور رجالية بتركيز عالٍ (30ml) + 1 هدية",
        subtitleFr: "Boisé, frais, oriental: composez une collection masculine premium.",
        subtitleAr: "خشبي، منعش، شرقي: كوّن مجموعة رجالية فاخرة.",
    },
};

export const PACK_LIST: PackContent[] = PACK_ORDER.map((id) => PACKS[id]);

export function isPackSlug(value: string): value is PackSlug {
    return PACK_ORDER.includes(value as PackSlug);
}
