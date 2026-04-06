import { Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col w-full overflow-x-hidden">
      <div className="flex-1 w-full mx-auto">
        <Outlet />
      </div>
    </div>
  );
}
