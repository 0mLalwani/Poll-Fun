import MainSidebar from "@/components/main-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <SidebarProvider>
            <MainSidebar />
            <main className="relative flex w-full">
                <SidebarTrigger className="absolute" />
                {children}
            </main>
        </SidebarProvider>
    );
}
