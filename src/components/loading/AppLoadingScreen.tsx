const AppLoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 via-teal-600 to-blue-700">
      <div className="glass-panel rounded-3xl p-10 flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400/60 to-teal-500/60 animate-breathe" />
        <p className="text-sm text-muted-foreground">Loading your workspace...</p>
      </div>
    </div>
  );
};

export default AppLoadingScreen;
