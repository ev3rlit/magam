import { Canvas, Shape, Sticky, Edge, Text } from '@graphwrite/core';

export default () => (
    <Canvas>
        <Text id="title" x={400} y={50} className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Tailwind Styling Showcase
        </Text>

        {/* Section 1: Gradients & Shadows */}
        <Text id="sec-1" x={100} y={150} className="text-xl font-bold text-slate-600">
            Gradients & Shadows
        </Text>

        <Shape
            id="grad-1"
            label="Sunset"
            x={100}
            y={200}
            className="bg-gradient-to-br from-orange-200 to-red-300 border-none shadow-lg text-white font-bold"
        />

        <Shape
            id="grad-2"
            label="Ocean"
            x={280}
            y={200}
            className="bg-gradient-to-tr from-blue-400 to-cyan-300 border-white border-4 shadow-xl text-blue-900 rounded-2xl"
        />

        <Sticky
            id="glass-1"
            x={460}
            y={200}
            className="bg-white/30 backdrop-blur-md border border-white/50 shadow-2xl text-slate-800"
        >
            Glassmorphism Effect
        </Sticky>

        {/* Section 2: Typography & Borders */}
        <Text id="sec-2" x={100} y={400} className="text-xl font-bold text-slate-600">
            Typography & Borders
        </Text>

        <Shape
            id="typo-1"
            x={100}
            y={450}
            className="bg-white border-l-4 border-indigo-500 rounded-r-md shadow-sm font-mono text-sm text-slate-600 w-[200px]"
        >
            Border Left Accent
        </Shape>

        <Shape
            id="typo-2"
            x={330}
            y={450}
            className="bg-slate-900 text-green-400 border border-slate-700 font-mono text-xs w-[200px] shadow-inner"
        >
            Terminal Style
            console.log('Hello');
        </Shape>

        <Shape
            id="circle-1"
            x={560}
            y={450}
            type="circle"
            className="bg-white border-4 border-dashed border-pink-300 text-pink-500 font-serif italic"
        >
            Dashed
        </Shape>

        {/* Section 3: Interactions (Hover) */}
        <Text id="sec-3" x={100} y={650} className="text-xl font-bold text-slate-600">
            Hover Effects (Try hovering!)
        </Text>

        <Shape
            id="hover-1"
            label="Scale Up"
            x={100}
            y={700}
            className="bg-indigo-100 hover:scale-110 hover:bg-indigo-200 transition-all duration-300 cursor-pointer text-indigo-700"
        />

        <Shape
            id="hover-2"
            label="Rotate"
            x={280}
            y={700}
            className="bg-rose-100 hover:rotate-12 hover:bg-rose-200 transition-all duration-300 cursor-pointer text-rose-700"
        />
        <Shape
            id="hover-3"
            label="Glow"
            x={460}
            y={700}
            className="bg-amber-100 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] transition-all duration-300 cursor-pointer text-amber-800"
        />

        {/* Edges */}
        <Edge from="grad-1" to="grad-2" label="Gradient Link" className="opacity-50" />
    </Canvas>
);
