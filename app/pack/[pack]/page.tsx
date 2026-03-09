import { notFound } from "next/navigation";
import { PackExperience } from "@/components/pack/PackExperience";
import { isPackSlug, PACK_ORDER } from "@/lib/packs";

type PackPageProps = {
    params: Promise<{ pack: string }>;
};

export async function generateStaticParams() {
    return PACK_ORDER.map((pack) => ({ pack }));
}

export default async function PackPage({ params }: PackPageProps) {
    const resolved = await params;

    if (!isPackSlug(resolved.pack)) {
        notFound();
    }

    return <PackExperience key={resolved.pack} pack={resolved.pack} />;
}
