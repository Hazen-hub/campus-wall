import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id } = await params;
    const { option } = await req.json();

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post || post.type !== "poll") return NextResponse.json({ success: false, error: "投票不存在" }, { status: 404 });

    const votes: Record<string, string[]> = post.pollVotes ? JSON.parse(post.pollVotes) : {};
    // 移除该用户之前的所有投票
    for (const opt of Object.keys(votes)) {
      votes[opt] = votes[opt].filter((uid: string) => uid !== userId);
    }
    // 添加新投票
    if (!votes[option]) votes[option] = [];
    votes[option].push(userId);

    await prisma.post.update({ where: { id }, data: { pollVotes: JSON.stringify(votes) } });

    return NextResponse.json({ success: true, data: votes });
  } catch (error) {
    return NextResponse.json({ success: false, error: "投票失败" }, { status: 500 });
  }
}
