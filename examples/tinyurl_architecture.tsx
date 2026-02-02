import { Canvas, Shape, Edge, Text, EdgePort } from '@graphwrite/core';

export default () => (
    <Canvas>
        <Text id="title" x={400} y={50} className="text-3xl font-extrabold text-slate-800">
            TinyURL Architecture
        </Text>

        {/* --- 1. User --- */}
        <Shape
            id="user"
            label="User"
            x={-100}
            y={200}
            width={100}
            height={60}
            className="bg-white border-2 border-slate-600 rounded-xl font-bold text-slate-700 shadow-sm"
        >
            <EdgePort id="req-out" position="right-top" />
            <EdgePort id="res-in" position="right-bottom" />
        </Shape>

        {/* --- 2. Load Balancer --- */}
        <Shape
            id="lb"
            label="Load Balancer"
            x={300}
            y={200}
            width={120}
            height={80}
            className="bg-blue-50 border-2 border-blue-500 rounded-lg text-blue-700 font-bold shadow-md"
        >
            <EdgePort id="req-in" position="left-top" />
            <EdgePort id="res-out" position="left-bottom" />
        </Shape>

        {/* --- 3. Web Servers --- */}
        <Shape
            id="servers"
            label="Web Servers"
            x={500}
            y={200}
            width={140}
            height={80}
            className="bg-slate-50 border-2 border-slate-400 border-dashed rounded-xl text-slate-700 shadow-sm"
        />

        {/* --- 4. Cache & DB --- */}
        <Shape
            id="cache"
            label="Cache"
            x={500}
            y={350}
            width={100}
            height={80}
            className="bg-purple-50 border-2 border-purple-400 rounded-lg text-purple-700 shadow-md"
        />

        <Shape
            id="db"
            label="Database"
            x={700}
            y={350}
            width={100}
            height={80}
            className="bg-orange-50 border-2 border-orange-400 rounded-lg text-orange-700 shadow-md"
        />

        {/* --- Edges --- */}
        {/* Bi-directional flow User <-> LB */}
        <Edge from="user:req-out" to="lb:req-in" label="GET /shortUrl" className="text-slate-500" />
        <Edge from="lb:res-out" to="user:res-in" label="Return URL" className="text-blue-500" />

        <Edge from="lb" to="servers" className="text-slate-500" />
        <Edge from="servers" to="cache" label="Read" className="text-purple-500" />
        <Edge from="servers" to="db" label="Write" className="text-orange-500" />

    </Canvas>
);
