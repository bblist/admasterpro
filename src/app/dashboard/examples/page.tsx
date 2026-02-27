"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/context";

export default function ExamplesRedirect() {
    const router = useRouter();
    const { t } = useTranslation();

    useEffect(() => {
        router.replace("/dashboard/demo/examples");
    }, [router]);

    return (
        <div className="flex items-center justify-center h-64">
            <p className="text-sm text-muted">{t("examples.redirecting")}</p>
        </div>
    );
}
