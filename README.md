# Poll Fun

Poll Fun is a real-time polling web application built with Next.js, TypeScript, and PostgreSQL. Users can participate in polls and see vote counts update automatically without manually refreshing the page.

The project explores full-stack development with Next.js, database integration, authentication, and real-time communication using Server-Sent Events (SSE).

## Tech Stack

- **Framework:** Next.js
- **Language:** TypeScript
- **UI:** React, Tailwind CSS
- **Database:** PostgreSQL
- **Database access:** `pg`
- **Authentication:** JWT
- **Real-time communication:** Server-Sent Events (SSE)

## How Real-Time Updates Work

Poll Fun uses SSE to notify connected clients when a poll's results change.

1. A client establishes an SSE connection to a poll-specific endpoint. `/api/polls/[pollId]/events`
2. The server registers a listener for that poll. In file `pollEvents.ts -> subscribeListeners` (uses a Map PollId -> Listeners[])
3. When a user votes, the server saves the vote to a PostgresSQL DB.
4. The server publishes a poll update event. `pollEvents.ts -> publishEvent` called in `/app/polls/actions.ts -> voteService`
5. Connected clients receive the event and refresh their poll fetching new vote count.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/0mLalwani/Poll-Fun
cd poll-fun
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root and add the environment variables required by your application.

```env
DB_URL=""

rpName='Poll Fun'
rpID='localhost'
origin='http://localhost:3000'

JWT_SECRET=''
```

Replace the placeholders with your own configuration.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
