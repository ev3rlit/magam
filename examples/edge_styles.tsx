export default (
    <graph>
        <graph-sticky id="a" x={100} y={100} color="red">
            Edge Styles Demo
        </graph-sticky>

        <graph-sticky id="b" x={400} y={100} color="blue">
            Target 1
        </graph-sticky>

        <graph-sticky id="c" x={400} y={300} color="green">
            Target 2
        </graph-sticky>

        <graph-sticky id="d" x={100} y={300} color="yellow">
            Target 3
        </graph-sticky>

        {/* Default Edge (Smoothstep, Solid) */}
        <graph-edge from="a" to="b" label="default solid" />

        {/* Straight + Dashed */}
        <graph-edge from="b" to="c" type="straight" className="dashed" label="straight dashed" />

        {/* Curved + Dotted */}
        <graph-edge from="c" to="d" type="curved" className="border-dotted" label="curved dotted" />

        {/* Step + Solid (Default style) */}
        <graph-edge from="d" to="a" type="step" label="step solid" />

    </graph>
);
