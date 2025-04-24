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

    const { eventName, artistName, date, time, location, website, comment } = await request.json();
    
    // 必須フィールドのバリデーション
    if (!eventName || !date || !time || !location) {
      return NextResponse.json(
        { error: 'イベント名、日付、時間、場所は必須です' },
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
        website: website || '',
        comment: comment || '',
        userId: user.id
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
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  try {
    // 過去の投稿を削除
    await deletePastPosts();

    // 検索クエリを正規化
    const normalizedQuery = query ? normalizeText(query) : null;
    console.log('Normalized query:', normalizedQuery);

    // 検索条件を構築
    let whereCondition = undefined;
    let dateStr = null;
    
    // 今日の日付を取得
    const today = new Date().toISOString().split('T')[0];
    
    // 基本の検索条件に今日以降の日付を追加
    whereCondition = {
      date: {
        gte: today
      }
    };
    
    if (normalizedQuery) {
      // 日付検索のための処理
      const dateRegex = /(\d{4}-\d{2}-\d{2})/;
      const dateMatch = normalizedQuery.match(dateRegex);
      dateStr = dateMatch ? dateMatch[1] : null;
      
      // テキスト検索用のクエリ（日付部分を除去）
      const textQuery = dateStr 
        ? normalizedQuery.replace(dateStr, '').trim()
        : normalizedQuery;

      // 検索条件の構築
      const conditions = [];

      // 日付条件の追加
      if (dateStr) {
        conditions.push({
          date: dateStr
        });
      }

      // テキスト検索条件の追加
      if (textQuery) {
        conditions.push({
          OR: [
            {
              eventName: {
                contains: textQuery,
              },
            },
            {
              artistName: {
                contains: textQuery,
              },
            },
            {
              location: {
                contains: textQuery,
              },
            },
            {
              comment: {
                contains: textQuery,
              },
            },
          ],
        });
      }

      // 条件が存在する場合、ANDで結合
      if (conditions.length > 0) {
        whereCondition = {
          AND: [
            { date: { gte: today } },
            ...conditions
          ]
        };
      }
    }

    console.log('Where condition:', JSON.stringify(whereCondition));

    // 投稿を取得
    const posts = await prisma.post.findMany({
      where: whereCondition,
      orderBy: [
        {
          date: 'asc',
        },
        {
          time: 'asc',
        }
      ],
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // より柔軟な検索を実装
    const filteredPosts = normalizedQuery && !dateStr
      ? posts.filter((post: any) => {
          // 検索対象のテキストを正規化
          const eventName = normalizeText(post.eventName);
          const artistName = normalizeText(post.artistName || '');
          const location = normalizeText(post.location);
          const comment = normalizeText(post.comment || '');
          
          // 検索クエリを空白で分割
          const queryParts = normalizedQuery.split(/\s+/).filter(part => part.length > 0);
          
          // 各部分が検索対象に含まれているかチェック
          return queryParts.every(part => {
            // 部分一致で検索
            return (
              eventName.includes(part) ||
              artistName.includes(part) ||
              location.includes(part) ||
              comment.includes(part)
            );
          });
        })
      : posts;

    console.log(`Found ${filteredPosts.length} posts`);
    return NextResponse.json(filteredPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: '投稿の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 