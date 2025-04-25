'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

interface FormState {
  eventName: string;
  comment: string;
  date: string;
  artistName: string;
  location: string;
  time: string;
  prefecture: string;
}

const initialFormState: FormState = {
  eventName: '',
  comment: '',
  date: '',
  artistName: '',
  location: '',
  time: '',
  prefecture: '',
};

// 入力値のサニタイズ関数
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // XSS対策
    .replace(/[\x00-\x1F\x7F]/g, ''); // 制御文字の除去
};

export default function PostForm() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // フォームの状態をセッションストレージから復元
  useEffect(() => {
    const savedForm = sessionStorage.getItem('postForm');
    if (savedForm) {
      try {
        const formData = JSON.parse(savedForm);
        setFormState(prevState => ({
          ...prevState,
          ...formData,
        }));
      } catch (error) {
        console.error('Failed to parse saved form data:', error);
      }
    }
  }, []);

  // フォームの状態をセッションストレージに保存
  useEffect(() => {
    sessionStorage.setItem('postForm', JSON.stringify(formState));
  }, [formState]);

  // メモ化されたフォームデータ
  const formData = useMemo(() => formState, [formState]);

  // メモ化されたバリデーション関数
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formState.eventName) {
      errors.eventName = 'イベント名を入力してください';
    } else if (formState.eventName.length > 100) {
      errors.eventName = 'イベント名は100文字以内で入力してください';
    }

    if (!formState.artistName) {
      errors.artistName = 'アーティスト名を入力してください';
    } else if (formState.artistName.length > 100) {
      errors.artistName = 'アーティスト名は100文字以内で入力してください';
    }

    if (!formState.date) {
      errors.date = '日付を選択してください';
    } else {
      const selectedDate = new Date(formState.date);
      selectedDate.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        errors.date = '過去の日付は選択できません';
      }
    }

    if (!formState.time) {
      errors.time = '時間を選択してください';
    }

    if (!formState.location) {
      errors.location = '場所を入力してください';
    } else if (formState.location.length > 200) {
      errors.location = '場所は200文字以内で入力してください';
    }

    if (!formState.prefecture) {
      errors.prefecture = '都道府県を選択してください';
    }

    if (formState.comment && formState.comment.length > 1000) {
      errors.comment = 'コメントは1000文字以内で入力してください';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formState]);

  // メモ化されたリセット関数
  const resetForm = useCallback(() => {
    setFormState(initialFormState);
    setError('');
    setFieldErrors({});
    setRetryCount(0);
    setFocusedField(null);
    sessionStorage.removeItem('postForm');
  }, []);

  // メモ化されたキャンセル関数
  const handleCancel = useCallback(() => {
    if (window.confirm('入力内容を破棄しますか？')) {
      resetForm();
      router.back();
    }
  }, [resetForm, router]);

  // メモ化された送信関数
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const submitPost = async () => {
      try {
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '投稿に失敗しました');
        }

        resetForm();
        router.push('/');
        router.refresh();
      } catch (error) {
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setTimeout(submitPost, RETRY_DELAY);
        } else {
          setError(error instanceof Error ? error.message : '投稿に失敗しました');
          setIsLoading(false);
        }
      }
    };

    await submitPost();
  }, [formData, validateForm, resetForm, router, retryCount]);

  // メモ化された入力値変更ハンドラ
  const handleInputChange = useCallback((field: keyof FormState, value: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: sanitizeInput(value),
    }));
  }, []);

  // メモ化されたフォーカスハンドラ
  const handleFocus = useCallback((field: string) => {
    setFocusedField(field);
  }, []);

  // メモ化された最小日付取得関数
  const getMinDate = useCallback(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="イベント投稿フォーム">
      {error && (
        <div 
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
          role="alert"
          aria-live="polite"
        >
          {error}
          {retryCount > 0 && (
            <p className="mt-1 text-sm">
              リトライ回数: {retryCount}/{MAX_RETRIES}
            </p>
          )}
        </div>
      )}
      
      <div>
        <label htmlFor="eventName" className="block text-sm font-medium text-gray-700">
          イベント名 *
        </label>
        <input
          type="text"
          id="eventName"
          value={formState.eventName}
          onChange={(e) => handleInputChange('eventName', e.target.value)}
          onFocus={() => handleFocus('eventName')}
          required
          maxLength={100}
          placeholder="例: サマーフェスティバル 2024"
          aria-required="true"
          aria-invalid={!!fieldErrors.eventName}
          aria-describedby={fieldErrors.eventName ? 'eventName-error' : undefined}
          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
            fieldErrors.eventName ? 'border-red-300' : 'border-gray-300'
          } ${focusedField === 'eventName' ? 'ring-2 ring-indigo-500' : ''}`}
        />
        {fieldErrors.eventName && (
          <p id="eventName-error" className="mt-1 text-sm text-red-600" role="alert">
            {fieldErrors.eventName}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="artistName" className="block text-sm font-medium text-gray-700">
          アーティスト名 *
        </label>
        <input
          type="text"
          id="artistName"
          value={formState.artistName}
          onChange={(e) => handleInputChange('artistName', e.target.value)}
          onFocus={() => handleFocus('artistName')}
          required
          maxLength={100}
          placeholder="例: アーティスト名"
          aria-required="true"
          aria-invalid={!!fieldErrors.artistName}
          aria-describedby={fieldErrors.artistName ? 'artistName-error' : undefined}
          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
            fieldErrors.artistName ? 'border-red-300' : 'border-gray-300'
          } ${focusedField === 'artistName' ? 'ring-2 ring-indigo-500' : ''}`}
        />
        {fieldErrors.artistName && (
          <p id="artistName-error" className="mt-1 text-sm text-red-600" role="alert">
            {fieldErrors.artistName}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          日付 *
        </label>
        <input
          type="date"
          id="date"
          value={formState.date}
          onChange={(e) => handleInputChange('date', e.target.value)}
          onFocus={() => handleFocus('date')}
          min={getMinDate()}
          required
          aria-required="true"
          aria-invalid={!!fieldErrors.date}
          aria-describedby={fieldErrors.date ? 'date-error' : undefined}
          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
            fieldErrors.date ? 'border-red-300' : 'border-gray-300'
          } ${focusedField === 'date' ? 'ring-2 ring-indigo-500' : ''}`}
        />
        {fieldErrors.date && (
          <p id="date-error" className="mt-1 text-sm text-red-600" role="alert">
            {fieldErrors.date}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="time" className="block text-sm font-medium text-gray-700">
          時間 *
        </label>
        <input
          type="time"
          id="time"
          value={formState.time}
          onChange={(e) => handleInputChange('time', e.target.value)}
          onFocus={() => handleFocus('time')}
          required
          aria-required="true"
          aria-invalid={!!fieldErrors.time}
          aria-describedby={fieldErrors.time ? 'time-error' : undefined}
          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
            fieldErrors.time ? 'border-red-300' : 'border-gray-300'
          } ${focusedField === 'time' ? 'ring-2 ring-indigo-500' : ''}`}
        />
        {fieldErrors.time && (
          <p id="time-error" className="mt-1 text-sm text-red-600" role="alert">
            {fieldErrors.time}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="prefecture" className="block text-sm font-medium text-gray-700">
          都道府県 *
        </label>
        <select
          id="prefecture"
          value={formState.prefecture}
          onChange={(e) => handleInputChange('prefecture', e.target.value)}
          onFocus={() => handleFocus('prefecture')}
          required
          aria-required="true"
          aria-invalid={!!fieldErrors.prefecture}
          aria-describedby={fieldErrors.prefecture ? 'prefecture-error' : undefined}
          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
            fieldErrors.prefecture ? 'border-red-300' : 'border-gray-300'
          } ${focusedField === 'prefecture' ? 'ring-2 ring-indigo-500' : ''}`}
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
        {fieldErrors.prefecture && (
          <p id="prefecture-error" className="mt-1 text-sm text-red-600" role="alert">
            {fieldErrors.prefecture}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
          場所 *
        </label>
        <input
          type="text"
          id="location"
          value={formState.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          onFocus={() => handleFocus('location')}
          required
          maxLength={200}
          placeholder="例: 東京ドーム"
          aria-required="true"
          aria-invalid={!!fieldErrors.location}
          aria-describedby={fieldErrors.location ? 'location-error' : undefined}
          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
            fieldErrors.location ? 'border-red-300' : 'border-gray-300'
          } ${focusedField === 'location' ? 'ring-2 ring-indigo-500' : ''}`}
        />
        {fieldErrors.location && (
          <p id="location-error" className="mt-1 text-sm text-red-600" role="alert">
            {fieldErrors.location}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
          コメント
        </label>
        <textarea
          id="comment"
          value={formState.comment}
          onChange={(e) => handleInputChange('comment', e.target.value)}
          onFocus={() => handleFocus('comment')}
          rows={4}
          maxLength={1000}
          placeholder="イベントの詳細や注意事項などを入力してください"
          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 ${
            focusedField === 'comment' ? 'ring-2 ring-indigo-500' : ''
          }`}
        />
        {fieldErrors.comment && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {fieldErrors.comment}
          </p>
        )}
      </div>

      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={isLoading}
          className={`flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            isLoading
              ? 'bg-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          }`}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg 
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {retryCount > 0 ? `リトライ中... (${retryCount}/${MAX_RETRIES})` : '投稿中...'}
            </span>
          ) : (
            '投稿する'
          )}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
} 