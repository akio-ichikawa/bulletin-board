import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// メール送信の設定
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    // お問い合わせをデータベースに保存
    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        subject,
        message,
      },
    });

    // メール送信
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_TO,
        subject: `【お問い合わせ】${subject}`,
        text: `
お問い合わせがありました。

名前: ${name}
メールアドレス: ${email}
件名: ${subject}

メッセージ:
${message}
        `,
      });
      console.log('Email sent successfully');
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // メール送信に失敗しても、データベースへの保存は成功しているので続行
      return NextResponse.json(
        { 
          success: true, 
          contact,
          warning: 'お問い合わせは保存されましたが、メール送信に失敗しました。管理者に連絡してください。'
        }
      );
    }

    return NextResponse.json({ success: true, contact });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'お問い合わせの送信に失敗しました' },
      { status: 500 }
    );
  }
} 