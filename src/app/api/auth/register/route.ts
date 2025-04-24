import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 入力値の検証
    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードは必須です' },
        { status: 400 }
      );
    }

    // メールアドレスの形式を検証
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    // パスワードの長さを検証
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'パスワードは6文字以上で入力してください' },
        { status: 400 }
      );
    }

    try {
      // 既存のユーザーをチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に登録されています' },
          { status: 400 }
        );
      }

      // パスワードをハッシュ化
      const hashedPassword = await hash(password, 12);

      // ユーザーを作成
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });

      return NextResponse.json(
        { message: 'ユーザーが正常に作成されました' },
        { status: 201 }
      );
    } catch (dbError) {
      console.error('データベースエラー:', dbError);
      return NextResponse.json(
        { error: 'データベース操作中にエラーが発生しました' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '登録中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 