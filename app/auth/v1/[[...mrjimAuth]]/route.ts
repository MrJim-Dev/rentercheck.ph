import { createMountedAuthHandler } from "@/lib/mrjim-auth/mounted-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = createMountedAuthHandler();
export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS };
