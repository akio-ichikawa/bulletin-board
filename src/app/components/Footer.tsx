import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-4 mt-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">© {new Date().getFullYear()} 市川デザイン事務所</p>
        <p className="text-xs mt-2">
          このウェブサイトの一切の責任は利用者の責任とし、製作者は一切の責を負いません。
        </p>
      </div>
    </footer>
  );
};

export default Footer; 