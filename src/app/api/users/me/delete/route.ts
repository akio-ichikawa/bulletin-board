import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // ユーザーの投稿を削除
    await prisma.post.deleteMany({
      where: { userId: user.id }
    });

    // ユーザーを削除
    await prisma.user.delete({
      where: { id: user.id }
    });

    return NextResponse.json(
      { message: 'アカウントを削除しました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in account deletion:', error);
    return NextResponse.json(
      { error: 'アカウントの削除中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 