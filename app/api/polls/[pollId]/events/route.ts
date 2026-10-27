//SSE GET REQ HANDLER
//1. CREATE SSE STREAM, REGISTER CB TO pollEvents.ts (subscribe())

import { getOptionsWithVotesById } from "@/lib/dbActions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(
    req: Request,
    { params }: { params: Promise<{ pollId: string }> }
) {
    console.log("SSE ROUTE HIT", req.url);

    const { pollId } = await params;
    console.log("POLL ID", pollId);

    const encoder = new TextEncoder();

    let controllerRef: ReadableStreamDefaultController | undefined;
    let interval: ReturnType<typeof setInterval> | undefined;
    let closed = false;
    let checking = false;
    let last = "";

    const cleanup = () => {
        if (closed) return;
        closed = true;
        if (interval) clearInterval(interval);
        req.signal.removeEventListener("abort", cleanup);
        try {
            controllerRef?.close();
        } catch {}
    };

    const tick = async () => {
        console.log("tick called");
        if (checking || closed) return;
        checking = true;
        try {
            let payload: string;
            try {
                payload = JSON.stringify({
                    poll: await getOptionsWithVotesById(pollId),
                });
            } catch (err) {
                console.error("query failed", err);
                return; // DB pool error, keep the stream alive
            }
            if (closed) return;
            try {
                // only send data when something changed; otherwise send a comment as a heartbeat
                const chunk =
                    payload !== last ? `data: ${payload}\n\n` : `: ping\n\n`;
                last = payload;
                controllerRef?.enqueue(encoder.encode(chunk));
            } catch {
                cleanup(); // enqueue failing means the client is gone
            }
        } finally {
            checking = false;
        }
    };
    const stream = new ReadableStream({
        start(controller) {
            controllerRef = controller;
            if (req.signal.aborted) return cleanup();
            req.signal.addEventListener("abort", cleanup, { once: true });

            controller.enqueue(encoder.encode(`retry: 15000\n\n`)); // slower reconnects
            tick();
            interval = setInterval(tick, 5000);
        },
        cancel: cleanup,
    });
    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}
