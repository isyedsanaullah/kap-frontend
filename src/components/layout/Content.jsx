// components/layout/Content.jsx
const Content = ({ children }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 relative">
      {/* Subtle dot-grid pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

export default Content;