// "use client";

// import { useEffect, useState } from "react";
// import { Input } from "./ui/input";
// import { Label } from "./ui/label";
// import { UUID } from "crypto";

// type PollProps = {
//     pollId: string;
//     voteCount: number;
//     selected: boolean;
//     cbFn: React.Dispatch<React.SetStateAction<string>>;
// };
// function getUUIDCookie() {
//     const obj = {
//         optionId: "",
//         voteId: "",
//     };
//     const uuidRegex =
//         /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
//     const cookieArr = document.cookie.split(";");
//     cookieArr.map((cookie) => {
//         const [key, value] = cookie.trim().split("=");
//         if (uuidRegex.test(key)) {
//             obj.optionId = key;
//             obj.voteId = value;
//         }
//     });
//     return obj;
// }

// export default function PollOption({ pollId, voteCount, cbFn }: PollProps) {
//     // const []
//     // useEffect(()=>{
//     //     //CREATE SSE listening event REQUEST HERE
//     //     const sseReq = new EventSource(`/api/polls/${pollId}/events`);
//     //     sseReq.onmessage(e => )
//     // }, [])

//     const { optionId, voteId } = getUUIDCookie();

//     return (
//         <div
//             className={` ${voteId === optionId && `bg-muted`} flex justify-between ${voteId === optionId && `border`} p-2`}
//             key={optionId}
//         >
//             <div className="flex w-full gap-2 p-2">
//                 <Input
//                     onClick={() => cbFn(optionId)}
//                     type="radio"
//                     id={optionId}
//                     name={pollId}
//                     className="w-4"
//                 />
//                 <Label className="w-full" htmlFor={optionId}>
//                     {optionId}
//                 </Label>
//             </div>
//             <p className="flex flex-none items-center justify-center">
//                 {voteCount} votes
//             </p>
//         </div>
//     );
// }
