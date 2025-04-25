'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ContactForm from './ContactForm';

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
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

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* モバイル表示用の2段ヘッダー */}
        <div className="flex flex-col sm:hidden py-2">
          <div className="flex items-center justify-between mb-2">
            {/* タイトルを削除 */}
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsContactFormOpen(true)}
              className="px-3 py-1 text-sm text-white bg-green-600 hover:bg-green-700 rounded whitespace-nowrap"
            >
              お問い合わせ
            </button>
            {session ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDeleteAccount}
                  className="px-3 py-1 text-sm text-white bg-red-600 hover:bg-red-700 rounded whitespace-nowrap"
                >
                  アカウント削除
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 text-sm text-white bg-red-600 hover:bg-red-700 rounded whitespace-nowrap"
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/register"
                  className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded whitespace-nowrap"
                >
                  新規登録
                </Link>
                <Link
                  href="/login"
                  className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded whitespace-nowrap"
                >
                  ログイン
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* デスクトップ表示用の1段ヘッダー */}
        <div className="hidden sm:flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-gray-800">
            わちゃわちゃイベント掲示板
          </Link>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsContactFormOpen(true)}
              className="px-3 py-1 text-sm text-white bg-green-600 hover:bg-green-700 rounded whitespace-nowrap"
            >
              お問い合わせ
            </button>
            {session ? (
              <>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDeleteAccount}
                    className="px-3 py-1 text-sm text-white bg-red-600 hover:bg-red-700 rounded whitespace-nowrap"
                  >
                    アカウント削除
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 text-sm text-white bg-red-600 hover:bg-red-700 rounded whitespace-nowrap"
                  >
                    ログアウト
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/register"
                  className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded whitespace-nowrap"
                >
                  新規登録
                </Link>
                <Link
                  href="/login"
                  className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded whitespace-nowrap"
                >
                  ログイン
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <ContactForm
        isOpen={isContactFormOpen}
        onClose={() => setIsContactFormOpen(false)}
      />
    </header>
  );
} 