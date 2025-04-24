import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 過去の投稿を削除する関数
async function deletePastPosts() {
  const today = new Date().toISOString().split('T')[0];
  
  const result = await prisma.post.deleteMany({
    where: {
      date: {
        lt: today
      }
    }
  });
  
  return result;
}

// GETリクエストの処理（cronジョブ用）
export async function GET(request: Request) {
  try {
    // 過去の投稿を削除
    const result = await deletePastPosts();
    
    return NextResponse.json({
      message: `${result.count}件の過去の投稿を削除しました`,
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Error deleting past posts:', error);
    return NextResponse.json(
      { error: '過去の投稿の削除中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 