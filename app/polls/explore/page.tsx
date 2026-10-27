import Poll from "@/components/poll";
import {
    getOptionsWithVotesById,
    getPolls,
    getUserById,
} from "@/lib/dbActions";

export default async function Page() {
    const polls = await getPolls();
    console.log("GOT POLLS FROM DB: ", polls);

    return (
        <div className="w-full">
            {polls.map(async (poll) => {
                // EACH POLL OBJ LIKE
                //                  {
                //     id: 'e489ca49-...',
                //     title: 'do u...',
                //     user_id: 'fd4e2a71-...',
                //     status: 'OPEN',
                //     created_at: 2026-10-20T15:05:26.929Z,
                //     expires_at: 2026-10-22T15:05:26.929Z
                //   }
                const options = await getOptionsWithVotesById(poll.id);
                console.log(`GOT OPTIONS FOR ${poll.title} :`, options);
                // GETTING OPTIONS ARRAY FOR EACH POLL OBJECT

                const user = await getUserById(poll.user_id);
                console.log("GOT USER:", user);

                return (
                    <Poll
                        key={poll.id}
                        poll={poll}
                        got_options={options}
                        username={user.username}
                        userId={user.id}
                    />
                );
            })}
        </div>
    );
}
