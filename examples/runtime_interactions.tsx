import { Canvas, Shape, Sticker, Sticky, Text } from '@magam/core';

export default function RuntimeInteractionsExample() {
  return (
    <Canvas>
      <Text id="title" x={80} y={36} className="text-xl font-semibold tracking-wide text-slate-700">
        Runtime Interaction Surface
      </Text>

      <Text id="hint" x={80} y={72} className="text-sm text-slate-500">
        Hover nodes, press and hold for active styles, then press Tab to move focus across focus-enabled nodes.
      </Text>

      <Shape
        id="hover-card"
        x={80}
        y={140}
        className="w-48 lg:w-72 bg-cyan-100 text-slate-700 border-cyan-300 shadow-md hover:bg-cyan-300 hover:shadow-xl hover:ring-2 hover:ring-cyan-500"
      >
        Hover Surface
      </Shape>

      <Sticky
        id="focus-card"
        x={400}
        y={132}
        width={250}
        height={180}
        className="bg-amber-100 text-slate-700 shadow-lg focus:bg-amber-200 focus:text-slate-900 focus:ring-4 focus:ring-amber-500 focus:outline-dotted focus:outline-offset-4"
      >
        Press Tab to focus this sticky. Focus style should appear without requiring hover.
      </Sticky>

      <Sticker
        id="combo-card"
        x={120}
        y={380}
        className="w-40 md:w-52 lg:w-64 bg-violet-100 text-slate-700 shadow-md hover:bg-violet-200 focus:bg-violet-500 focus:text-white focus:ring-4 focus:ring-violet-500 active:bg-violet-700 active:text-white active:shadow-xl"
      >
        Hover + Focus + Active + Responsive
      </Sticker>

      <Shape
        id="desktop-card"
        x={470}
        y={390}
        className="w-40 md:w-56 lg:w-72 xl:w-80 bg-slate-100 text-slate-700 border-slate-300 shadow-sm hover:bg-slate-200"
      >
        Breakpoint Surface
      </Shape>
    </Canvas>
  );
}
