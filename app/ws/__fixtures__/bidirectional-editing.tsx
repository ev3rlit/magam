export const MOVE_FIXTURE_TSX = `
export default function MoveFixture() {
  return (
    <Canvas>
      <Node id="move-1" x={40} y={80} label={"keep"} />
      <Node id="move-2" x={120} y={200} label={"stay"} />
    </Canvas>
  );
}
`;

export const TEXT_FIXTURE_TSX = `
export default function TextFixture() {
  return (
    <Canvas>
      <Node id="text-1">
        <Markdown>{\`# Title\\nold\`}</Markdown>
      </Node>
      <Text id="text-2">plain-old</Text>
    </Canvas>
  );
}
`;

export const ATTACH_FIXTURE_TSX = `
export default function AttachFixture() {
  return (
    <Canvas>
      <Node id="target" x={100} y={100} width={200} height={120} />
      <WashiTape
        id="washi-1"
        at={{ type: "attach", target: "target", placement: "top", span: 0.8, align: 0.5, offset: 12 }}
      />
      <Sticky
        id="sticker-1"
        anchor={"target"}
        position={"right"}
        align={"center"}
        gap={24}
      />
    </Canvas>
  );
}
`;

export const BIDIRECTIONAL_EDITING_FIXTURES = {
  move: MOVE_FIXTURE_TSX,
  text: TEXT_FIXTURE_TSX,
  attach: ATTACH_FIXTURE_TSX,
} as const;
