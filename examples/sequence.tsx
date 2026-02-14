import { Canvas, Sequence, Participant, Message } from "@magam/core";

export default function AuthFlow() {
  return (
    <Canvas>
      <Sequence id="auth" participantSpacing={200} messageSpacing={60}>
        <Participant id="user" label="User" />
        <Participant id="browser" label="Browser" />
        <Participant id="server" label="Auth Server" />
        <Participant id="db" label="Database" />

        <Message from="user" to="browser" label="Enter credentials" />
        <Message from="browser" to="server" label="POST /login" />
        <Message from="server" to="db" label="SELECT user" />
        <Message from="db" to="server" label="User record" type="reply" />
        <Message from="server" to="browser" label="200 OK + JWT" type="reply" />
        <Message from="browser" to="browser" label="Store token" type="self" />
      </Sequence>
    </Canvas>
  );
}
