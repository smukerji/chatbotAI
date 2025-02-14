import { openai } from '@/app/openai';

export const runtime = 'nodejs';

// Send a new message to a thread
export async function POST(request: any, { params: { threadId } }: any) {
	const { content, assistantId } = await request.json();

	let userQuery = `{ userQuery: ${content} }`;
	await openai.beta.threads.messages.create(threadId, {
		role: 'user',
		content: userQuery,
	});

	const stream = openai.beta.threads.runs.stream(threadId, {
		assistant_id: assistantId,
	});

	return new Response(stream.toReadableStream());
}
