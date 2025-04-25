import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Post } from '../types/post';

interface PostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

export default function PostModal({ post, isOpen, onClose }: PostModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleEdit = () => {
    router.push(`/posts/${post.id}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('この投稿を削除してもよろしいですか？')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('投稿の削除に失敗しました');
      }

      onClose();
      router.refresh();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('投稿の削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  const isAuthor = session?.user?.email === post.user?.email;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{post.eventName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">アーティスト</h3>
              <p className="mt-1 text-gray-900">{post.artistName || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">日付</h3>
              <p className="mt-1 text-gray-900">{post.date}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">時間</h3>
              <p className="mt-1 text-gray-900">{post.time}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">開催場所</h3>
              <p className="mt-1 text-gray-900">{post.location}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">開催都道府県</h3>
              <p className="mt-1 text-gray-900">{post.prefecture}</p>
            </div>
          </div>

          {post.website && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">投稿者公式サイト</h3>
              <a
                href={post.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-blue-600 hover:text-blue-800"
              >
                {post.website}
              </a>
            </div>
          )}

          {post.comment && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">コメント</h3>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{post.comment}</p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-end items-center text-sm text-gray-500">
              <span>投稿日時: {new Date(post.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {isAuthor && (
          <div className="mt-6 flex gap-4">
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              編集
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              {isDeleting ? '削除中...' : '削除'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 