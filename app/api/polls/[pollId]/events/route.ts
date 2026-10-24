//SSE GET REQ HANDLER
//1. CREATE SSE STREAM, REGISTER CB TO pollEvents.ts (subscribe())

import { subscribeListeners } from "@/lib/pollEvents";
export const dynamic = "force-dynamic";
export async function GET(
    req: Request,
    { params }: { params: Promise<{ pollId: string }> }
) {
    console.log("SSE ROUTE HIT", req.url);

    const { pollId } = await params;
    console.log("POLL ID", pollId);

    const encoder = new TextEncoder();

    let unsubscribe = () => {};
    const stream = new ReadableStream({
        start(controller) {
            console.log("SSE STREAM STARTED");
            controller.enqueue(": connected\n\n");

            const listener = () => {
                console.log("CALLBACK FIRED:", pollId);
                controller.enqueue(
                    encoder.encode(
                        `event: poll.updated\ndata: ${JSON.stringify({ pollId })}\n\n`
                    )
                );
            };
            unsubscribe = subscribeListeners(pollId, listener);
        },
        cancel() {
            unsubscribe();
        },
    });
    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
        },
    });
}
