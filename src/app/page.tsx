'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaCalendarAlt, FaSearch } from 'react-icons/fa';
import PostModal from './components/PostModal';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import ContactForm from './components/ContactForm';

interface Post {
  id: string;
  eventName: string;
  artistName?: string;
  date: string;
  time: string;
  location: string;
  prefecture: string;
  website?: string;
  comment?: string;
  userId: string;
  user?: {
    id: string;
    email: string;
    nickname: string;
  };
  createdAt: string;
}

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);

  // 検索ボタンクリック時の処理
  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  // Enterキー押下時の処理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 検索窓のクリアボタンクリック時の処理
  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setSelectedDate(null);
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setIsDatePickerOpen(false);
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  // リセットボタンのクリックハンドラ
  const handleReset = () => {
    setSearchQuery('');
    setSearchInput('');
    setSelectedDate(null);
    // 全ての投稿を再取得
    fetchPosts();
  };

  useEffect(() => {
    // 認証状態に関わらず投稿を取得
    fetchPosts();
    
    // ログインしている場合はユーザーIDを取得
    if (status === 'authenticated' && session?.user?.email) {
      fetchCurrentUser();
    }
  }, [searchQuery, selectedDate, status, session]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`/api/users/me`);
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      setCurrentUserId(data.id);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      // 検索クエリと日付を組み合わせて検索
      let query = searchQuery;
      
      // 日付が選択されている場合、日付を検索クエリに追加
      if (selectedDate) {
        // タイムゾーンを考慮して日付をフォーマット
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        
        // 日付のみの検索の場合は、他の検索クエリをクリア
        if (!query.trim()) {
          query = formattedDate;
        } else {
          // 既存の検索クエリがある場合は、日付を追加
          query += ` ${formattedDate}`;
        }
      }
      
      console.log('Search query:', query);
      
      // 検索クエリが空の場合は全ての投稿を取得
      const response = await fetch(`/api/posts${query ? `?q=${encodeURIComponent(query)}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPost = () => {
    // 未認証の場合はログインページにリダイレクト
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    router.push('/posts/new');
  };

  const handleEditPost = (id: string) => {
    // 未認証の場合はログインページにリダイレクト
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    router.push(`/posts/${id}/edit`);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('この投稿を削除してもよろしいですか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('投稿の削除に失敗しました');
      }

      // 投稿リストを更新
      setPosts(posts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('投稿の削除に失敗しました');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('アカウントを削除してもよろしいですか？この操作は取り消せません。')) {
      return;
    }

    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('アカウントの削除に失敗しました');
      }

      // ログアウトしてホームページにリダイレクト
      await signOut({ redirect: true, callbackUrl: '/' });
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('アカウントの削除に失敗しました');
    }
  };

  // ローディング中はローディング表示
  if (status === 'loading' || isLoading) {
    return (
      <main className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <div className="text-xl">読み込み中...</div>
      </main>
    );
  }

  // ログイン状態をコンソールに出力
  console.log('Authentication Status:', status);
  console.log('Session:', session);
  console.log('User Email:', session?.user?.email);
  console.log('投稿ボタン表示条件:', status === 'authenticated');

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-xl sm:text-3xl font-bold text-center mb-8">
          <span className="block sm:inline">わちゃわちゃイベント</span>
          <span className="block sm:inline">掲示板</span>
        </h1>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-6 sm:mb-8">
        <p className="text-yellow-800 text-xs sm:text-sm">
          ※ 掲載された情報に関して、当サイトは一切の責任を負いません。詳細については、必ず公式サイトでご確認ください。
        </p>
      </div>

      <div className="mb-8 flex justify-center">
        {status === 'authenticated' && (
          <button
            onClick={handleNewPost}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>新規投稿</span>
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="投稿を検索..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-64 pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <FaCalendarAlt />
            </button>
            <button
              onClick={handleClearSearch}
              className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            {isDatePickerOpen && (
              <div className="absolute z-50 mt-1">
                <DatePicker
                  selected={selectedDate}
                  onChange={handleDateChange}
                  inline
                  dateFormat="yyyy/MM/dd"
                  placeholderText="日付を選択"
                  className="border rounded-lg shadow-lg"
                  popperClassName="datepicker-popper"
                />
              </div>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 whitespace-nowrap"
          >
            検索
          </button>
          {(searchQuery || selectedDate) && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 whitespace-nowrap"
            >
              リセット
            </button>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded ${
              viewMode === 'table'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            テーブル表示
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`px-4 py-2 rounded ${
              viewMode === 'card'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            カード表示
          </button>
        </div>
      </div>

      <div className="h-[400px] sm:h-[500px] border border-gray-200 rounded-lg bg-white shadow-sm">
        {viewMode === 'table' ? (
          <div className="h-full overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 border-b border-r text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px] bg-gray-50">
                      タイトル
                    </th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 border-b border-r text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px] bg-gray-50">
                      名前
                    </th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 border-b border-r text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px] bg-gray-50">
                      日付
                    </th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 border-b border-r text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[80px] bg-gray-50">
                      時間
                    </th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 border-b border-r text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px] bg-gray-50">
                      開催都道府県
                    </th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 border-b border-r text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px] bg-gray-50">
                      開催場所
                    </th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 border-b border-r text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px] bg-gray-50">
                      投稿者公式サイト
                    </th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 border-b border-r text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px] bg-gray-50">
                      コメント
                    </th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 border-b border-r text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[150px] bg-gray-50">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 overflow-y-auto">
                  {posts.map((post) => (
                    <tr key={post.id}>
                      <td className="px-4 sm:px-6 py-2 sm:py-3 whitespace-nowrap border">
                        <div className="text-sm font-medium text-gray-900">
                          {post.eventName}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-2 sm:py-3 whitespace-nowrap border">
                        <div className="text-sm text-gray-900">
                          {post.artistName || '-'}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-2 sm:py-3 whitespace-nowrap border">
                        <div className="text-sm text-gray-900">{post.date}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-2 sm:py-3 whitespace-nowrap border">
                        <div className="text-sm text-gray-900">{post.time}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-2 sm:py-3 whitespace-nowrap border">
                        <div className="text-sm text-gray-900">{post.prefecture}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-2 sm:py-3 whitespace-nowrap border">
                        <div className="text-sm text-gray-900">{post.location}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-2 sm:py-3 whitespace-nowrap border">
                        <div className="text-sm text-gray-900">
                          {post.website ? (
                            <a
                              href={post.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700"
                            >
                              {post.website}
                            </a>
                          ) : (
                            '-'
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-2 sm:py-3 border">
                        <div className="text-sm text-gray-900">
                          {post.comment ? (post.comment.length > 40 ? `${post.comment.slice(0, 40)}...` : post.comment) : '-'}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-2 sm:py-3 whitespace-nowrap text-right text-sm font-medium border">
                        <button
                          onClick={() => setSelectedPost(post)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          詳細
                        </button>
                        {currentUserId === post.userId && (
                          <>
                            <Link
                              href={`/posts/${post.id}/edit`}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              編集
                            </Link>
                            <button
                              onClick={() => handleDelete(post.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              削除
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedPost(post)}
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                        {post.eventName}
                      </h2>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-500">
                          アーティスト:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {post.artistName || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">
                          日付:
                        </span>
                        <span className="ml-2 text-gray-900">{post.date}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">
                          時間:
                        </span>
                        <span className="ml-2 text-gray-900">{post.time}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">
                          開催都道府県:
                        </span>
                        <span className="ml-2 text-gray-900">{post.prefecture}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">
                          開催場所:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {post.location}
                        </span>
                      </div>
                      {post.website && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">
                            投稿者公式サイト:
                          </span>
                          <a
                            href={post.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-500 hover:text-blue-700"
                          >
                            {post.website}
                          </a>
                        </div>
                      )}
                      {post.comment && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">
                            コメント:
                          </span>
                          <p className="mt-1 text-gray-900">{post.comment}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      {currentUserId === post.userId && (
                        <div className="flex space-x-2">
                          <Link
                            href={`/posts/${post.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            編集
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(post.id);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            削除
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* バナー広告用のダミー */}
      <div className="mt-8 mb-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* スポンサーバナー */}
          {[...Array(12)].map((_, index) => (
            <div 
              key={index} 
              className={`bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-center h-20 hover:shadow-md transition-all transform hover:scale-105 ${index === 0 ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' : ''}`}
            >
              {index === 0 ? (
                <a 
                  href="https://ichikawa-design.secret.jp/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-center w-full h-full flex items-center justify-center"
                >
                  <div className="text-sm font-medium text-white">市川デザイン事務所</div>
                </a>
              ) : (
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-700">スポンサー募集中</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* モーダル */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}

      {/* お問い合わせフォーム */}
      <ContactForm
        isOpen={isContactFormOpen}
        onClose={() => setIsContactFormOpen(false)}
      />
    </main>
  );
} 