// A-4. ログイン中のユーザー情報
import { authenticate } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;
  return Response.json({ data: user });
}
