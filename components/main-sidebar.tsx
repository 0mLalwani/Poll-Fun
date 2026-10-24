"use client";
import Link from "next/link";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    useSidebar,
} from "./ui/sidebar";
import { Button } from "./ui/button";
import handleLogOut from "@/lib/generalActions";
import { useRouter } from "next/navigation";

export default function MainSidebar() {
    const {
        state,
        open,
        setOpen,
        openMobile,
        setOpenMobile,
        isMobile,
        toggleSidebar,
    } = useSidebar();
    const router = useRouter();
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuButton
                            render={<Link href="/polls/explore" />}
                        >
                            Explore Polls
                        </SidebarMenuButton>
                        <SidebarMenuButton
                            render={<Link href="/polls/manage" />}
                        >
                            Manage Your Polls
                        </SidebarMenuButton>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <Button onClick={() => router.push("/register")}>
                    Register
                </Button>
                <Button onClick={() => router.push("/login")}>Login</Button>
                <Button onClick={handleLogOut}>Sign Out</Button>
            </SidebarFooter>
        </Sidebar>
    );
}
