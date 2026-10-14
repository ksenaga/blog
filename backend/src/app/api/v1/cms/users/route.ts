// U-1. ユーザー一覧 / U-2. ユーザー作成（管理者のみ）
import bcrypt from "bcrypt";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import {
  fieldError,
  paginationMeta,
  paginationSchema,
  searchParamsToObject,
  validationError,
} from "@/lib/api";
import { authenticate, forbiddenResponse } from "@/lib/auth";
import {
  BCRYPT_ROUNDS,
  emailSchema,
  emailTaken,
  findUserForResponse,
  nameSchema,
  passwordSchema,
  roleSchema,
  serializeUser,
  userInclude,
} from "@/lib/cms-user";
import { prisma } from "@/lib/prisma";

const listSchema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  role: roleSchema.optional(),
});

export async function GET(request: Request) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;
  if (user.role !== "admin") return forbiddenResponse();

  const parsed = listSchema.safeParse(searchParamsToObject(new URL(request.url).searchParams));
  if (!parsed.success) return validationError(parsed.error);
  const { q, role, page, per_page: perPage } = parsed.data;

  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(role && { role }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      include: userInclude,
    }),
  ]);

  return Response.json({ data: users.map(serializeUser), meta: paginationMeta(page, perPage, total) });
}

const createSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema,
});

export async function POST(request: Request) {
  const user = await authenticate(request);
  if (user instanceof Response) return user;
  if (user.role !== "admin") return forbiddenResponse();

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { name, email, password, role } = parsed.data;

  if (await emailTaken(email)) return fieldError("email", "このメールアドレスは既に使用されています");

  const created = await prisma.user.create({
    data: { name, email, role, passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS) },
  });
  return Response.json({ data: serializeUser(await findUserForResponse(created.id)) }, { status: 201 });
}
