export default function LoadingSpinner({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div
        className="animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
