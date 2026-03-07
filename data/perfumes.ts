export type Perfume = {
    id: string;
    name: string;
    tier: "classic" | "niche";
    gender: "femme" | "homme";
    image: string;
    tags: string[];
};

export const PERFUMES: Perfume[] = [
    // Women — Classiques
    { id: "w-c-1", name: "Dior Hypnotic Poison", tier: "classic", gender: "femme", image: "/catalogues/parfums/femme/Hypnotic-Poison.webp", tags: ["حلو", "قوية", "هدية"] },
    { id: "w-c-2", name: "Jean Paul Gaultier Scandal", tier: "classic", gender: "femme", image: "/catalogues/parfums/femme/Scandal.webp", tags: ["حلو", "قوية", "سهرة"] },
    { id: "w-c-3", name: "Dolce & Gabbana L’Impératrice", tier: "classic", gender: "femme", image: "/catalogues/parfums/femme/Limperatrice.webp", tags: ["منعش", "خفيفة", "يومي"] },
    { id: "w-c-4", name: "Carolina Herrera Good Girl", tier: "classic", gender: "femme", image: "/catalogues/parfums/femme/Good-Girl.webp", tags: ["حلو", "متوسطة", "سهرة"] },
    { id: "w-c-5", name: "Giorgio Armani My Way", tier: "classic", gender: "femme", image: "/catalogues/parfums/femme/My-Way.webp", tags: ["منعش", "متوسطة", "يومي"] },
    { id: "w-c-6", name: "Paco Rabanne Olympea", tier: "classic", gender: "femme", image: "/catalogues/parfums/femme/Olympea.webp", tags: ["منعش", "خفيفة", "يومي"] },
    { id: "w-c-7", name: "Burberry Her", tier: "classic", gender: "femme", image: "/catalogues/parfums/femme/Burberry-Her.webp", tags: ["حلو", "خفيفة", "يومي"] },
    { id: "w-c-8", name: "Guerlain Mon Guerlain", tier: "classic", gender: "femme", image: "/catalogues/parfums/femme/Mon-Guerlain.webp", tags: ["حلو", "متوسطة", "يومي"] },
    { id: "w-c-9", name: "Lattafa Yara", tier: "classic", gender: "femme", image: "/catalogues/parfums/femme/Yara.webp", tags: ["حلو", "متوسطة", "يومي"] },
    { id: "w-c-10", name: "Dior Poison Girl", tier: "classic", gender: "femme", image: "/catalogues/parfums/femme/Poison-Girl.webp", tags: ["حلو", "متوسطة", "يومي"] },
    { id: "w-c-11", name: "Yves Saint Laurent Libre Intense", tier: "classic", gender: "femme", image: "/catalogues/parfums/femme/Libre-Intense.webp", tags: ["حلو", "قوية", "سهرة"] },
    { id: "w-c-12", name: "Yves Rocher Evidence", tier: "classic", gender: "femme", image: "/catalogues/parfums/femme/Evidence.webp", tags: ["منعش", "خفيفة", "يومي"] },
    { id: "w-c-13", name: "Gissah Imperial Valley", tier: "classic", gender: "femme", image: "/catalogues/parfums/femme/Gissah-Imperial-Valley.webp", tags: ["منعش", "قوية", "هدية"] },
    { id: "w-c-14", name: "Gucci Flora", tier: "classic", gender: "femme", image: "/catalogues/parfums/femme/Flora-by-Gucci.webp", tags: ["منعش", "خفيفة", "يومي"] },
    { id: "w-c-15", name: "Elie Saab Le Parfum", tier: "classic", gender: "femme", image: "/catalogues/parfums/femme/Elie-Saab-Le-Parfum.webp", tags: ["منعش", "متوسطة", "سهرة"] },
    { id: "w-c-16", name: "Francis Kurkdjian Baccarat Rouge 540", tier: "classic", gender: "femme", image: "/catalogues/parfums/femme/Baccarat-Rouge-540.webp", tags: ["حلو", "قوية", "هدية"] },
    { id: "w-c-17", name: "Alam Otur Taj", tier: "classic", gender: "femme", image: "/catalogues/parfums/femme/Taj.webp", tags: ["خشبي", "قوية", "سهرة"] },
    { id: "w-c-18", name: "Dolce & Gabbana The One Femme", tier: "classic", gender: "femme", image: "/catalogues/parfums/femme/The-One-Femme.webp", tags: ["حلو", "قوية", "سهرة"] },
    { id: "w-c-19", name: "Dior J’adore", tier: "classic", gender: "femme", image: "/catalogues/parfums/femme/Jadore.webp", tags: ["منعش", "متوسطة", "يومي"] },

    // Women — Niche
    { id: "w-n-1", name: "Kayali 28", tier: "niche", gender: "femme", image: "/catalogues/parfums/femme/Kayali-28.webp", tags: ["حلو", "قوية", "هدية"] },
    { id: "w-n-2", name: "Kayali Utopia Vanilla", tier: "niche", gender: "femme", image: "/catalogues/parfums/femme/Utopia-Vanille.webp", tags: ["حلو", "متوسطة", "سهرة"] },
    { id: "w-n-3", name: "Kayali Marshmallow", tier: "niche", gender: "femme", image: "/catalogues/parfums/femme/Marshmallow.webp", tags: ["حلو", "خفيفة", "يومي"] },
    { id: "w-n-4", name: "MFK Baccarat Rouge 540 Extrait", tier: "niche", gender: "femme", image: "/catalogues/parfums/femme/Baccarat-Rouge-540-Extrait.webp", tags: ["حلو", "قوية", "هدية"] },
    { id: "w-n-5", name: "Maison Marly Delina", tier: "niche", gender: "femme", image: "/catalogues/parfums/femme/Delina.webp", tags: ["منعش", "قوية", "سهرة"] },

    // Men — Classiques
    { id: "m-c-1", name: "Dior Sauvage Elixir", tier: "classic", gender: "homme", image: "/catalogues/parfums/homme/Sauvage-Elixir.webp", tags: ["خشبي", "قوية", "سهرة"] },
    { id: "m-c-2", name: "Armani Stronger With You", tier: "classic", gender: "homme", image: "/catalogues/parfums/homme/Stronger-With-You.webp", tags: ["حلو", "قوية", "سهرة"] },
    { id: "m-c-3", name: "Tom Ford Black Orchid", tier: "classic", gender: "homme", image: "/catalogues/parfums/homme/Black-Orchid.webp", tags: ["خشبي", "قوية", "سهرة"] },
    { id: "m-c-4", name: "Dior Homme Intense", tier: "classic", gender: "homme", image: "/catalogues/parfums/homme/Dior-Homme-Intense.webp", tags: ["خشبي", "قوية", "يومي"] },
    { id: "m-c-5", name: "Dunhill Desire", tier: "classic", gender: "homme", image: "/catalogues/parfums/homme/Desire.webp", tags: ["حلو", "متوسطة", "يومي"] },
    { id: "m-c-6", name: "Dunhill Desire Blue", tier: "classic", gender: "homme", image: "/catalogues/parfums/homme/Desire-Blue.webp", tags: ["منعش", "خفيفة", "يومي"] },
    { id: "m-c-7", name: "JPG Ultra Male", tier: "classic", gender: "homme", image: "/catalogues/parfums/homme/Ultra-Male.webp", tags: ["حلو", "قوية", "سهرة"] },
    { id: "m-c-8", name: "Dior Sauvage", tier: "classic", gender: "homme", image: "/catalogues/parfums/homme/Sauvage.webp", tags: ["منعش", "قوية", "يومي"] },
    { id: "m-c-9", name: "Chanel Bleu", tier: "classic", gender: "homme", image: "/catalogues/parfums/homme/Bleu-de-Chanel.webp", tags: ["منعش", "متوسطة", "يومي"] },
    { id: "m-c-10", name: "JPG Le Male Elixir", tier: "classic", gender: "homme", image: "/catalogues/parfums/homme/Le-Male-Elixir.webp", tags: ["حلو", "قوية", "سهرة"] },
    { id: "m-c-11", name: "Mont Blanc Legend", tier: "classic", gender: "homme", image: "/catalogues/parfums/homme/Legend.webp", tags: ["منعش", "خفيفة", "يومي"] },
    { id: "m-c-12", name: "Armani You Intensely", tier: "classic", gender: "homme", image: "/catalogues/parfums/homme/You-Intensely.webp", tags: ["حلو", "قوية", "هدية"] },
    { id: "m-c-13", name: "Lancôme Oud Bouquet", tier: "classic", gender: "homme", image: "/catalogues/parfums/homme/Oud-Bouquet.webp", tags: ["خشبي", "قوية", "سهرة"] },
    { id: "m-c-14", name: "Paco Rabanne One Million", tier: "classic", gender: "homme", image: "/catalogues/parfums/homme/One-Million.webp", tags: ["حلو", "قوية", "يومي"] },
    { id: "m-c-15", name: "Paco Rabanne Black XS", tier: "classic", gender: "homme", image: "/catalogues/parfums/homme/Black-XS.webp", tags: ["حلو", "متوسطة", "يومي"] },
    { id: "m-c-16", name: "Azzaro Wanted", tier: "classic", gender: "homme", image: "/catalogues/parfums/homme/Wanted.webp", tags: ["خشبي", "قوية", "يومي"] },
    { id: "m-c-17", name: "Paco Rabanne XS L’Exces", tier: "classic", gender: "homme", image: "/catalogues/parfums/homme/XS-Lexces.webp", tags: ["منعش", "متوسطة", "يومي"] },
    { id: "m-c-18", name: "YSL La Nuit de L’Homme", tier: "classic", gender: "homme", image: "/catalogues/parfums/homme/La-Nuit-de-LHomme.webp", tags: ["خشبي", "خفيفة", "سهرة"] },
    { id: "m-c-19", name: "Alan Bray L’Homme Legend", tier: "classic", gender: "homme", image: "/catalogues/parfums/homme/Lhomme-Legend.webp", tags: ["منعش", "متوسطة", "يومي"] },

    // Men — Niche
    { id: "m-n-1", name: "LV Ombre Nomade", tier: "niche", gender: "homme", image: "/catalogues/parfums/homme/Ombre-Nomade.webp", tags: ["خشبي", "قوية", "هدية"] },
    { id: "m-n-2", name: "LV Imagination", tier: "niche", gender: "homme", image: "/catalogues/parfums/homme/Imagination.webp", tags: ["منعش", "قوية", "يومي"] },
    { id: "m-n-3", name: "Xerjoff Erba Pura", tier: "niche", gender: "homme", image: "/catalogues/parfums/homme/Erba-Pura.webp", tags: ["حلو", "قوية", "سهرة"] },
    { id: "m-n-4", name: "Xerjoff Naxos", tier: "niche", gender: "homme", image: "/catalogues/parfums/homme/Naxos.webp", tags: ["خشبي", "قوية", "هدية"] },
    { id: "m-n-5", name: "Tom Ford Tobacco Vanille", tier: "niche", gender: "homme", image: "/catalogues/parfums/homme/Tobacco-Vanille.webp", tags: ["خشبي", "قوية", "سهرة"] },
];
