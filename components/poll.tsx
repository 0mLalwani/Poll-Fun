"use client";
import { UUID } from "crypto";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { use, useEffect, useState } from "react";
import voteService from "@/app/polls/actions";
import { useRouter } from "next/navigation";

export type Option = {
    id: UUID;
    poll_id: UUID;
    title: string;
    vote_count: number;
};

export type Poll = {
    id: UUID;
    title: string;
    user_id: UUID;
    status: "OPEN" | "CLOSED";
    created_at: Date;
    expires_at: Date;
};

function getUUIDCookie() {
    const obj = {
        optionId: "",
        voteId: "",
    };
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cookieArr = document.cookie.split(";");
    cookieArr.map((cookie) => {
        const [key, value] = cookie.trim().split("=");
        if (uuidRegex.test(key)) {
            obj.optionId = key;
            obj.voteId = value;
        }
    });
    return obj;
}

export default function Poll({
    poll,
    options,
    username,
    userId,
}: {
    poll: Poll;
    options: Option[];
    username: string;
    userId: UUID;
}) {
    const [errors, setErrors] = useState("");
    const [selectedOptionId, setSelectedOptionId] = useState<UUID>();

    const { optionId, voteId } = getUUIDCookie();
    const today_date = new Date();
    const expiryMs = poll.expires_at.getTime() - today_date.getTime();

    const handleClick = async () => {
        const resp = await voteService(poll.id, selectedOptionId as string);
        if (typeof resp === "string") {
            setErrors(resp);
        }
    };

    const router = useRouter();
    useEffect(() => {
        const source = new EventSource(`/api/polls/${poll.id}/events`);

        source.onopen = () => console.log("SSE connected; let's go", poll.id);
        source.onerror = (e) =>
            console.log("SSE error; connection disrupted?", e);
        source.addEventListener("poll.updated", (e) => {
            console.log("SSE EVENT RECEIVED", e.data);
            router.refresh();
        });

        return () => source.close();
    }, [poll.id, router]);

    return (
        <Card className="max-w-150 border">
            <CardHeader>
                <CardTitle>{poll.title}</CardTitle>
                <CardAction>
                    Expires in {Math.ceil(expiryMs / (24 * 60 * 60 * 1000))}{" "}
                    days
                </CardAction>
                <p>
                    {" "}
                    {errors && <p className="text-xs text-red-400">{errors}</p>}
                </p>
            </CardHeader>
            <CardContent>
                <form onSubmit={(e) => e.preventDefault()}>
                    {options.map((option) => {
                        return (
                            <div
                                className={` ${voteId === option.id && `bg-muted`} flex justify-between ${voteId === option.id && `border`} p-2`}
                                key={option.id}
                            >
                                <div className="flex w-full gap-2 p-2">
                                    <Input
                                        onClick={() =>
                                            setSelectedOptionId(option.id)
                                        }
                                        type="radio"
                                        id={option.id}
                                        name={poll.id}
                                        className="w-4"
                                    />
                                    <Label
                                        className="w-full"
                                        htmlFor={option.id}
                                    >
                                        {option.title}
                                    </Label>
                                </div>
                                <p className="flex flex-none items-center justify-center">
                                    {option.vote_count} votes
                                </p>
                            </div>
                        );
                    })}
                </form>
            </CardContent>
            <CardFooter className="flex justify-between">
                <div className="grid gap-2">
                    <CardDescription>Created by {username}</CardDescription>
                    <p>{poll.created_at.toDateString()}</p>
                </div>
                <Button onClick={handleClick}>Vote</Button>
            </CardFooter>
        </Card>
    );
}
