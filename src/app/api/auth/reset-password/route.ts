import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// パスワードリセットトークンの生成
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// パスワードリセットメールの送信（実際のメール送信は実装が必要）
const sendResetEmail = async (email: string, token: string) => {
  // ここにメール送信の実装を追加
  console.log(`Reset password email sent to ${email} with token ${token}`);
};

// パスワードリセットリクエストの処理
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスを入力してください' },
        { status: 400 }
      );
    }

    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'このメールアドレスは登録されていません' },
        { status: 404 }
      );
    }

    // リセットトークンの生成
    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1時間後

    // リセットトークンの保存
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // リセットメールの送信
    await sendResetEmail(email, resetToken);

    return NextResponse.json(
      { message: 'パスワードリセットのメールを送信しました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in password reset request:', error);
    return NextResponse.json(
      { error: 'パスワードリセットの処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// パスワードの更新
export async function PUT(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'トークンと新しいパスワードを入力してください' },
        { status: 400 }
      );
    }

    // トークンの検証
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: '無効なトークンまたは期限切れのトークンです' },
        { status: 400 }
      );
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // パスワードの更新
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return NextResponse.json(
      { message: 'パスワードを更新しました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in password update:', error);
    return NextResponse.json(
      { error: 'パスワードの更新中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 