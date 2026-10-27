//SSE GET REQ HANDLER
//1. CREATE SSE STREAM, REGISTER CB TO pollEvents.ts (subscribe())

import { getOptionsWithVotesById } from "@/lib/dbActions";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ pollId: string }> }
) {
    console.log("SSE ROUTE HIT", req.url);

    const { pollId } = await params;
    console.log("POLL ID", pollId);
    const encoder = new TextEncoder();

    let interval: ReturnType<typeof setInterval> | undefined;
    let closed = false;
    let checking = false;

    const cleanup = () => {
        if (closed) return;
        closed = true;

        if (interval) clearInterval(interval);

        req.signal.removeEventListener("abort", cleanup);

        console.log("CLEANUP FN CALLED:", pollId);
    };

    const stream = new ReadableStream({
        start(controller) {
            console.log("SSE STREAM STARTED");
            const listener = async () => {
                if (checking || closed) return;
                checking = true;
                try {
                    console.log("CALLBACK FIRED:", pollId);
                    const poll = await getOptionsWithVotesById(pollId);
                    if (closed) return;
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ poll })}\n\n`)
                    );
                } catch (err) {
                    if (!closed) console.error(err);
                } finally {
                    checking = false;
                }
            };
            listener();

            interval = setInterval(() => {
                listener();
            }, 4500);

            req.signal.addEventListener("abort", cleanup, { once: true });
        },
        cancel() {
            cleanup();
        },
    });
    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
        },
    });
}
