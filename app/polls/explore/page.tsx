import Poll from "@/components/poll";
import {
    getOptionsWithVotesById,
    getPolls,
    getUserById,
} from "@/lib/dbActions";

export const dynamic = "force-dynamic";

export default async function Page() {
    const polls = await getPolls();

    const items = await Promise.all(
        polls.map(async (poll) => {
            const [options, user] = await Promise.all([
                getOptionsWithVotesById(poll.id),
                getUserById(poll.user_id),
            ]);
            return { poll, options, user };
        })
    );

    return (
        <div className="w-full">
            {items.map(({ poll, options, user }) =>
                user ? (
                    <Poll
                        key={poll.id}
                        poll={poll}
                        got_options={options}
                        username={user.username}
                        userId={user.id}
                    />
                ) : null
            )}
        </div>
    );
}
