"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const ready = useCurrentUser();
    if (!ready) return <>Loading...</>
    return <>{children}</>;
}