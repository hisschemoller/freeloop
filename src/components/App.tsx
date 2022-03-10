import React from 'react';
import BackgroundCanvas from './BackgroundCanvas';
import NotesCanvas from './NotesCanvas';
import ToolBox from './ToolBox';

function App() {
  return (
    <div className="bg-zinc-900 h-screen text-zinc-200">
      <div className="container mx-auto h-screen flex flex-col">
        <div className="relative bg-red-900 flex-grow">
          <BackgroundCanvas />
          <NotesCanvas />
          <ToolBox />
        </div>
        <div className="toolbar">
          <div className="pb-4 pt-1">
            <button type="button" className="button">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
