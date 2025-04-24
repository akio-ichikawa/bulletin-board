'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function NewPost() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    eventName: '',
    artistName: '',
    date: '',
    time: '',
    location: '',
    website: '',
    comment: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.eventName.trim()) {
      errors.push('イベント名を入力してください');
    }

    if (!formData.date) {
      errors.push('日付を選択してください');
    } else {
      // 過去の日付をチェック
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(formData.date);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        errors.push('過去の日付は選択できません');
      }
    }

    if (!formData.time.trim()) {
      errors.push('時間を入力してください');
    }

    if (!formData.location.trim()) {
      errors.push('場所を入力してください');
    }

    if (formData.website && !isValidUrl(formData.website)) {
      errors.push('有効なURLを入力してください');
    }

    setErrors({
      eventName: errors.includes('イベント名を入力してください') ? 'イベント名を入力してください' : '',
      date: errors.includes('日付を選択してください') ? '日付を選択してください' : '',
      time: errors.includes('時間を入力してください') ? '時間を入力してください' : '',
      location: errors.includes('場所を入力してください') ? '場所を入力してください' : '',
      website: errors.includes('有効なURLを入力してください') ? '有効なURLを入力してください' : '',
    });
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted', formData);
    
    if (!validateForm()) {
      console.log('Validation failed', errors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Sending request to /api/posts');
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || '投稿の作成に失敗しました');
      }

      console.log('Post created successfully, redirecting to home');
      router.push('/');
    } catch (error) {
      console.error('Error creating post:', error);
      setErrors({
        submit: error instanceof Error ? error.message : '投稿の作成に失敗しました'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(`Field ${name} changed to:`, value);
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-8">新規投稿</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-2xl">
        <div className="mb-4">
          <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-1">
            イベント名 *
          </label>
          <input
            type="text"
            id="eventName"
            name="eventName"
            required
            value={formData.eventName}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg ${
              errors.eventName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.eventName && (
            <p className="mt-1 text-sm text-red-500">{errors.eventName}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="artistName" className="block text-sm font-medium text-gray-700 mb-1">
            アーティスト名・バンド名
          </label>
          <input
            type="text"
            id="artistName"
            name="artistName"
            value={formData.artistName}
            onChange={handleChange}
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
            value={formData.date}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg ${
              errors.date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-500">{errors.date}</p>
          )}
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
            value={formData.time}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg ${
              errors.time ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.time && (
            <p className="mt-1 text-sm text-red-500">{errors.time}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            場所 *
          </label>
          <input
            type="text"
            id="location"
            name="location"
            required
            value={formData.location}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg ${
              errors.location ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.location && (
            <p className="mt-1 text-sm text-red-500">{errors.location}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
            公式サイト
          </label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
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
            value={formData.comment}
            onChange={handleChange}
            rows={4}
            maxLength={40}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <div className="text-sm text-gray-500 mt-1">
            {formData.comment.length}/40文字
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? '投稿中...' : '投稿する'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/')}
            disabled={isSubmitting}
            className={`px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            キャンセル
          </button>
        </div>
        
        {errors.submit && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {errors.submit}
          </div>
        )}
      </form>
    </main>
  );
} 