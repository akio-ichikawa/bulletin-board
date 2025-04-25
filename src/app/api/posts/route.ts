import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// 文字列を正規化する関数
function normalizeText(text: string): string {
  // 半角カタカナを全角カタカナに変換
  const hankakuToZenkaku = (str: string) => {
    return str.replace(/[\uFF61-\uFF9F]/g, (s) => {
      return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);
    });
  };
  
  // 全角英数字を半角に変換
  const zenkakuToHankaku = (str: string) => {
    return str.replace(/[\uFF21-\uFF3A\uFF41-\uFF5A\uFF10-\uFF19]/g, (s) => {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
  };
  
  // 全角スペースを半角に変換
  const zenkakuSpaceToHankaku = (str: string) => {
    return str.replace(/　/g, ' ');
  };
  
  // 連続する空白を1つに置換
  const normalizeSpaces = (str: string) => {
    return str.replace(/\s+/g, ' ').trim();
  };
  
  // 小文字に変換
  const toLowerCase = (str: string) => {
    return str.toLowerCase();
  };
  
  // すべての正規化処理を適用
  return normalizeSpaces(
    zenkakuSpaceToHankaku(
      zenkakuToHankaku(
        hankakuToZenkaku(
          toLowerCase(text)
        )
      )
    )
  );
}

// 過去の投稿を削除する関数
async function deletePastPosts() {
  const today = new Date().toISOString().split('T')[0];
  
  await prisma.post.deleteMany({
    where: {
      date: {
        lt: today
      }
    }
  });
}

// POSTリクエストの処理
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventName, artistName, date, time, location, prefecture, website, comment } = await request.json();
    
    // 必須フィールドのバリデーション
    if (!eventName || !date || !time || !location || !prefecture) {
      return NextResponse.json(
        { error: 'イベント名、日付、時間、場所、都道府県は必須です' },
        { status: 400 }
      );
    }

    // 日付の検証
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      return NextResponse.json({ error: '過去の日付では投稿できません' }, { status: 400 });
    }

    // ユーザーの取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 投稿の作成
    const post = await prisma.post.create({
      data: {
        eventName,
        artistName: artistName || '',
        date,
        time,
        location,
        prefecture,
        website: website || '',
        comment: comment || '',
        userId: user.id,
      }
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: '投稿の作成中にエラーが発生しました' }, { status: 500 });
  }
}

// GETリクエストの処理
export async function GET(request: Request) {
  try {
    // URLからクエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    // 検索条件を構築
    let whereClause: any = {};
    
    if (query) {
      // 検索クエリを正規化
      const normalizedQuery = normalizeText(query);
      
      // 検索条件を設定
      whereClause = {
        OR: [
          { eventName: { contains: query, mode: 'insensitive' } },
          { artistName: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
          { prefecture: { contains: query, mode: 'insensitive' } },
          { comment: { contains: query, mode: 'insensitive' } },
          { date: { equals: query } } // 日付での検索もサポート
        ]
      };
    }
    
    // 投稿を取得
    const posts = await prisma.post.findMany({
      where: whereClause,
      orderBy: {
        date: 'asc'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: '投稿の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 