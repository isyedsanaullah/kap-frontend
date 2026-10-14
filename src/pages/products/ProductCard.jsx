import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/products/${product._id}`)}
      className="cursor-pointer bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group"
    >
      <div className="p-5 pb-2 relative">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {product.name}
            </h3>
            {product.category && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{product.category}</p>
            )}
          </div>
          <div className={`ml-2 min-w-[2rem] h-6 px-2 rounded-full flex items-center justify-center shadow-md bg-gradient-to-br ${
            Number(product.stock) === 0
              ? 'from-red-500 to-red-600'
              : Number(product.stock) < 5
              ? 'from-orange-500 to-amber-500'
              : 'from-green-500 to-emerald-500'
          }`}>
            <span className="text-white font-bold text-xs">{product.stock}</span>
          </div>
        </div>

        {product.description && (
          <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 leading-relaxed mt-2">
            {product.description}
          </p>
        )}
      </div>

      <div className="px-5 pb-5 space-y-3 mt-1">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
              Dimensions
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {product.dimensions || '—'}
            </div>
          </div>
          <div className="space-y-0.5 text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
              Buy Price
            </div>
            <div className="text-base font-bold text-gray-900 dark:text-white">
              PKR {(Number(product.buyPrice) || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Stock bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Stock Level</span>
            <span className={`font-semibold ${
              Number(product.stock) === 0
                ? 'text-red-500'
                : Number(product.stock) < 5
                ? 'text-orange-500'
                : 'text-green-600 dark:text-green-400'
            }`}>
              {product.stock} units
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-1000 ${
                Number(product.stock) === 0
                  ? 'bg-red-500'
                  : Number(product.stock) < 5
                  ? 'bg-gradient-to-r from-orange-400 to-amber-500'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (Number(product.stock) / 25) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
