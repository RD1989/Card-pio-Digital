import { Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 w-full max-w-lg mx-auto">
        <Outlet />
      </div>
    </div>
  );
}
