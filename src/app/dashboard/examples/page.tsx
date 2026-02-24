"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ExamplesRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/dashboard/demo/examples");
    }, [router]);

    return (
        <div className="flex items-center justify-center h-64">
            <p className="text-sm text-muted">Redirecting to Demo Examples...</p>
        </div>
    );
}
