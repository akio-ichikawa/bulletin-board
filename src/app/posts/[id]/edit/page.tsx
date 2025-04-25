'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Post {
  id: string;
  eventName: string;
  artistName?: string;
  date: string;
  time: string;
  location: string;
  website?: string;
  comment?: string;
  prefecture: string;
}

export default function EditPost({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchPost();
    }
  }, [status, params.id, router]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${params.id}`);
      if (!response.ok) throw new Error('投稿の取得に失敗しました');
      const data = await response.json();
      setPost(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!post) return;

    try {
      const response = await fetch(`/api/posts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(post),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '投稿の更新に失敗しました');
      }

      router.push('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '投稿の削除に失敗しました');
      }

      router.push('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <div className="text-xl">読み込み中...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-500">{error}</div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <div className="text-xl">投稿が見つかりません</div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-8">投稿の編集</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-2xl" autoComplete="off">
        <div className="mb-4">
          <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-1">
            イベント名 *
          </label>
          <input
            type="text"
            id="eventName"
            name="eventName"
            required
            value={post.eventName}
            onChange={(e) => setPost({ ...post, eventName: e.target.value })}
            autoComplete="new-password"
            spellCheck="false"
            autoCorrect="off"
            className={`w-full px-4 py-2 border rounded-lg ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="artistName" className="block text-sm font-medium text-gray-700 mb-1">
            アーティスト名
          </label>
          <input
            type="text"
            id="artistName"
            name="artistName"
            value={post.artistName || ''}
            onChange={(e) => setPost({ ...post, artistName: e.target.value })}
            autoComplete="new-password"
            spellCheck="false"
            autoCorrect="off"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            日付 *
          </label>
          <input
            type="date"
            id="date"
            name="date"
            required
            value={post.date.split('T')[0]}
            onChange={(e) => setPost({ ...post, date: e.target.value })}
            autoComplete="new-password"
            spellCheck="false"
            autoCorrect="off"
            className={`w-full px-4 py-2 border rounded-lg ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
            時間 *
          </label>
          <input
            type="time"
            id="time"
            name="time"
            required
            value={post.time}
            onChange={(e) => setPost({ ...post, time: e.target.value })}
            autoComplete="new-password"
            spellCheck="false"
            autoCorrect="off"
            className={`w-full px-4 py-2 border rounded-lg ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="prefecture" className="block text-sm font-medium text-gray-700 mb-1">
            開催都道府県 *
          </label>
          <select
            id="prefecture"
            name="prefecture"
            required
            value={post.prefecture}
            onChange={(e) => setPost({ ...post, prefecture: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">選択してください</option>
            <option value="北海道">北海道</option>
            <option value="青森県">青森県</option>
            <option value="岩手県">岩手県</option>
            <option value="宮城県">宮城県</option>
            <option value="秋田県">秋田県</option>
            <option value="山形県">山形県</option>
            <option value="福島県">福島県</option>
            <option value="茨城県">茨城県</option>
            <option value="栃木県">栃木県</option>
            <option value="群馬県">群馬県</option>
            <option value="埼玉県">埼玉県</option>
            <option value="千葉県">千葉県</option>
            <option value="東京都">東京都</option>
            <option value="神奈川県">神奈川県</option>
            <option value="新潟県">新潟県</option>
            <option value="富山県">富山県</option>
            <option value="石川県">石川県</option>
            <option value="福井県">福井県</option>
            <option value="山梨県">山梨県</option>
            <option value="長野県">長野県</option>
            <option value="岐阜県">岐阜県</option>
            <option value="静岡県">静岡県</option>
            <option value="愛知県">愛知県</option>
            <option value="三重県">三重県</option>
            <option value="滋賀県">滋賀県</option>
            <option value="京都府">京都府</option>
            <option value="大阪府">大阪府</option>
            <option value="兵庫県">兵庫県</option>
            <option value="奈良県">奈良県</option>
            <option value="和歌山県">和歌山県</option>
            <option value="鳥取県">鳥取県</option>
            <option value="島根県">島根県</option>
            <option value="岡山県">岡山県</option>
            <option value="広島県">広島県</option>
            <option value="山口県">山口県</option>
            <option value="徳島県">徳島県</option>
            <option value="香川県">香川県</option>
            <option value="愛媛県">愛媛県</option>
            <option value="高知県">高知県</option>
            <option value="福岡県">福岡県</option>
            <option value="佐賀県">佐賀県</option>
            <option value="長崎県">長崎県</option>
            <option value="熊本県">熊本県</option>
            <option value="大分県">大分県</option>
            <option value="宮崎県">宮崎県</option>
            <option value="鹿児島県">鹿児島県</option>
            <option value="沖縄県">沖縄県</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            開催場所 *
          </label>
          <input
            type="text"
            id="location"
            name="location"
            required
            value={post.location}
            onChange={(e) => setPost({ ...post, location: e.target.value })}
            autoComplete="new-password"
            spellCheck="false"
            autoCorrect="off"
            className={`w-full px-4 py-2 border rounded-lg ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
            公式サイト
          </label>
          <input
            type="url"
            id="website"
            name="website"
            value={post.website || ''}
            onChange={(e) => setPost({ ...post, website: e.target.value })}
            autoComplete="new-password"
            spellCheck="false"
            autoCorrect="off"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
            コメント
          </label>
          <textarea
            id="comment"
            name="comment"
            value={post.comment || ''}
            onChange={(e) => setPost({ ...post, comment: e.target.value })}
            autoComplete="new-password"
            spellCheck="false"
            autoCorrect="off"
            rows={4}
            maxLength={40}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <div className="text-sm text-gray-500 mt-1">
            {(post.comment || '').length}/40文字
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            更新
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            削除
          </button>
        </div>
      </form>

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">投稿の削除</h2>
            <p className="mb-6">この投稿を削除してもよろしいですか？この操作は元に戻せません。</p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 