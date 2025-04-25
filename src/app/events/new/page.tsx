'use client';

import { useState } from 'react';

export default function NewEventPage() {
  const [formData, setFormData] = useState({
    officialWebsite: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">新規イベント投稿</h1>
      <form className="space-y-6">
        <div>
          <label htmlFor="officialWebsite" className="block text-sm font-medium text-gray-700">
            投稿者公式ホームページ
          </label>
          <div className="mt-1">
            <input
              type="url"
              name="officialWebsite"
              id="officialWebsite"
              value={formData.officialWebsite}
              onChange={handleChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="https://example.com"
            />
          </div>
        </div>
      </form>
    </div>
  );
} 