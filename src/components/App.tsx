import React from 'react';
import Canvas from './Canvas';

function App() {
  return (
    <div className="bg-zinc-900 h-screen text-zinc-200">
      <div className="container mx-auto h-screen flex flex-col">
        <div>
          <button type="button" className="button">Click</button>
        </div>
        <div className="bg-red-900 flex-grow">
          <Canvas />
        </div>
      </div>
    </div>
  );
}

export default App;
