import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const ProductList = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link to="/products/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg">+ New Product</Link>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-500">Dummy Data: List of products will appear here via Axios.</p>
        <ul className="mt-4 space-y-2">
          <li className="p-2 border-b flex justify-between">
            <span>iPhone 15 Pro</span>
            <Link to="/products/69915d6ae71fc07a6ba7e9a8" className="text-blue-500 underline">View Detail</Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ProductList;