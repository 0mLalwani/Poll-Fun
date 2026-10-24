import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Page() {
    return (
        <div>
            MANAGE PAGE{" "}
            <Link href="/polls/create">
                <Button> Create Poll</Button>
            </Link>
        </div>
    );
}
